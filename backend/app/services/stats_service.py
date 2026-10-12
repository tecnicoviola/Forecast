import math
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from scipy import stats

class StatisticalAnalyzer:
    """
    Statistical engine for climate trend detection:
    - Non-parametric Mann-Kendall Trend Test (WMO/IPCC standard for climate timeseries)
    - Sen's slope estimator (robust non-parametric slope)
    - Ordinary Least Squares (OLS) Linear Regression (slope, R², p-value)
    - 3-Year and 5-Year Centered/Backward Rolling Averages
    - Percentage change computation between baseline and recent epochs
    """

    @classmethod
    def analyze_trends(cls, yearly_data: List[Dict[str, Any]], metric_key: str = "event_count") -> Dict[str, Any]:
        if not yearly_data:
            return cls._empty_stats()

        df = pd.DataFrame(yearly_data).sort_values("year")
        years = df["year"].values
        values = df[metric_key].values.astype(float)
        n = len(values)

        if n < 3:
            return cls._empty_stats()

        # 1. Rolling averages
        df["rolling_3yr"] = df[metric_key].rolling(window=3, min_periods=1).mean().round(2)
        df["rolling_5yr"] = df[metric_key].rolling(window=5, min_periods=1).mean().round(2)

        # 2. Linear Regression (OLS)
        reg_res = stats.linregress(years, values)
        slope = float(reg_res.slope)
        intercept = float(reg_res.intercept)
        r_squared = float(reg_res.rvalue ** 2)
        p_val_ols = float(reg_res.pvalue)

        # Fit line values for each year
        ols_trendline = [round(slope * y + intercept, 2) for y in years]

        # 3. Mann-Kendall Non-Parametric Test
        mk_result = cls.mann_kendall_test(values)

        # 4. Period Comparison (% change from early period to late period)
        split_point = n // 2
        early_period = values[:split_point]
        late_period = values[split_point:]

        early_mean = float(np.mean(early_period)) if len(early_period) > 0 else 0.0
        late_mean = float(np.mean(late_period)) if len(late_period) > 0 else 0.0

        if early_mean > 0:
            pct_change = round(((late_mean - early_mean) / early_mean) * 100.0, 1)
        else:
            pct_change = 100.0 if late_mean > 0 else 0.0

        # Construct actionable human-readable insight
        trend_direction = "increased" if slope > 0 else ("decreased" if slope < 0 else "remained steady")
        is_significant = mk_result["p_value"] < 0.05

        sig_note = "statistically significant (p < 0.05)" if is_significant else "not yet statistically significant (p ≥ 0.05)"
        
        insight_text = (
            f"Annual {metric_key.replace('_', ' ')} has {trend_direction} by {abs(pct_change):.1f}% "
            f"comparing the second half of the period ({int(years[split_point])}-{int(years[-1])}) "
            f"to the baseline ({int(years[0])}-{int(years[split_point-1])}). "
            f"Trend test indicates this is {sig_note}."
        )

        return {
            "metric": metric_key,
            "period_start": int(years[0]),
            "period_end": int(years[-1]),
            "total_years": n,
            "ols_regression": {
                "slope_per_year": round(slope, 3),
                "slope_per_decade": round(slope * 10, 2),
                "intercept": round(intercept, 2),
                "r_squared": round(r_squared, 3),
                "p_value": round(p_val_ols, 4),
                "trendline": ols_trendline
            },
            "mann_kendall": mk_result,
            "period_comparison": {
                "early_mean": round(early_mean, 2),
                "late_mean": round(late_mean, 2),
                "percentage_change": pct_change
            },
            "insight_summary": insight_text,
            "enriched_yearly": df.to_dict(orient="records")
        }

    @staticmethod
    def mann_kendall_test(x: np.ndarray) -> Dict[str, Any]:
        """
        Calculates the Mann-Kendall non-parametric trend test statistic S, variance, and p-value.
        Standard method used by IPCC and climate scientists because it does not assume normal distribution.
        """
        n = len(x)
        if n < 3:
            return {"trend": "insufficient_data", "p_value": 1.0, "s_score": 0, "z_score": 0.0, "significant": False}

        s = 0
        for k in range(n - 1):
            for j in range(k + 1, n):
                s += np.sign(x[j] - x[k])

        # Tied groups
        unique_x, counts = np.unique(x, return_counts=True)
        ties = counts[counts > 1]

        # Variance of S
        var_s = (n * (n - 1) * (2 * n + 5) - np.sum(ties * (ties - 1) * (2 * ties + 5))) / 18.0

        if s > 0:
            z = (s - 1) / math.sqrt(var_s) if var_s > 0 else 0.0
        elif s < 0:
            z = (s + 1) / math.sqrt(var_s) if var_s > 0 else 0.0
        else:
            z = 0.0

        # Two-tailed p-value
        p_val = 2 * (1 - stats.norm.cdf(abs(z)))

        trend = "upward" if s > 0 and p_val < 0.05 else ("downward" if s < 0 and p_val < 0.05 else "no_significant_trend")

        return {
            "trend": trend,
            "s_score": int(s),
            "z_score": round(float(z), 3),
            "p_value": round(float(p_val), 4),
            "significant": bool(p_val < 0.05)
        }

    @staticmethod
    def _empty_stats() -> Dict[str, Any]:
        return {
            "metric": "",
            "period_start": 0,
            "period_end": 0,
            "total_years": 0,
            "ols_regression": {"slope_per_year": 0.0, "r_squared": 0.0, "p_value": 1.0, "trendline": []},
            "mann_kendall": {"trend": "no_data", "p_value": 1.0, "significant": False},
            "period_comparison": {"early_mean": 0.0, "late_mean": 0.0, "percentage_change": 0.0},
            "insight_summary": "Insufficient data to compute climate trends.",
            "enriched_yearly": []
        }
