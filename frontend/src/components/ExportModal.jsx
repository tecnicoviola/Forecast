import React from 'react';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';
import { getExportCsvUrl } from '../services/api';

export default function ExportModal({ isOpen, onClose, analysisData, currentParams }) {
  if (!isOpen || !analysisData) return null;

  const handleDownloadCsv = () => {
    const url = getExportCsvUrl({
      latitude: currentParams.latitude,
      longitude: currentParams.longitude,
      start_year: currentParams.startYear,
      end_year: currentParams.endYear,
      hazard_type: currentParams.hazardType,
      percentile_threshold: currentParams.percentile,
      min_consecutive_days: currentParams.minDays
    });
    window.open(url, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Export Climate Insights</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Export the full dataset and statistical diagnosis for <strong>{analysisData.location?.name}</strong> ({currentParams.startYear}–{currentParams.endYear}).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            onClick={handleDownloadCsv}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div style={{ background: 'var(--accent-orange-glow)', padding: '0.65rem', borderRadius: '10px' }}>
              <Download size={22} color="var(--accent-orange)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Download Raw Events CSV</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Contains all {analysisData.total_events} detected hazard occurrences with dates and intensity metrics.
              </div>
            </div>
          </div>

          <div
            onClick={handlePrintReport}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div style={{ background: 'var(--accent-blue-glow)', padding: '0.65rem', borderRadius: '10px' }}>
              <Printer size={22} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Print / Save as PDF Report</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Formatted executive summary report with charts, statistical significance, and insights.
              </div>
            </div>
          </div>
        </div>

        <button
          className="button-secondary"
          onClick={onClose}
          style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
