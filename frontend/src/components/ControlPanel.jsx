import React from 'react';
import { Sliders, Activity, Calendar, Play, Sparkles, AlertCircle } from 'lucide-react';

export default function ControlPanel({
  hazardType,
  setHazardType,
  startYear,
  setStartYear,
  endYear,
  setEndYear,
  percentile,
  setPercentile,
  minDays,
  setMinDays,
  onAnalyze,
  isLoading
}) {
  return (
    <div className="glass-panel" style={{ position: 'sticky', top: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Sliders size={18} color="var(--palette-mauve)" />
          Hazard Parameters
        </h3>
        <span style={{ fontSize: '0.72rem', background: 'var(--bg-surface)', padding: '0.2rem 0.6rem', borderRadius: '9999px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
          WMO Aligned
        </span>
      </div>

      {/* Segmented Hazard Type Tabs */}
      <div className="control-group">
        <label className="control-label">Hazard Indicator</label>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${hazardType === 'heatwave' ? 'active' : ''}`}
            onClick={() => setHazardType('heatwave')}
          >
            <span>🔥 Heatwave</span>
          </button>
          <button
            type="button"
            className={`segmented-btn ${hazardType === 'heavy_rainfall' ? 'active' : ''}`}
            onClick={() => setHazardType('heavy_rainfall')}
          >
            <span>🌧️ Rainfall</span>
          </button>
          <button
            type="button"
            className={`segmented-btn ${hazardType === 'drought' ? 'active' : ''}`}
            onClick={() => setHazardType('drought')}
          >
            <span>☀️ Drought</span>
          </button>
        </div>
      </div>

      {/* Time Range Dual Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <label className="control-label">Start Year</label>
          <input
            type="number"
            min="1950"
            max={endYear - 5}
            className="form-input"
            value={startYear}
            onChange={(e) => setStartYear(parseInt(e.target.value) || 1990)}
          />
        </div>
        <div>
          <label className="control-label">End Year</label>
          <input
            type="number"
            min={startYear + 5}
            max="2023"
            className="form-input"
            value={endYear}
            onChange={(e) => setEndYear(parseInt(e.target.value) || 2023)}
          />
        </div>
      </div>

      {/* Percentile Threshold Tuning Slider */}
      {hazardType !== 'drought' && (
        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>Threshold Percentile</label>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--palette-mauve)' }}>
              {percentile}th %ile
            </span>
          </div>
          <input
            type="range"
            min="80"
            max="99"
            step="1"
            value={percentile}
            onChange={(e) => setPercentile(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--palette-mauve)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>80th (Frequent)</span>
            <span>95th (Standard)</span>
            <span>99th (Severe)</span>
          </div>
        </div>
      )}

      {/* Min Consecutive Days */}
      <div className="control-group">
        <label className="control-label">Minimum Consecutive Days</label>
        <select
          className="form-select"
          value={minDays}
          onChange={(e) => setMinDays(parseInt(e.target.value))}
        >
          {hazardType === 'heatwave' && (
            <>
              <option value="2">2 Days (Brief Spike)</option>
              <option value="3">3 Days (WMO Standard Heatwave)</option>
              <option value="5">5 Days (Severe Extended Heatwave)</option>
              <option value="7">7 Days (Extreme Prolonged Crisis)</option>
            </>
          )}
          {hazardType === 'heavy_rainfall' && (
            <>
              <option value="1">1 Day (Flash Torrential Day)</option>
              <option value="2">2 Days (Multi-day Downpour)</option>
              <option value="3">3+ Days (Extended Flood Risk)</option>
            </>
          )}
          {hazardType === 'drought' && (
            <>
              <option value="15">15 Days (&gt; 2 Weeks Dry Spell)</option>
              <option value="30">30 Days (1 Month Severe Drought)</option>
              <option value="45">45 Days (Extended Drought Crisis)</option>
            </>
          )}
        </select>
      </div>

      {/* Primary Action Button */}
      <button
        className="button-primary"
        onClick={onAnalyze}
        disabled={isLoading}
        style={{ width: '100%' }}
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            Computing Statistics...
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" />
            Compute Hazard Trends
          </>
        )}
      </button>
    </div>
  );
}
