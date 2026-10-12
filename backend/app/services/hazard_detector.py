import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logger = logging.getLogger("climate_analyzer.hazard_detector")

class HazardDetector:
    """
    Climate Hazard Detection Engine:
    Defines domain-specific logic for detecting:
    1. Heatwaves (WMO-aligned percentile-based definition)
    2. Heavy Rainfall Events (R95p / daily extreme rainfall)
    3. Drought / Prolonged Dry Spells (Consecutive Dry Days - CDD)
    """

    @classmethod
    def detect_heatwaves(
        cls,
        df: pd.DataFrame,
        percentile_threshold: float = 95.0,
        min_consecutive_days: int = 3,
        baseline_start_year: int = None,
        baseline_end_year: int = None
    ) -> Dict[str, Any]:
        """
        Detects heatwave spells:
        Criteria: At least `min_consecutive_days` consecutive days with daily maximum temperature
        exceeding the specified percentile of the local temperature distribution.
        """
        work_df = df.copy()
        work_df["year"] = work_df["date"].dt.year

        # Compute threshold either on historical baseline period or entire period
        if baseline_start_year and baseline_end_year:
            baseline_slice = work_df[
                (work_df["year"] >= baseline_start_year) & (work_df["year"] <= baseline_end_year)
            ]
            if len(baseline_slice) > 0:
                threshold_val = float(np.percentile(baseline_slice["tmax"].dropna(), percentile_threshold))
            else:
                threshold_val = float(np.percentile(work_df["tmax"].dropna(), percentile_threshold))
        else:
            threshold_val = float(np.percentile(work_df["tmax"].dropna(), percentile_threshold))

        threshold_val = round(threshold_val, 2)
        work_df["is_exceedance"] = work_df["tmax"] >= threshold_val

        # Identify consecutive spells
        events = []
        in_spell = False
        spell_start_idx = None

        for i, row in work_df.iterrows():
            if row["is_exceedance"]:
                if not in_spell:
                    in_spell = True
                    spell_start_idx = i
            else:
                if in_spell:
                    spell_df = work_df.loc[spell_start_idx : i - 1]
                    duration = len(spell_df)
                    if duration >= min_consecutive_days:
                        events.append(cls._compile_heatwave_event(spell_df, threshold_val))
                    in_spell = False
                    spell_start_idx = None

        # Check if spell was ongoing at the end of the series
        if in_spell and spell_start_idx is not None:
            spell_df = work_df.loc[spell_start_idx : len(work_df) - 1]
            if len(spell_df) >= min_consecutive_days:
                events.append(cls._compile_heatwave_event(spell_df, threshold_val))

        # Yearly aggregation
        yearly_summary = cls._aggregate_by_year(work_df, events, "heatwave")

        return {
            "hazard_type": "heatwave",
            "threshold_value": threshold_val,
            "threshold_unit": "°C",
            "threshold_percentile": percentile_threshold,
            "min_duration_days": min_consecutive_days,
            "total_events": len(events),
            "events": events,
            "yearly_summary": yearly_summary
        }

    @staticmethod
    def _compile_heatwave_event(spell_df: pd.DataFrame, threshold: float) -> Dict[str, Any]:
        duration = len(spell_df)
        max_tmax = float(spell_df["tmax"].max())
        mean_tmax = float(spell_df["tmax"].mean())
        # Cumulative intensity (°C-days above threshold)
        cum_intensity = float((spell_df["tmax"] - threshold).sum())

        start_date = spell_df["date"].iloc[0].strftime("%Y-%m-%d")
        end_date = spell_df["date"].iloc[-1].strftime("%Y-%m-%d")
        year = int(spell_df["date"].iloc[0].year)

        return {
            "year": year,
            "start_date": start_date,
            "end_date": end_date,
            "duration_days": duration,
            "max_intensity": round(max_tmax, 2),
            "mean_intensity": round(mean_tmax, 2),
            "cumulative_excess_deg_days": round(cum_intensity, 2)
        }

    @classmethod
    def detect_heavy_rainfall(
        cls,
        df: pd.DataFrame,
        percentile_threshold: float = 95.0,
        fixed_threshold_mm: float = None,
        min_consecutive_days: int = 1
    ) -> Dict[str, Any]:
        """
        Detects heavy precipitation events (R95p or consecutive days of torrential rain).
        Considers only wet days (precip >= 1.0mm) for percentile threshold determination.
        """
        work_df = df.copy()
        work_df["year"] = work_df["date"].dt.year

        wet_days = work_df[work_df["precip"] >= 1.0]
        if fixed_threshold_mm is not None:
            threshold_val = float(fixed_threshold_mm)
        elif len(wet_days) > 10:
            threshold_val = float(np.percentile(wet_days["precip"].dropna(), percentile_threshold))
        else:
            threshold_val = 25.0  # Fallback default mm/day

        threshold_val = round(threshold_val, 2)
        work_df["is_exceedance"] = work_df["precip"] >= threshold_val

        events = []
        in_spell = False
        spell_start_idx = None

        for i, row in work_df.iterrows():
            if row["is_exceedance"]:
                if not in_spell:
                    in_spell = True
                    spell_start_idx = i
            else:
                if in_spell:
                    spell_df = work_df.loc[spell_start_idx : i - 1]
                    duration = len(spell_df)
                    if duration >= min_consecutive_days:
                        events.append(cls._compile_rainfall_event(spell_df, threshold_val))
                    in_spell = False
                    spell_start_idx = None

        if in_spell and spell_start_idx is not None:
            spell_df = work_df.loc[spell_start_idx : len(work_df) - 1]
            if len(spell_df) >= min_consecutive_days:
                events.append(cls._compile_rainfall_event(spell_df, threshold_val))

        yearly_summary = cls._aggregate_by_year(work_df, events, "heavy_rainfall")

        return {
            "hazard_type": "heavy_rainfall",
            "threshold_value": threshold_val,
            "threshold_unit": "mm/day",
            "threshold_percentile": percentile_threshold,
            "min_duration_days": min_consecutive_days,
            "total_events": len(events),
            "events": events,
            "yearly_summary": yearly_summary
        }

    @staticmethod
    def _compile_rainfall_event(spell_df: pd.DataFrame, threshold: float) -> Dict[str, Any]:
        duration = len(spell_df)
        total_precip = float(spell_df["precip"].sum())
        max_daily_precip = float(spell_df["precip"].max())

        start_date = spell_df["date"].iloc[0].strftime("%Y-%m-%d")
        end_date = spell_df["date"].iloc[-1].strftime("%Y-%m-%d")
        year = int(spell_df["date"].iloc[0].year)

        return {
            "year": year,
            "start_date": start_date,
            "end_date": end_date,
            "duration_days": duration,
            "total_precipitation_mm": round(total_precip, 2),
            "max_daily_precipitation_mm": round(max_daily_precip, 2)
        }

    @classmethod
    def detect_drought_spells(
        cls,
        df: pd.DataFrame,
        dry_day_precip_limit: float = 1.0,
        min_consecutive_days: int = 15
    ) -> Dict[str, Any]:
        """
        Consecutive Dry Days (CDD): Spells of consecutive days with precipitation < 1.0 mm.
        Standard meteorological indicator for agricultural and meteorological drought risks.
        """
        work_df = df.copy()
        work_df["year"] = work_df["date"].dt.year
        work_df["is_dry"] = work_df["precip"] < dry_day_precip_limit

        events = []
        in_spell = False
        spell_start_idx = None

        for i, row in work_df.iterrows():
            if row["is_dry"]:
                if not in_spell:
                    in_spell = True
                    spell_start_idx = i
            else:
                if in_spell:
                    spell_df = work_df.loc[spell_start_idx : i - 1]
                    duration = len(spell_df)
                    if duration >= min_consecutive_days:
                        events.append({
                            "year": int(spell_df["date"].iloc[0].year),
                            "start_date": spell_df["date"].iloc[0].strftime("%Y-%m-%d"),
                            "end_date": spell_df["date"].iloc[-1].strftime("%Y-%m-%d"),
                            "duration_days": duration,
                            "max_tmax": round(float(spell_df["tmax"].max()), 2)
                        })
                    in_spell = False
                    spell_start_idx = None

        if in_spell and spell_start_idx is not None:
            spell_df = work_df.loc[spell_start_idx : len(work_df) - 1]
            if len(spell_df) >= min_consecutive_days:
                events.append({
                    "year": int(spell_df["date"].iloc[0].year),
                    "start_date": spell_df["date"].iloc[0].strftime("%Y-%m-%d"),
                    "end_date": spell_df["date"].iloc[-1].strftime("%Y-%m-%d"),
                    "duration_days": len(spell_df),
                    "max_tmax": round(float(spell_df["tmax"].max()), 2)
                })

        yearly_summary = cls._aggregate_by_year(work_df, events, "drought")

        return {
            "hazard_type": "drought",
            "threshold_value": dry_day_precip_limit,
            "threshold_unit": "mm/day limit",
            "min_duration_days": min_consecutive_days,
            "total_events": len(events),
            "events": events,
            "yearly_summary": yearly_summary
        }

    @staticmethod
    def _aggregate_by_year(df: pd.DataFrame, events: List[Dict[str, Any]], hazard_type: str) -> List[Dict[str, Any]]:
        years = sorted(df["date"].dt.year.unique())
        event_df = pd.DataFrame(events) if events else pd.DataFrame(columns=["year", "duration_days"])

        yearly = []
        for y in years:
            y_events = event_df[event_df["year"] == y] if not event_df.empty else pd.DataFrame()
            count = len(y_events)
            total_duration = int(y_events["duration_days"].sum()) if count > 0 else 0
            avg_duration = round(float(y_events["duration_days"].mean()), 2) if count > 0 else 0.0

            year_stat = {
                "year": int(y),
                "event_count": int(count),
                "total_hazard_days": total_duration,
                "avg_duration_days": avg_duration
            }

            if hazard_type == "heatwave" and count > 0 and "max_intensity" in y_events:
                year_stat["max_intensity"] = round(float(y_events["max_intensity"].max()), 2)
                year_stat["total_excess_deg_days"] = round(float(y_events["cumulative_excess_deg_days"].sum()), 2)
            elif hazard_type == "heatwave":
                year_stat["max_intensity"] = 0.0
                year_stat["total_excess_deg_days"] = 0.0

            yearly.append(year_stat)

        return yearly
