import io
import csv
import hashlib
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.services.weather_service import WeatherService
from app.services.hazard_detector import HazardDetector
from app.services.stats_service import StatisticalAnalyzer
from app.db.database import db

logger = logging.getLogger("climate_analyzer.routes")
router = APIRouter()

PRESET_CITIES = [
    {"name": "New Delhi", "country": "India", "latitude": 28.6139, "longitude": 77.2090, "climate_type": "Subtropical / High Heatwave Vulnerability"},
    {"name": "Phoenix, AZ", "country": "United States", "latitude": 33.4484, "longitude": -112.0740, "climate_type": "Hot Desert / High Heat Island"},
    {"name": "Seville", "country": "Spain", "latitude": 37.3891, "longitude": -5.9845, "climate_type": "Mediterranean / Extreme Summer Heat"},
    {"name": "Sydney", "country": "Australia", "latitude": -33.8688, "longitude": 151.2093, "climate_type": "Southern Hemisphere / Bushfire Heatwaves"},
    {"name": "London", "country": "United Kingdom", "latitude": 51.5074, "longitude": -0.1278, "climate_type": "Temperate Maritime / Emerging Heat Spikes"},
    {"name": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "climate_type": "Humid Subtropical / High Monsoon Variability"},
    {"name": "Cairo", "country": "Egypt", "latitude": 30.0444, "longitude": 31.2357, "climate_type": "Arid Desert / Chronic Heat Stress"},
    {"name": "São Paulo", "country": "Brazil", "latitude": -23.5505, "longitude": -46.6333, "climate_type": "Subtropical Highland"}
]

def generate_analysis_cache_key(req: AnalysisRequest) -> str:
    key_str = (
        f"{round(req.latitude, 2)}_{round(req.longitude, 2)}_"
        f"{req.start_year}_{req.end_year}_{req.hazard_type}_"
        f"{req.percentile_threshold}_{req.min_consecutive_days}"
    )
    return hashlib.md5(key_str.encode()).hexdigest()

@router.get("/cities")
def get_preset_cities():
    """Return preconfigured prominent climate locations across diverse biomes."""
    return {"cities": PRESET_CITIES}

@router.get("/geocode")
def geocode_query(query: str = Query(..., min_length=2, max_length=100)):
    """Search global locations by city name or country."""
    results = WeatherService.geocode_location(query)
    return {"results": results}

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_climate_hazard(req: AnalysisRequest):
    """
    Main analysis pipeline:
    1. Checks NoSQL cache for prior analysis results
    2. Ingests & cleans historical ERA5 weather data
    3. Detects hazard events (Heatwaves, Rainfall, or Drought)
    4. Runs regression and Mann-Kendall trend tests
    5. Caches and returns structured response
    """
    if req.start_year >= req.end_year:
        raise HTTPException(status_code=400, detail="Start year must be strictly before end year.")

    if req.end_year - req.start_year < 5:
        raise HTTPException(status_code=400, detail="Analysis requires at least 5 years of historical data for statistical trend detection.")

    cache_key = generate_analysis_cache_key(req)
    cached_doc = db.get_document("analysis_cache", cache_key)
    if cached_doc:
        cached_doc["cached"] = True
        return cached_doc

    # Fetch and clean historical data
    try:
        df = WeatherService.fetch_historical_weather(
            latitude=req.latitude,
            longitude=req.longitude,
            start_year=req.start_year,
            end_year=req.end_year
        )
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        raise HTTPException(status_code=502, detail=f"Weather data service error: {str(e)}")

    # Detect hazard based on selected type
    if req.hazard_type == "heatwave":
        hazard_result = HazardDetector.detect_heatwaves(
            df=df,
            percentile_threshold=req.percentile_threshold,
            min_consecutive_days=req.min_consecutive_days
        )
    elif req.hazard_type == "heavy_rainfall":
        hazard_result = HazardDetector.detect_heavy_rainfall(
            df=df,
            percentile_threshold=req.percentile_threshold,
            min_consecutive_days=req.min_consecutive_days
        )
    elif req.hazard_type == "drought":
        hazard_result = HazardDetector.detect_drought_spells(
            df=df,
            min_consecutive_days=req.min_consecutive_days
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported hazard type: '{req.hazard_type}'")

    yearly_data = hazard_result["yearly_summary"]

    # Statistical Trend Detection
    freq_trends = StatisticalAnalyzer.analyze_trends(yearly_data, metric_key="event_count")
    dur_trends = StatisticalAnalyzer.analyze_trends(yearly_data, metric_key="total_hazard_days")

    # High-level summary insight headline
    pct_chg = freq_trends["period_comparison"]["percentage_change"]
    trend_verb = "increased" if pct_chg > 0 else ("decreased" if pct_chg < 0 else "held steady")
    summary_insight = (
        f"{req.hazard_type.capitalize()} events have {trend_verb} by {abs(pct_chg):.1f}% in {req.location_name} "
        f"since {req.start_year}. (Mann-Kendall p = {freq_trends['mann_kendall']['p_value']}, "
        f"{'significant upward trend' if freq_trends['mann_kendall']['trend'] == 'upward' else 'no statistically significant trend'})."
    )

    response_payload = {
        "location": {
            "name": req.location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "start_year": req.start_year,
            "end_year": req.end_year
        },
        "hazard_type": req.hazard_type,
        "threshold_value": hazard_result["threshold_value"],
        "threshold_unit": hazard_result["threshold_unit"],
        "threshold_percentile": hazard_result.get("threshold_percentile", req.percentile_threshold),
        "min_duration_days": req.min_consecutive_days,
        "total_events": hazard_result["total_events"],
        "events": hazard_result["events"],
        "frequency_trends": freq_trends,
        "duration_trends": dur_trends,
        "summary_insight": summary_insight,
        "cached": False
    }

    # Store in NoSQL database
    db.set_document("analysis_cache", cache_key, response_payload)

    return response_payload

@router.get("/export/csv")
def export_events_csv(
    latitude: float,
    longitude: float,
    start_year: int = 1990,
    end_year: int = 2023,
    hazard_type: str = "heatwave",
    percentile_threshold: float = 95.0,
    min_consecutive_days: int = 3
):
    """Generates downloadable CSV containing all detected hazard events."""
    req = AnalysisRequest(
        latitude=latitude,
        longitude=longitude,
        start_year=start_year,
        end_year=end_year,
        hazard_type=hazard_type,
        percentile_threshold=percentile_threshold,
        min_consecutive_days=min_consecutive_days,
        location_name="Export"
    )
    analysis = analyze_climate_hazard(req)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Event ID", "Hazard Type", "Start Date", "End Date", "Duration (Days)",
        "Max Intensity / Precip", "Mean Intensity", "Cumulative Excess Deg-Days"
    ])

    for idx, ev in enumerate(analysis["events"], 1):
        writer.writerow([
            idx,
            hazard_type,
            ev.get("start_date", ""),
            ev.get("end_date", ""),
            ev.get("duration_days", ""),
            ev.get("max_intensity", ev.get("max_daily_precipitation_mm", ev.get("max_tmax", ""))),
            ev.get("mean_intensity", ""),
            ev.get("cumulative_excess_deg_days", "")
        ])

    csv_data = output.getvalue()
    filename = f"climate_hazard_{hazard_type}_{start_year}_{end_year}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
