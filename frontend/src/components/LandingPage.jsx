import React from 'react';
import { Flame, ArrowRight, Sun, Moon, Thermometer, TrendingUp, Compass, Database } from 'lucide-react';

export default function LandingPage({ onGetStarted, onLoginClick, theme, onToggleTheme }) {
  return (
    <div className="landing-page-wrapper">
      {/* Landing Navbar */}
      <nav className="landing-nav">
        <div className="brand-badge">
          <div className="brand-icon">
            <Flame size={22} />
          </div>
          <div>
            <div className="brand-title" style={{ fontSize: '1.25rem' }}>Forecast</div>
            <div className="brand-subtitle">Climate Hazard Trend Analyzer</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {/* Theme switcher */}
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="var(--palette-cream)" /> : <Moon size={18} color="var(--palette-mauve)" />}
          </button>

          <button className="button-secondary" onClick={onLoginClick}>
            Sign In
          </button>
          <button className="button-primary" style={{ width: 'auto', padding: '0.65rem 1.25rem' }} onClick={onGetStarted}>
            Launch App
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-pill">
          <span className="hero-pill-badge">ERA5 Reanalysis</span>
          <span>Mann-Kendall Climate Statistical Engine</span>
        </div>

        <h1 className="hero-heading">
          Detect and Diagnose <br />
          <span className="hero-gradient-text">Climate Hazard Trends</span> Worldwide
        </h1>

        <p className="hero-description">
          Analyze historical temperature and precipitation records from 1950 to present.
          Evaluate extreme heatwaves, torrential rainfall, and prolonged droughts with non-parametric
          climate statistical significance tests and interactive spatial analytics.
        </p>

        <div className="hero-actions">
          <button className="button-primary hero-btn" onClick={onGetStarted}>
            <span>Explore Dashboard</span>
            <ArrowRight size={18} />
          </button>
          <button className="button-secondary hero-btn" onClick={onLoginClick}>
            <span>Researcher Sign In</span>
          </button>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <Thermometer size={26} />
          </div>
          <h3>Domain-Accurate Heatwaves</h3>
          <p>
            Percentile-based thresholds (90th, 95th, 98th) with configurable consecutive-day minimums, cumulative degree-day intensity, and severity indices.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <TrendingUp size={26} />
          </div>
          <h3>Mann-Kendall Trend Engine</h3>
          <p>
            IPCC & WMO gold-standard non-parametric trend test reporting S-score, standardized Z-score, and exact two-tailed p-values alongside OLS regressions.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Compass size={26} />
          </div>
          <h3>Interactive Spatial Mapping</h3>
          <p>
            Pick any coordinate on Earth with interactive Leaflet map layers, global city presets, or live worldwide geocoding.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Database size={26} />
          </div>
          <h3>Resilient NoSQL Caching</h3>
          <p>
            MongoDB architecture with an automatic file-backed document store fallback for offline reliability, rate limiting, and date-gap interpolation.
          </p>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="landing-banner">
        <div className="banner-item">
          <div className="banner-number">70+ Yrs</div>
          <div className="banner-label">Historical Weather Data (1950–Present)</div>
        </div>
        <div className="banner-divider" />
        <div className="banner-item">
          <div className="banner-number">Global</div>
          <div className="banner-label">ERA5 Global Reanalysis Coverage</div>
        </div>
        <div className="banner-divider" />
        <div className="banner-item">
          <div className="banner-number">p &lt; 0.05</div>
          <div className="banner-label">Rigorous Statistical Trend Confidence</div>
        </div>
      </section>
    </div>
  );
}
