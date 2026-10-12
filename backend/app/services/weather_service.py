import hashlib
import logging
from typing import Dict, Any, List, Optional
import requests
import pandas as pd
import numpy as np
from app.config import settings
from app.db.database import db

logger = logging.getLogger("climate_analyzer.weather_service")

class WeatherService:
    """
    Ingests and cleans historical weather data from public APIs (Open-Meteo ERA5 Reanalysis).
    Handles:
    - Missing days / gap filling
    - Outlier clipping and unit sanity
    - Caching raw responses in the NoSQL database to avoid duplicate external API queries
    """

    @staticmethod
    def _generate_cache_key(lat: float, lon: float, start_year: int, end_year: int) -> str:
        # Round lat/lon to 2 decimal places (approx ~1.1km resolution)
        normalized = f"{round(lat, 2)}_{round(lon, 2)}_{start_year}_{end_year}"
        return hashlib.md5(normalized.encode()).hexdigest()

    @classmethod
    def fetch_historical_weather(
        cls,
        latitude: float,
        longitude: float,
        start_year: int,
        end_year: int
    ) -> pd.DataFrame:
        """
        Fetch daily weather timeseries (temperature_2m_max, temperature_2m_min, precipitation_sum).
        Returns a cleaned, validated Pandas DataFrame.
        """
        cache_key = cls._generate_cache_key(latitude, longitude, start_year, end_year)
        cached_record = db.get_document("weather_cache", cache_key)

        if cached_record and "records" in cached_record:
            logger.info(f"Retrieved weather data from cache for key: {cache_key}")
            df = pd.DataFrame(cached_record["records"])
            df["date"] = pd.to_datetime(df["date"])
            return df

        # Construct request to Open-Meteo Historical Archive API
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"

        params = {
            "latitude": round(latitude, 4),
            "longitude": round(longitude, 4),
            "start_date": start_date,
            "end_date": end_date,
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "auto"
        }

        try:
            logger.info(f"Querying Open-Meteo Archive API: {params}")
            resp = requests.get(
                settings.OPEN_METEO_ARCHIVE_URL,
                params=params,
                timeout=settings.REQUEST_TIMEOUT
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            logger.error(f"Open-Meteo API query failed: {e}")
            raise RuntimeError(f"Failed to fetch historical weather data from Open-Meteo: {e}")

        if "daily" not in data or "time" not in data["daily"]:
            raise ValueError("Invalid response format received from weather API provider.")

        daily = data["daily"]
        df = pd.DataFrame({
            "date": pd.to_datetime(daily["time"]),
            "tmax": daily.get("temperature_2m_max"),
            "tmin": daily.get("temperature_2m_min"),
            "precip": daily.get("precipitation_sum")
        })

        # --- Data Cleaning & Quality Control ---
        df = cls._clean_and_impute_timeseries(df, start_date, end_date)

        # Store in NoSQL database cache
        records_to_cache = df.copy()
        records_to_cache["date"] = records_to_cache["date"].dt.strftime("%Y-%m-%d")
        db.set_document("weather_cache", cache_key, {
            "latitude": latitude,
            "longitude": longitude,
            "start_year": start_year,
            "end_year": end_year,
            "record_count": len(records_to_cache),
            "records": records_to_cache.to_dict(orient="records")
        })

        return df

    @staticmethod
    def _clean_and_impute_timeseries(df: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Ensures consistent daily frequency, interpolates gaps, removes physical impossibilities.
        """
        df = df.sort_values("date").drop_duplicates(subset=["date"])
        df = df.set_index("date")

        # Full continuous date range
        expected_index = pd.date_range(start=start_date, end=end_date, freq="D")
        df = df.reindex(expected_index)

        # Numeric conversions
        for col in ["tmax", "tmin", "precip"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Temperature quality checks:
        # Cap physical extremes: Earth surface record is -89.2°C to 56.7°C (allow margin -90°C to 65°C)
        df["tmax"] = df["tmax"].clip(lower=-90.0, upper=65.0)
        df["tmin"] = df["tmin"].clip(lower=-90.0, upper=60.0)

        # Precipitation must be non-negative
        df["precip"] = df["precip"].clip(lower=0.0, upper=1500.0)

        # Fill small missing gaps (linear interpolation for temperatures, 0 for missing precip)
        df["tmax"] = df["tmax"].interpolate(method="time").bfill().ffill()
        df["tmin"] = df["tmin"].interpolate(method="time").bfill().ffill()
        df["precip"] = df["precip"].fillna(0.0)

        # Ensure tmax >= tmin
        inconsistent = df["tmax"] < df["tmin"]
        if inconsistent.any():
            df.loc[inconsistent, "tmax"], df.loc[inconsistent, "tmin"] = (
                df.loc[inconsistent, "tmin"],
                df.loc[inconsistent, "tmax"]
            )

        df = df.reset_index().rename(columns={"index": "date"})
        return df

    @staticmethod
    def geocode_location(query: str) -> List[Dict[str, Any]]:
        """
        Geocode city or region name using Open-Meteo Geocoding API.
        """
        if not query or len(query.strip()) < 2:
            return []

        try:
            resp = requests.get(
                settings.GEOCODING_URL,
                params={"name": query.strip(), "count": 6, "language": "en", "format": "json"},
                timeout=10
            )
            resp.raise_for_status()
            results = resp.json().get("results", [])
            output = []
            for item in results:
                name_parts = [item.get("name", "")]
                if item.get("admin1"):
                    name_parts.append(item.get("admin1"))
                if item.get("country"):
                    name_parts.append(item.get("country"))
                display_name = ", ".join(name_parts)

                output.append({
                    "name": item.get("name"),
                    "display_name": display_name,
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                    "country": item.get("country"),
                    "timezone": item.get("timezone", "UTC")
                })
            return output
        except Exception as e:
            logger.error(f"Geocoding error for '{query}': {e}")
            return []
