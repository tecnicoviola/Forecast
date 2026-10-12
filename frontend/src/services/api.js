const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchPresetCities = async () => {
  const res = await fetch(`${API_BASE_URL}/cities`);
  if (!res.ok) throw new Error('Failed to fetch preset cities');
  return res.json();
};

export const searchGeocode = async (query) => {
  const res = await fetch(`${API_BASE_URL}/geocode?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Geocoding search failed');
  return res.json();
};

export const runClimateAnalysis = async (params) => {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Analysis request failed');
  }
  return res.json();
};

export const getExportCsvUrl = (params) => {
  const query = new URLSearchParams({
    latitude: params.latitude,
    longitude: params.longitude,
    start_year: params.start_year,
    end_year: params.end_year,
    hazard_type: params.hazard_type,
    percentile_threshold: params.percentile_threshold,
    min_consecutive_days: params.min_consecutive_days,
  });
  return `${API_BASE_URL}/export/csv?${query.toString()}`;
};
