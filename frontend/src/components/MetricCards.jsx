import React from 'react';
import { TrendingUp, Flame, AlertCircle, Clock, Zap, Info, ShieldCheck } from 'lucide-react';

export default function MetricCards({ data }) {
  if (!data) return null;

  const freqTrends = data.frequency_trends || {};
  const durTrends = data.duration_trends || {};
  const pctChange = freqTrends.period_comparison?.percentage_change ?? 0;
  const isUpward = pctChange > 0;
  const mkSignificance = freqTrends.mann_kendall?.significant;
  const mkPValue = freqTrends.mann_kendall?.p_value ?? 1.0;
  const olsDecade = freqTrends.ols_regression?.slope_per_decade ?? 0;

  return (
    <>
      {/* Dynamic Automated Climate Insight Banner */}
      <div className="insight-banner">
        <div className="insight-icon">
          <Zap size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div className="insight-title">
              Statistical Climate Diagnosis • {data.location?.name || 'Selected Region'}
            </div>
            <span className={`badge ${mkSignificance ? 'badge-danger' : 'badge-warning'}`}>
              {mkSignificance ? 'Confidence: 95% (p < 0.05)' : 'Statistical Uncertainty (p ≥ 0.05)'}
            </span>
          </div>
          <div className="insight-body">
            {data.summary_insight}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Total Detected Events</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="kpi-value">{data.total_events}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>spells</span>
          </div>
          <span className="kpi-subtext">
            {data.location?.start_year} – {data.location?.end_year} ({data.location?.end_year - data.location?.start_year + 1} yrs)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Period-Over-Period Shift</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="kpi-value" style={{ color: isUpward ? 'var(--palette-terracotta)' : 'var(--palette-mauve)' }}>
              {isUpward ? `+${pctChange}%` : `${pctChange}%`}
            </span>
            <span style={{ fontSize: '0.8rem', color: isUpward ? 'var(--palette-terracotta)' : 'var(--palette-mauve)' }}>
              {isUpward ? '▲ Higher' : '▼ Lower'}
            </span>
          </div>
          <span className="kpi-subtext">
            Second half vs baseline period
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Rate of Change (OLS)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="kpi-value">
              {olsDecade > 0 ? `+${olsDecade}` : olsDecade}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>events/decade</span>
          </div>
          <span className="kpi-subtext">
            R² = {freqTrends.ols_regression?.r_squared ?? 0} (Linear Fit)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Threshold Baseline</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="kpi-value" style={{ fontSize: '1.6rem' }}>
              {data.threshold_value}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--palette-mauve)', fontWeight: 600 }}>
              {data.threshold_unit}
            </span>
          </div>
          <span className="kpi-subtext">
            {data.threshold_percentile}th percentile (Min {data.min_duration_days} consecutive days)
          </span>
        </div>
      </div>
    </>
  );
}
