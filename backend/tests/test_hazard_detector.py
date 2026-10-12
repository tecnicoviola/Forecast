import pytest
import pandas as pd
import numpy as np
from app.services.hazard_detector import HazardDetector
from app.services.stats_service import StatisticalAnalyzer

def create_synthetic_weather_data(days=365*5, base_temp=25.0):
    dates = pd.date_range("2010-01-01", periods=days, freq="D")
    # Temperature with seasonal curve and random noise
    tmax = base_temp + 10 * np.sin(2 * np.pi * np.arange(days) / 365) + np.random.normal(0, 2, days)
    tmin = tmax - 8 + np.random.normal(0, 1, days)
    precip = np.random.exponential(2, days)
    precip[precip < 1.0] = 0.0

    df = pd.DataFrame({"date": dates, "tmax": tmax, "tmin": tmin, "precip": precip})
    return df

def test_heatwave_detection_on_synthetic_spell():
    df = create_synthetic_weather_data(days=365*3)
    # Inject an intentional 6-day extreme heatwave
    df.loc[100:105, "tmax"] = 55.0

    res = HazardDetector.detect_heatwaves(df, percentile_threshold=95.0, min_consecutive_days=3)
    assert res["hazard_type"] == "heatwave"
    assert res["total_events"] >= 1
    assert any(ev["duration_days"] >= 6 for ev in res["events"])
    assert res["threshold_value"] > 0

def test_heavy_rainfall_detection():
    df = create_synthetic_weather_data(days=365*3)
    # Inject 4-day heavy rain event
    df.loc[200:203, "precip"] = 80.0

    res = HazardDetector.detect_heavy_rainfall(df, percentile_threshold=95.0, min_consecutive_days=1)
    assert res["hazard_type"] == "heavy_rainfall"
    assert res["total_events"] >= 1
    assert res["events"][0]["duration_days"] >= 1

def test_mann_kendall_trend_upward():
    # Clear upward trend
    upward_series = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15])
    res = StatisticalAnalyzer.mann_kendall_test(upward_series)
    assert res["trend"] == "upward"
    assert res["significant"] is True
    assert res["p_value"] < 0.05
    assert res["s_score"] > 0

def test_mann_kendall_trend_flat():
    flat_series = np.array([5, 5, 5, 5, 5, 5, 5, 5])
    res = StatisticalAnalyzer.mann_kendall_test(flat_series)
    assert res["s_score"] == 0
    assert res["significant"] is False
