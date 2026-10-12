import React, { useState } from 'react';
import { Calendar, Thermometer, CloudRain, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EventTable({ events, hazardType }) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hazard events detected with current threshold parameters in this period.
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.ceil(events.length / pageSize);

  const paginatedEvents = events.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Detected Hazard Event Logs</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Chronological catalog of individual identified spells ({events.length} total events)
          </p>
        </div>

        {/* Pagination buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="button-secondary"
            style={{ padding: '0.35rem 0.6rem' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="button-secondary"
            style={{ padding: '0.35rem 0.6rem' }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration (Days)</th>
              {hazardType === 'heatwave' && <th>Peak Temp (°C)</th>}
              {hazardType === 'heatwave' && <th>Mean Temp (°C)</th>}
              {hazardType === 'heatwave' && <th>Excess Deg-Days</th>}
              {hazardType === 'heavy_rainfall' && <th>Total Rain (mm)</th>}
              {hazardType === 'heavy_rainfall' && <th>Max Daily (mm)</th>}
              {hazardType === 'drought' && <th>Max Temp During Spell</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((ev, idx) => (
              <tr key={idx}>
                <td><strong>{ev.year}</strong></td>
                <td>{ev.start_date}</td>
                <td>{ev.end_date}</td>
                <td>
                  <span className={`badge ${ev.duration_days >= 7 ? 'badge-danger' : ev.duration_days >= 4 ? 'badge-warning' : 'badge-success'}`}>
                    {ev.duration_days} days
                  </span>
                </td>
                {hazardType === 'heatwave' && <td><strong style={{ color: 'var(--accent-red)' }}>{ev.max_intensity}°C</strong></td>}
                {hazardType === 'heatwave' && <td>{ev.mean_intensity}°C</td>}
                {hazardType === 'heatwave' && <td>+{ev.cumulative_excess_deg_days} °C·d</td>}
                {hazardType === 'heavy_rainfall' && <td><strong style={{ color: 'var(--accent-blue)' }}>{ev.total_precipitation_mm} mm</strong></td>}
                {hazardType === 'heavy_rainfall' && <td>{ev.max_daily_precipitation_mm} mm</td>}
                {hazardType === 'drought' && <td>{ev.max_tmax}°C</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
