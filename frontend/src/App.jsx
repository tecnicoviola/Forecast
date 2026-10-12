import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import RegionSelector from './components/RegionSelector';
import ControlPanel from './components/ControlPanel';
import MetricCards from './components/MetricCards';
import TrendCharts from './components/TrendCharts';
import EventTable from './components/EventTable';
import ExportModal from './components/ExportModal';
import { fetchPresetCities, runClimateAnalysis } from './services/api';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  // Theme State: 'dark' | 'light' (saved in localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('climate_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('climate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('climate_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Navigation View State: 'landing' | 'auth' | 'app'
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('climate_user');
    return savedUser ? 'app' : 'landing';
  });

  // Region & Location State
  const [latitude, setLatitude] = useState(28.6139); // New Delhi by default
  const [longitude, setLongitude] = useState(77.2090);
  const [locationName, setLocationName] = useState('New Delhi, India');
  const [presetCities, setPresetCities] = useState([]);

  // Hazard Parameters State
  const [hazardType, setHazardType] = useState('heatwave'); // Heatwave default
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2023);
  const [percentile, setPercentile] = useState(95.0);
  const [minDays, setMinDays] = useState(3);

  // Analysis Result State
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch preset cities
  useEffect(() => {
    fetchPresetCities()
      .then((data) => {
        if (data && data.cities) setPresetCities(data.cities);
      })
      .catch((err) => console.error('Preset cities load error:', err));
  }, []);

  // Run analysis pipeline
  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await runClimateAnalysis({
        latitude,
        longitude,
        start_year: startYear,
        end_year: endYear,
        hazard_type: hazardType,
        percentile_threshold: percentile,
        min_consecutive_days: minDays,
        location_name: locationName
      });
      setAnalysisData(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An error occurred while computing climate hazard trends.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial analysis when entering app view
  useEffect(() => {
    if (currentView === 'app' && !analysisData) {
      handleAnalyze();
    }
  }, [currentView]);

  const handleGetStarted = () => {
    if (currentUser) {
      setCurrentView('app');
    } else {
      setCurrentView('auth');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('climate_user');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // 1. Render Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        onLoginClick={() => setCurrentView('auth')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // 2. Render Authentication Page (or if unauthenticated user tries to view app)
  if (currentView === 'auth' || !currentUser) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // 3. Render Main Application Dashboard
  return (
    <div className="app-container">
      <Navbar
        onExportClick={() => setIsExportOpen(true)}
        isExportDisabled={!analysisData}
        user={currentUser}
        onLogout={handleLogout}
        onGoHome={() => setCurrentView('landing')}
        theme={theme}
        onToggleTheme={toggleTheme}
        locationName={locationName}
        yearRange={`${startYear} – ${endYear}`}
      />

      <main className="dashboard-grid">
        {/* Left Control Sidebar */}
        <aside>
          <RegionSelector
            latitude={latitude}
            longitude={longitude}
            onChangeCoordinates={(lat, lon) => {
              setLatitude(lat);
              setLongitude(lon);
            }}
            locationName={locationName}
            setLocationName={setLocationName}
            presetCities={presetCities}
          />

          <ControlPanel
            hazardType={hazardType}
            setHazardType={setHazardType}
            startYear={startYear}
            setStartYear={setStartYear}
            endYear={endYear}
            setEndYear={setEndYear}
            percentile={percentile}
            setPercentile={setPercentile}
            minDays={minDays}
            setMinDays={setMinDays}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
        </aside>

        {/* Right Analytics Dashboard */}
        <section>
          {errorMessage && (
            <div style={{
              background: 'rgba(214, 143, 132, 0.15)',
              border: '1px solid var(--palette-terracotta)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: 'var(--palette-terracotta)'
            }}>
              <AlertTriangle size={24} />
              <div>
                <strong>Analysis Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {isLoading && !analysisData && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 1.5rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Ingesting ERA5 Reanalysis Timeseries...
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Fetching daily temperature records, imputing data gaps, computing percentiles & running Mann-Kendall trend tests.
              </p>
            </div>
          )}

          {analysisData && (
            <>
              <MetricCards data={analysisData} />
              <TrendCharts data={analysisData} />
              <EventTable events={analysisData.events} hazardType={analysisData.hazard_type} />
            </>
          )}
        </section>
      </main>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysisData={analysisData}
        currentParams={{
          latitude,
          longitude,
          startYear,
          endYear,
          hazardType,
          percentile,
          minDays
        }}
      />
    </div>
  );
}
