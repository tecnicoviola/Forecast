import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: '0.85rem 1.1rem',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-card)',
        fontSize: '0.85rem'
      }}>
        <div style={{ fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          Year {label}
        </div>
        {payload.map((item, idx) => (
          <div key={idx} style={{ color: item.color, margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span>{item.name}:</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendCharts({ data }) {
  if (!data) return null;

  const [activeTab, setActiveTab] = useState('frequency'); // 'frequency', 'duration', 'intensity'

  const yearlyData = data.frequency_trends?.enriched_yearly || [];
  const regression = data.frequency_trends?.ols_regression || {};

  const chartData = yearlyData.map((y, idx) => ({
    year: y.year,
    event_count: y.event_count,
    rolling_3yr: y.rolling_3yr,
    rolling_5yr: y.rolling_5yr,
    ols_trendline: regression.trendline ? regression.trendline[idx] : null,
    total_hazard_days: y.total_hazard_days,
    avg_duration_days: y.avg_duration_days,
    max_intensity: y.max_intensity || 0,
    total_excess_deg_days: y.total_excess_deg_days || 0
  }));

  // Palette color definitions for charts
  const colorMauve = '#83637F';
  const colorTerracotta = '#D68F84';
  const colorLilac = '#C8B2C4';
  const colorCream = '#FAD9D5';

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Historical Trend Visualizations</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Annual frequency, cumulative spell durations, and OLS regression trendline
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: '10px' }}>
          <button
            className="button-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              background: activeTab === 'frequency' ? 'var(--palette-mauve)' : 'transparent',
              color: activeTab === 'frequency' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none'
            }}
            onClick={() => setActiveTab('frequency')}
          >
            Annual Frequency
          </button>
          <button
            className="button-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              background: activeTab === 'duration' ? 'var(--palette-mauve)' : 'transparent',
              color: activeTab === 'duration' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none'
            }}
            onClick={() => setActiveTab('duration')}
          >
            Hazard Duration (Days)
          </button>
          {data.hazard_type === 'heatwave' && (
            <button
              className="button-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                background: activeTab === 'intensity' ? 'var(--palette-mauve)' : 'transparent',
                color: activeTab === 'intensity' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none'
              }}
              onClick={() => setActiveTab('intensity')}
            >
              Peak Severity (°C)
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: 380, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'frequency' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="event_count" name="Hazard Events / Year" fill={colorMauve} radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line type="monotone" dataKey="rolling_5yr" name="5-Year Rolling Average" stroke={colorLilac} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ols_trendline" name="Linear Trendline (OLS)" stroke={colorTerracotta} strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          ) : activeTab === 'duration' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="total_hazard_days" name="Total Days Under Hazard" fill={colorTerracotta} radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line type="monotone" dataKey="avg_duration_days" name="Avg Spell Length (Days)" stroke={colorMauve} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Line type="monotone" dataKey="max_intensity" name="Max Temp Reached (°C)" stroke={colorTerracotta} strokeWidth={3} dot={{ r: 4 }} />
              <Bar dataKey="total_excess_deg_days" name="Cumulative °C-Days Above Threshold" fill={colorMauve} radius={[4, 4, 0, 0]} opacity={0.7} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>
          OLS Equation: <strong>Slope = {regression.slope_per_decade} events/decade</strong> (R² = {regression.r_squared}, p = {regression.p_value})
        </span>
        <span>
          Mann-Kendall Z-score: <strong>{data.frequency_trends?.mann_kendall?.z_score}</strong>
        </span>
      </div>
    </div>
  );
}
