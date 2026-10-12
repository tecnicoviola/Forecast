import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation } from 'lucide-react';
import { searchGeocode } from '../services/api';

// Fix standard Leaflet default marker icon path issue in Vite bundlers
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition, setLocationName }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lon = parseFloat(e.latlng.lng.toFixed(4));
      setPosition([lat, lon]);
      setLocationName(`Coordinates (${lat}, ${lon})`);
    },
  });

  return position ? <Marker position={position} icon={customMarkerIcon} /> : null;
}

export default function RegionSelector({
  latitude,
  longitude,
  onChangeCoordinates,
  locationName,
  setLocationName,
  presetCities
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleCitySelect = (city) => {
    onChangeCoordinates(city.latitude, city.longitude);
    setLocationName(`${city.name}, ${city.country}`);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const data = await searchGeocode(searchQuery.trim());
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Geocoding lookup error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MapPin size={18} color="var(--accent-orange)" />
        1. Select Region
      </h3>

      {/* Preset Quick Select Dropdown */}
      <div className="control-group">
        <label className="control-label">Preset Regions & Climate Hotspots</label>
        <select
          className="form-select"
          onChange={(e) => {
            const idx = e.target.value;
            if (idx !== '') handleCitySelect(presetCities[idx]);
          }}
          defaultValue=""
        >
          <option value="" disabled>Choose a preset location...</option>
          {presetCities.map((c, i) => (
            <option key={i} value={i}>
              {c.name}, {c.country} ({c.climate_type})
            </option>
          ))}
        </select>
      </div>

      {/* Live Geocoding Search */}
      <div className="control-group">
        <label className="control-label">Search Global City / State</label>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Madrid, Chicago, Mumbai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="button-secondary" style={{ padding: '0 0.85rem' }}>
            {isSearching ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={16} />}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            marginTop: '0.5rem',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleCitySelect(item)}
                style={{
                  padding: '0.6rem 0.85rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.85rem'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <strong>{item.name}</strong>, {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lat Lon Direct Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label className="control-label">Latitude (°N)</label>
          <input
            type="number"
            step="0.0001"
            className="form-input"
            value={latitude}
            onChange={(e) => onChangeCoordinates(parseFloat(e.target.value) || 0, longitude)}
          />
        </div>
        <div>
          <label className="control-label">Longitude (°E)</label>
          <input
            type="number"
            step="0.0001"
            className="form-input"
            value={longitude}
            onChange={(e) => onChangeCoordinates(latitude, parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Interactive Map Picker */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="control-label" style={{ marginBottom: 0 }}>Interactive Map Picker</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click map to relocate</span>
        </div>
        <div className="map-container">
          <MapContainer
            center={[latitude, longitude]}
            zoom={4}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
            key={`${latitude}-${longitude}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={[latitude, longitude]}
              setPosition={(pos) => onChangeCoordinates(pos[0], pos[1])}
              setLocationName={setLocationName}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
