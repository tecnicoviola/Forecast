# Aetheria: Climate Hazard Trend Analyzer

A full-stack, production-grade web application to analyze historical weather data and detect climate hazard trends (Heatwaves, Extreme Rainfall, and Droughts) for any geographic region worldwide using **ERA5 reanalysis data** and the non-parametric **Mann-Kendall trend test**.

Built for the **Full-Stack Developer case study at Dygnify Ventures Pvt Ltd**.

---

## 🌟 Highlights & Features

- **Domain-Specific Climate Logic**:
  - **Heatwaves (Default)**: WMO-aligned percentile-based definition (3+ consecutive days with maximum daily temperature $\ge$ 95th percentile). Calculates cumulative intensity (°C-days above threshold) and spell duration.
  - **Heavy Rainfall**: Detection of extreme precipitation events ($R95p$ / daily threshold $\ge$ 95th percentile or torrential rainfall $\ge$ 50mm).
  - **Drought / Dry Spells**: Detection of Consecutive Dry Days ($CDD$, precipitation $< 1.0\text{ mm}$ for $\ge 15\text{ days}$).
- **Statistical Trend Detection**:
  - **Mann-Kendall non-parametric trend test** (calculating $S$-score, variance, standardized $Z$-score, and two-tailed $p$-value).
  - **Ordinary Least Squares (OLS) Linear Regression** with slope per decade and $R^2$ coefficient.
  - **3-Year & 5-Year Rolling Averages** to filter short-term interannual variability.
  - **Period-over-period percentage change comparison** comparing recent decades to baseline epochs (e.g., *"Heatwaves have increased by +146.2% in Seville since 1990 (Mann-Kendall p = 0.005, statistically significant upward trend)"*).
- **Interactive Geospatial & Visual Experience**:
  - Interactive **Leaflet map**: click anywhere on Earth to inspect localized microclimate hazard trends.
  - Global preset hotspots (Delhi, Phoenix, Seville, London, Sydney, Tokyo, Cairo, São Paulo) and live geocoding search.
  - Interactive multi-layer time-series charts (Recharts) with toggleable frequency, duration, and peak severity views.
  - Paginated chronological hazard event catalog.
- **Robust Data Handling & Resilience**:
  - Ingests real-world **Open-Meteo ERA5 reanalysis** records (1950–present).
  - Imputes missing dates via time-indexed interpolation, handles physical boundary limits (-90°C to 65°C), and enforces physical consistency ($T_{\max} \ge T_{\min}$).
  - Multi-tier NoSQL persistence and caching: MongoDB support with automatic fallback to a resilient file-backed document cache (`data_cache/`), allowing immediate zero-configuration local runs.
- **Bonus Capabilities**:
  - Interactive Leaflet Map UI with dynamic coordinate selection.
  - CSV raw event data export & printable/PDF executive summary reports.
  - Non-parametric Mann-Kendall trend testing & OLS regression.

---

## 🏗️ Architecture

```
Climate_Hazards/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py           # FastAPI endpoints (/analyze, /cities, /geocode, /export/csv)
│   │   ├── db/
│   │   │   └── database.py         # MongoDB & local NoSQL Document Store fallback
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── weather_service.py  # Open-Meteo ERA5 ingestion, cleaning & caching
│   │   │   ├── hazard_detector.py  # Heatwave, Rainfall, Drought domain logic
│   │   │   └── stats_service.py    # Mann-Kendall test, OLS regression, rolling averages
│   │   ├── config.py               # Environment configuration
│   │   └── main.py                 # FastAPI application, CORS, and SlowAPI rate limiting
│   ├── tests/
│   │   ├── test_hazard_detector.py # Unit tests for climate logic & statistics
│   │   └── test_api.py             # Endpoints and validation test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header with branding and export action
│   │   │   ├── RegionSelector.jsx  # City presets, geocoder & Leaflet Map
│   │   │   ├── ControlPanel.jsx    # Hazard selection, year sliders, percentiles
│   │   │   ├── MetricCards.jsx     # Executive KPI cards & automated insight banner
│   │   │   ├── TrendCharts.jsx     # Multi-metric time series charts with trendlines
│   │   │   ├── EventTable.jsx      # Paginated catalog of individual hazard events
│   │   │   └── ExportModal.jsx     # CSV download and printable PDF view
│   │   ├── services/
│   │   │   └── api.js              # REST client
│   │   ├── App.jsx
│   │   └── index.css               # Modern glassmorphic theme & layout
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- *(Optional)* **MongoDB** (If MongoDB is not running, the application will automatically switch to the embedded local NoSQL document store inside `backend/data_cache/` with zero configuration).

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API will be active at: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend will be active at: `http://localhost:5173`

---

## 🧪 Testing & Validation

Backend tests verify domain-specific hazard detection, synthetic spell identification, and the Mann-Kendall trend calculator:

```bash
cd backend
python -m pytest
```

---

## 📐 Climate Hazard Logic & Scientific Formulas

### 1. Percentile-Based Heatwaves
A heatwave is detected when:
$$T_{\max}(t) \ge P_{95}(T_{\max})$$
for at least $N_{\text{days}} \ge 3$ consecutive days, where $P_{95}$ is the 95th percentile of daily maximum temperatures for the analyzed location.
- **Cumulative Excess Degree-Days**:
  $$\text{Intensity} = \sum_{t \in \text{spell}} \left( T_{\max}(t) - P_{95} \right)$$

### 2. Mann-Kendall Trend Test
A rank-based non-parametric test evaluating whether a monotonic upward or downward trend exists over time without assuming normality:
$$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^{n} \operatorname{sgn}(x_j - x_k)$$
$$\operatorname{Var}(S) = \frac{n(n-1)(2n+5) - \sum_{i=1}^m t_i(t_i-1)(2t_i+5)}{18}$$
$$Z = \begin{cases} \frac{S-1}{\sqrt{\operatorname{Var}(S)}} & \text{if } S > 0 \\ 0 & \text{if } S = 0 \\ \frac{S+1}{\sqrt{\operatorname{Var}(S)}} & \text{if } S < 0 \end{cases}$$
The two-tailed $p$-value is computed via the standard normal cumulative distribution function. A trend is declared statistically significant when $p < 0.05$.

---

## 🛡️ Data Handling, Security & Performance

1. **Noisy / Inconsistent Data Handling**:
   - Dates are re-indexed across a continuous daily calendar (`pd.date_range`) to detect any missing days.
   - Temperature values are physically validated (clipped between $-90^\circ\text{C}$ and $+65^\circ\text{C}$).
   - Missing data points are imputed via time-indexed linear interpolation; missing precipitation is treated as zero rainfall.
   - Cross-variable consistency guarantees $T_{\max} \ge T_{\min}$.
2. **Caching**:
   - MD5 hash keys based on coordinates (rounded to 0.01°), time horizons, and threshold parameters.
   - Query responses are cached in the NoSQL database (`weather_cache` and `analysis_cache`), avoiding repeated network requests to external APIs.
3. **Rate Limiting & Security**:
   - `SlowAPI` middleware limits client requests to prevent external quota exhaustion.
   - Pydantic models validate input ranges: $-90 \le \text{lat} \le 90$, $-180 \le \text{lon} \le 180$, and minimum duration thresholds.

---

## 🤖 AI Tools Usage Attribution

In accordance with case study guidelines:
- **AI Tools Used**:  Gemini 3.6 Flash Low for coding help in backend .
- **How it was used**:
  1. Assisted in scaffolding modular architectural components (FastAPI structure, Pydantic schemas, Vite React components).
  2. Implemented the mathematical formulation of the non-parametric Mann-Kendall trend test and Sen's slope calculation.
  3. Formatted responsive glassmorphic styling tokens and interactive Recharts data models.

---

## 🌐 Deployment Recommendations

- **Frontend**: Deployable on **Vercel** or **Netlify** with `VITE_API_URL` pointing to the backend.
- **Backend**: Deployable as a Docker container or Python service on **Render**, **Railway**, or **Google Cloud Run**.

---

## 🔭 Future Roadmap (Given More Time)
- **Multi-Model Ensembles**: Blend Open-Meteo ERA5 with NOAA GHCN station observations and Copernicus CMIP6 climate projections.
- **Compound Hazards**: Detect compound dry-hot events (concurrent drought + heatwave) which disproportionately drive wildfire risks.
- **GeoTIFF Spatial Raster Overlays**: Render full spatial heatmap rasters across regional bounding boxes rather than point centroids.
