from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")
    start_year: int = Field(1990, ge=1950, le=2024, description="Start year")
    end_year: int = Field(2023, ge=1950, le=2024, description="End year")
    hazard_type: str = Field("heatwave", description="Hazard type: 'heatwave', 'heavy_rainfall', or 'drought'")
    percentile_threshold: float = Field(95.0, ge=70.0, le=99.9, description="Percentile threshold")
    min_consecutive_days: int = Field(3, ge=1, le=30, description="Minimum consecutive days for spell")
    location_name: Optional[str] = Field("Selected Location", description="Display label for location")

class HazardEvent(BaseModel):
    year: int
    start_date: str
    end_date: str
    duration_days: int
    max_intensity: Optional[float] = None
    mean_intensity: Optional[float] = None
    cumulative_excess_deg_days: Optional[float] = None
    total_precipitation_mm: Optional[float] = None
    max_daily_precipitation_mm: Optional[float] = None
    max_tmax: Optional[float] = None

class YearlyStat(BaseModel):
    year: int
    event_count: int
    total_hazard_days: int
    avg_duration_days: float
    max_intensity: Optional[float] = 0.0
    total_excess_deg_days: Optional[float] = 0.0
    rolling_3yr: Optional[float] = None
    rolling_5yr: Optional[float] = None

class RegressionModel(BaseModel):
    slope_per_year: float
    slope_per_decade: float
    intercept: float
    r_squared: float
    p_value: float
    trendline: List[float]

class MannKendallModel(BaseModel):
    trend: str
    s_score: int
    z_score: float
    p_value: float
    significant: bool

class PeriodComparison(BaseModel):
    early_mean: float
    late_mean: float
    percentage_change: float

class TrendAnalysisResult(BaseModel):
    metric: str
    period_start: int
    period_end: int
    total_years: int
    ols_regression: RegressionModel
    mann_kendall: MannKendallModel
    period_comparison: PeriodComparison
    insight_summary: str
    enriched_yearly: List[Dict[str, Any]]

class AnalysisResponse(BaseModel):
    location: Dict[str, Any]
    hazard_type: str
    threshold_value: float
    threshold_unit: str
    threshold_percentile: float
    min_duration_days: int
    total_events: int
    events: List[Dict[str, Any]]
    frequency_trends: TrendAnalysisResult
    duration_trends: TrendAnalysisResult
    summary_insight: str
    cached: bool
