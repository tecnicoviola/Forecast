import React from 'react';
import { Flame, ShieldAlert, FileText, User, LogOut, Sun, Moon, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';

export default function Navbar({
  onExportClick,
  isExportDisabled,
  user,
  onLogout,
  onGoHome,
  theme,
  onToggleTheme,
  locationName,
  yearRange
}) {
  return (
    <header className="navbar">
      <div className="brand-badge" style={{ cursor: 'pointer' }} onClick={onGoHome} title="Go to Home">
        <div className="brand-icon">
          <Flame size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="brand-title">Forecast</h1>
            <span className="live-pill">
              <span className="live-dot" />
              ERA5 LIVE
            </span>
          </div>
          <div className="brand-subtitle">
            Climate Hazard Trend Analyzer & Statistical Engine
          </div>
        </div>
      </div>

      {/* Active Session Breadcrumb Badge */}
      {locationName && (
        <div className="session-context-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={13} color="var(--palette-terracotta)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{locationName}</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} color="var(--palette-mauve)" />
            <span style={{ color: 'var(--text-secondary)' }}>{yearRange || '1990 – 2023'}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {/* Dark / Light Mode Switcher */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} color="var(--palette-cream)" /> : <Moon size={18} color="var(--palette-mauve)" />}
        </button>

        <button
          className="button-secondary"
          onClick={onExportClick}
          disabled={isExportDisabled}
          title="Export CSV or print summary insights"
        >
          <FileText size={16} />
          Export Report
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-glow)',
                border: '1px solid var(--palette-mauve)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--palette-mauve)'
              }}>
                <User size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.organization || 'Analyst'}</span>
              </div>
            </div>

            <button
              className="button-secondary"
              style={{ padding: '0.45rem 0.65rem', marginLeft: '0.25rem' }}
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
