  # FireSync – Complete Project Audit & Development Handover Report
  **NASA Space Apps Challenge 2026: Harmonization of MODIS and VIIRS Hot Spots**

  ---

  ## 1. Project Overview

  **FireSync** is conceived as a 3D Earth observation and wildfire intelligence web platform built for the NASA Space Apps Challenge 2026 challenge: *Harmonization of MODIS and VIIRS Hot Spots*.

  The core objective of the challenge is to resolve the significant radiometric and geometric differences between NASA's two flagship thermal sensor systems:
  - **MODIS** (*Moderate Resolution Imaging Spectroradiometer* aboard Terra & Aqua): 1,000 m nadir pixel resolution, 24+ year historical baseline (1999/2002–present), 2,330 km swath.
  - **VIIRS** (*Visible Infrared Imaging Radiometer Suite* aboard Suomi-NPP, NOAA-20, and NOAA-21): 375 m nadir pixel resolution (I-Band), higher spatial fidelity, no edge-of-swath bowtie pixel growth, 3,060 km swath.

  Because VIIRS has approximately **7x higher areal pixel density** ($1,000^2 / 375^2 \approx 7.11$), a single fire front detected as 1 hotspot by MODIS may be detected as 5–15 distinct hotspot pixels by VIIRS. Conversely, MODIS has a 24-year climate data record that VIIRS must harmonize with to ensure long-term climate continuity.

  ### Current Reality of the Codebase
  While the application possesses an impressive, high-fidelity UI (featuring a Three.js 3D Earth globe, Framer Motion transitions, NASA GIBS WMS satellite imagery streaming, and responsive telemetry charts), **the actual scientific harmonization pipeline is almost entirely unbuilt**. The system currently plots both sensors side-by-side or clusters them with a naive 15 km geographic distance check, rather than performing rigorous spatiotemporal grid harmonization, cross-sensor calibration, or unified fire radiative power reconciliation.

  ---

  ## 2. Complete Project Structure

  ```
  FireSync/
  ├── .env                                # Root development environment configuration
  ├── package.json                        # Root workspace script runner (concurrently)
  ├── start-all.bat                       # Windows launcher: Backend + Frontend
  ├── start-backend.bat                   # Windows launcher: Backend only
  ├── start-frontend.bat                  # Windows launcher: Frontend only
  ├── node_modules/                       # Root node packages (concurrently)
  │
  ├── ai-design-skills/                   # Cloned design skill references (non-runtime)
  │   └── ai-design-skills-main/          # Figma & landing page prompt engineering tools
  │
  ├── backend/                            # Express + TypeScript + Prisma REST API
  │   ├── .env                            # Backend local environment config
  │   ├── .env.example                    # Template environment config
  │   ├── package.json                    # Backend dependencies & npm scripts
  │   ├── tsconfig.json                   # Backend TypeScript compiler options
  │   ├── prisma/
  │   │   ├── schema.prisma               # Prisma data schema (PostgreSQL)
  │   │   └── seed.ts                     # Database seeder with realistic test hotspots
  │   ├── dist/                           # Compiled JavaScript artifacts
  │   └── src/
  │       ├── index.ts                    # Server entrypoint (HTTP + IPC listener)
  │       ├── app.ts                      # Express application setup, CORS, Swagger UI
  │       ├── api.test.ts                 # Native Node.js test suite for API endpoints
  │       ├── config/
  │       │   ├── env.ts                  # Zod schema validation for environment variables
  │       │   └── logger.ts               # Winston structured logging utility
  │       ├── db/
  │       │   └── prisma.ts               # PrismaClient instance & connection telemetry
  │       ├── jobs/
  │       │   └── scheduler.ts            # Node-cron task runner for NASA FIRMS ingestion
  │       ├── middleware/
  │       │   ├── auth.ts                 # JWT extraction & role authorization
  │       │   ├── errorHandler.ts         # Centralized error handler & status mapper
  │       │   ├── rateLimiter.ts          # In-memory IP-based rate limiter
  │       │   └── validation.ts           # Zod schema validation middleware
  │       ├── routes/
  │       │   ├── index.ts                # Master router mounting /api/v1/*
  │       │   ├── authRoutes.ts           # Authentication (/login, /register, /me)
  │       │   ├── dashboardRoutes.ts      # Global metrics & regional activity
  │       │   ├── fireRoutes.ts           # Hotspot query, nearby search, get-by-id
  │       │   ├── historyRoutes.ts        # Historical statistics by region
  │       │   ├── incidentRoutes.ts       # FireIncident clusters
  │       │   ├── satelliteRoutes.ts      # Spacecraft mission telemetry & GIBS layers
  │       │   ├── systemRoutes.ts         # Health check & database status
  │       │   ├── userRoutes.ts           # User profile, saved locations, alert rules
  │       │   └── weatherRoutes.ts        # Open-Meteo live weather proximity proxy
  │       ├── services/
  │       │   ├── authService.ts          # User registration, bcrypt hash, JWT issue
  │       │   ├── fireService.ts          # Hotspot queries, geolocation classification
  │       │   ├── firmsIngestionService.ts # NASA FIRMS CSV ingest & greedy clustering
  │       │   ├── firmsIngestionService.test.ts # Haversine & classification unit tests
  │       │   ├── historyService.ts       # Historical aggregation queries
  │       │   ├── incidentService.ts      # Incident cluster management
  │       │   ├── satelliteService.ts     # Mission specifications & share metrics
  │       │   └── weatherService.ts       # Open-Meteo live API + DB fallback
  │       └── types/
  │           └── index.ts                # Backend DTOs & TypeScript interfaces
  │
  └── frontend/                           # React 18 + Vite + Tailwind CSS + Three.js
      ├── .env                            # Frontend environment (VITE_API_URL)
      ├── index.html                      # Single page application entry HTML
      ├── package.json                    # Frontend dependencies & npm scripts
      ├── postcss.config.js               # PostCSS plugin configuration
      ├── tailwind.config.js              # NASA color palette & custom themes
      ├── tsconfig.json                   # Frontend TypeScript config
      ├── tsconfig.node.json              # Node TypeScript config for Vite
      ├── vite.config.ts                  # Vite config with reverse-proxy to :5000
      ├── public/                         # Static assets
      └── src/
          ├── main.tsx                    # React DOM root entry
          ├── App.tsx                     # React Router, Navigation Bar, Gateway Modal
          ├── index.css                   # Tailwind directives & NASA space theme styles
          ├── components/
          │   ├── auth/
          │   │   └── AuthModal.tsx       # Analyst login / registration popup dialog
          │   ├── dashboard/
          │   │   ├── DashboardGlobalMap.tsx # 2D Leaflet map with sensor color toggles
          │   │   ├── DedicatedSatelliteWorkspace.tsx # NASA GIBS split-screen inspector
          │   │   ├── GlobalWildfireDashboard.tsx # Embedded dashboard metrics widget
          │   │   ├── SatelliteImageryViewer.tsx # Single-image GIBS WMS visualizer
          │   │   └── TacticalLeafletMap.tsx # Compact expandable Leaflet map
          │   ├── earth/
          │   │   ├── AtmosphereGlow.tsx  # Three.js Fresnel atmospheric shader
          │   │   ├── EarthGlobe.tsx      # Interactive 3D WebGL textured Earth globe
          │   │   ├── EarthScene.tsx      # R3F Canvas container with OrbitControls
          │   │   └── fireData.ts         # 58 hardcoded continental NASA hotspots
          │   └── satellites/
          │       ├── satelliteData.ts    # Orbital mechanics & mission specs
          │       ├── SatelliteInfoCard.tsx # Detailed spacecraft spec overlay
          │       ├── SatelliteModal.tsx  # Fullscreen spacecraft dialog
          │       ├── SatelliteOrbit.tsx  # Animated 3D orbital trajectory spline
          │       └── SatelliteViewer3D.tsx # Interactive 3D spacecraft viewer
          ├── pages/
          │   ├── Dashboard/
          │   │   └── Dashboard.tsx       # Main analytics portal with charts & table
          │   ├── HistoricalAnalysis/
          │   │   └── HistoricalAnalysis.tsx # Burning calendar & 12-month trends
          │   ├── HotspotExplorer/
          │   │   └── HotspotExplorer.tsx # Fullscreen interactive Leaflet map & GIBS
          │   ├── LandingPage/
          │   │   └── LandingPage.tsx     # Cinematic 3D globe hero & feature overview
          │   ├── Methodology/
          │   │   └── Methodology.tsx     # Scientific principles (Wien's law, Wooster FRP)
          │   └── SatelliteComparison/
          │       └── SatelliteComparison.tsx # MODIS vs VIIRS spec matrix & pixel sim
          └── services/
              ├── apiClient.ts            # REST client with offline fallback
              ├── fireIntelligenceService.ts # Frontend filtering, KPIs & telemetry logic
              └── satelliteImageryService.ts # NASA GIBS WMS URL builder & spectral modes
  ```

  ---

  ## 3. Technology Stack

  ### Frontend
  - **Core Framework**: React 18.3.1 (TypeScript, strict typing)
  - **Bundler & Dev Server**: Vite 5.4.10
  - **Styling**: Tailwind CSS 3.4.14 with custom NASA Space theme (`space-950`, `nasa-blue`, `nasa-cyan`, `nasa-orange`)
  - **3D Visualization**: Three.js (0.169.0), `@react-three/fiber` (8.17.10), `@react-three/drei` (9.114.0)
  - **2D Geospatial Maps**: Leaflet 1.9.4, `react-leaflet` 4.2.1 (using CartoDB Dark Matter tiles)
  - **Charting & Analytics**: Recharts 2.13.0
  - **Motion & UI Animations**: Framer Motion 11.11.10
  - **Icons**: Lucide React 0.454.0

  ### Backend
  - **Runtime**: Node.js v20+ / v26+
  - **Server Framework**: Express 4.21.2 (TypeScript, CommonJS build output via `tsc`)
  - **Database ORM**: Prisma ORM 5.22.0
  - **Database**: PostgreSQL 14+ (configured with PostGIS awareness)
  - **Security & Utilities**: Helmet 8.0.0, CORS 2.8.5, Cookie-Parser 1.4.7, BcryptJS 2.4.3, JSONWebToken 9.0.2, Zod 3.24.1
  - **API Documentation**: Swagger UI Express 5.0.1 (OpenAPI 3.0 specification at `/api/docs`)
  - **HTTP Client**: Axios 1.7.9 (for NASA FIRMS and Open-Meteo external APIs)
  - **Task Scheduling**: Node-cron 3.0.3 (periodic ingestion cron)
  - **Logging**: Winston 3.17.0 (structured timestamped output)

  ### External APIs Integrated
  - **NASA GIBS WMS (Global Imagery Browse Services)**: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi` (Fully functional, CORS-enabled, keyless).
  - **NASA FIRMS API**: `https://firms.modaps.eosdis.nasa.gov/api/` (Implemented in backend, requires MAP_KEY).
  - **Open-Meteo Weather API**: `https://api.open-meteo.com/v1/forecast` (Fully functional live atmospheric integration).
  - **EOX Sentinel-2 Cloudless Mosaic**: `https://tiles.maps.eox.at/wms` (Functional high-resolution surface fallback).

  ---

  ## 4. Current Application Status

  | Area | Status | Summary |
  | :--- | :---: | :--- |
  | **Frontend UI / Presentation** | `COMPLETE` | High visual quality, smooth 3D globe, animations, dark NASA theme. |
  | **Navigation & Routing** | `COMPLETE` | 6 functional routes (`/`, `/dashboard`, `/hotspots`, `/satellites`, `/historical`, `/methodology`). |
  | **NASA GIBS Imagery** | `COMPLETE` | Live multi-spectral WMS imagery tiles render for chosen coordinates. |
  | **Backend REST API** | `COMPLETE` | 9 route modules, health endpoints, Swagger documentation running on port 5000. |
  | **Open-Meteo Weather Proxy** | `COMPLETE` | Live weather retrieval for fire coordinate proximity. |
  | **User Authentication Gateway** | `COMPLETE` | JWT login, registration, password hashing with local storage token handling. |
  | **NASA FIRMS Ingestion** | `PARTIALLY COMPLETE` | Hardcoded to USA 1-day CSV; naive parsing; fallback to 10 mock points if key is unset. |
  | **Historical Analysis Page** | `PARTIALLY COMPLETE` | UI heatmap and charts are rendered using hardcoded trigonometric math, not real historical data. |
  | **MODIS/VIIRS Harmonization** | `NOT IMPLEMENTED` | No spatial grid, no temporal matching window, no unified FRP calibration, no uncertainty calculation. |
  | **Data Export (CSV/GeoJSON)** | `NOT IMPLEMENTED` | Zero export buttons or endpoints exist. |
  | **Statistical Anomaly Detection**| `NOT IMPLEMENTED` | The term "anomaly" is used only as NASA terminology for active fire pixels. |

  ### Running the Application
  The application can run right now:
  - **Root Launcher**: Run `start-all.bat` or `npm.cmd run dev` from the root directory.
  - **Frontend URL**: `http://localhost:5173`
  - **Backend URL**: `http://localhost:5000`
  - **Swagger Docs**: `http://localhost:5000/api/docs`

  ---

  ## 5. Frontend Audit

  ### 5.1 Pages

  #### 1. Landing Page (`frontend/src/pages/LandingPage/LandingPage.tsx`)
  - **Status**: `COMPLETE`
  - **Functionality**:
    - Interactive Three.js Earth globe rendered using `@react-three/fiber` (`EarthGlobe.tsx`, `AtmosphereGlow.tsx`).
    - Hotspot glowing markers placed around the sphere at accurate polar-to-Cartesian coordinates (`latLonToVector3`).
    - Floating spacecraft models orbiting along 3D elliptical splines (`SatelliteOrbit.tsx`).
    - Click-to-inspect satellite information cards (`SatelliteInfoCard.tsx`).
    - Smooth wheel scroll transition gliding between Hero, Constellation Orbit inspection, and Embedded Dashboard.

  #### 2. Main Dashboard (`frontend/src/pages/Dashboard/Dashboard.tsx`)
  - **Status**: `PARTIALLY COMPLETE`
  - **Working Features**:
    - Time range selector buttons (`24h`, `48h`, `7d`, `30d`) trigger dynamic state updates.
    - Live UTC digital clock ticking every second.
    - KPI metric cards: Active Detections, Peak FRP, High Confidence %, Affected Countries.
    - Recharts visualizations: Diurnal timeline area chart, regional detection bar chart, sensor distribution pie chart.
    - Comprehensive observation table with sorting (by FRP, Confidence, Time, Location) and pagination.
    - Search input filtering table rows by country, region, or satellite name.
    - Clicking any table row opens deep-link inspection in Hotspot Explorer.
    - Attempts live API fetch via `apiClient.getFires({ limit: 1000 })`; cleanly falls back to deterministic cache if backend is disconnected.
  - **Deficiencies**:
    - When backend is offline, time range toggling does not fetch different real historical windows; it filters a synthetic 58-item dataset (`fireIntelligenceService.ts`).
    - No data export button (CSV/GeoJSON).

  #### 3. Hotspot Explorer (`frontend/src/pages/HotspotExplorer/HotspotExplorer.tsx`)
  - **Status**: `PARTIALLY COMPLETE`
  - **Working Features**:
    - Fullscreen 2D Leaflet map (`react-leaflet`) with CartoDB dark tile layer.
    - Satellite platform filter dropdown (`ALL`, `VIIRS`, `MODIS`).
    - Min Confidence slider (0% to 100%) and Min FRP slider (0 MW to 500 MW).
    - Region text search input.
    - Interactive circle markers colored by sensor (Cyan = MODIS 1km, Orange = VIIRS 375m).
    - Clicking a marker opens sidebar detailing coordinates, brightness temperature, estimated biomass combustion rate ($FRP \times 0.082$ kg/s), and overpass metadata.
    - View mode toggle between 2D Map and **Dedicated Satellite Workspace** (`DedicatedSatelliteWorkspace.tsx`).
    - Dedicated Satellite Workspace streams real NASA GIBS multi-spectral imagery (True Color, SWIR False Color, Thermal Anomalies) with interactive split-screen before/after slider.
  - **Deficiencies**:
    - Completely decoupled from `apiClient.ts`! It imports `GLOBAL_HOTSPOTS` directly from `fireData.ts`, ignoring live database entries.
    - No layer to view harmonized fire footprints or spatial grid cells.

  #### 4. MODIS vs VIIRS Comparison (`frontend/src/pages/SatelliteComparison/SatelliteComparison.tsx`)
  - **Status**: `PARTIALLY COMPLETE`
  - **Working Features**:
    - 4 sub-tabs: `3D Satellite Inspection`, `Specifications Matrix`, `Pixel Footprint Simulator`, `Detection Yield Benchmarks`.
    - Tab 0: Three.js interactive 3D satellite viewer (`SatelliteViewer3D.tsx`) with orbit controls and solar panel meshes.
    - Tab 1: Comprehensive comparison table between MODIS and VIIRS (pixel resolution, swath, overpass times, thermal bands, detection limits).
    - Tab 2: Interactive pixel simulator with a slider (20% to 80% fire front intensity) showing a 1km MODIS cell flagging a single hotspot vs a $3 \times 3$ VIIRS 375m subdivided grid pinpointing active sub-quadrants.
    - Tab 3: Recharts bar chart showing detection counts by continental biome.
  - **Deficiencies**:
    - Tab 3 data (`detectionComparisonData`) is hardcoded static numbers (`Amazon Basin: MODIS 420, VIIRS 1140`).
    - **There is no scientific harmonization tool here.** It is purely educational and comparative.

  #### 5. Historical Analysis (`frontend/src/pages/HistoricalAnalysis/HistoricalAnalysis.tsx`)
  - **Status**: `PARTIALLY COMPLETE` (Visual Mockup)
  - **Working Features**:
    - Year selector buttons (`2022`, `2023`, `2024`).
    - 30-day burning activity calendar grid with color intensity grading (1 to 4).
    - Clicking any calendar day reveals count and date summary card.
    - 12-month annual trend line chart and seasonal FRP bar chart.
  - **Deficiencies**:
    - Calendar values are generated using `Math.sin(i / 4) * 800 + Math.random() * 400` (lines 46–58).
    - 12-month trend array `annualTrends` is completely hardcoded (lines 26–39).
    - It does not query `/api/v1/history` despite the backend having a `historyRoutes.ts` and `historyService.ts`!

  #### 6. Methodology (`frontend/src/pages/Methodology/Methodology.tsx`)
  - **Status**: `COMPLETE` (Documentation Page)
  - **Content**:
    - Explains Wien's Displacement Law ($\lambda_{max} = 2898 / T$).
    - Explains Wooster's Fire Radiative Power (FRP) formula:
      $$FRP = \left(\frac{A_{pix} \cdot \sigma}{a}\right) \cdot (L_{MIR,fire} - L_{MIR,bg})$$
    - Explains biomass combustion coefficient ($0.368 \pm 0.015\text{ kg/MJ}$).
    - Transparently documents physical limitations: cloud obscuration, temporal revisit gaps (polar orbits), and false thermal anomalies (solar glint, gas flares).
  - **Deficiencies**:
    - Does not describe MODIS/VIIRS harmonization mathematical methodology.

  ---

  ## 6. Backend Audit

  ### 6.1 Architecture & Express Pipeline (`backend/src/app.ts`)
  - **Security**: `helmet({ contentSecurityPolicy: false })` applied.
  - **CORS**: Dynamically allows localhost / 127.0.0.1 origins with credentials support.
  - **Body Parsers**: JSON & URL-encoded enabled with a 5MB payload limit.
  - **Rate Limiting**: Custom sliding-window in-memory rate limiter (`rateLimiter.ts`: 600 requests / 60 seconds).
  - **Request Logging**: Middleware logs every HTTP request method, URL, status code, and latency in ms via Winston.
  - **API Documentation**: Swagger UI mounted at `/api/docs`.

  ### 6.2 Routes & Controllers

  | Route Path | Controller & Service | Status | Description |
  | :--- | :--- | :---: | :--- |
  | `GET /health` | Inline in `app.ts` | `COMPLETE` | Root health ping (`{ status: 'HEALTHY' }`). |
  | `GET /api/v1/system/health` | `SystemController.getHealth` | `COMPLETE` | PostgreSQL ping, memory usage, uptime, active scheduler status. |
  | `GET /api/v1/system/telemetry` | `SystemController.getTelemetry` | `COMPLETE` | Counts of observations, incidents, missions, and data ingestion logs. |
  | `GET /api/v1/dashboard/overview` | `DashboardController.getOverview` | `COMPLETE` | Aggregated active detections, peak FRP, high-confidence counts. |
  | `GET /api/v1/dashboard/statistics` | `DashboardController.getStatistics` | `COMPLETE` | Regional breakdowns and sensor platform metadata. |
  | `GET /api/v1/dashboard/trends` | `DashboardController.getTrends` | `COMPLETE` | 24-hour diurnal curve split by VIIRS and MODIS. |
  | `GET /api/v1/dashboard/regional-activity` | `DashboardController.getRegionalActivity` | `COMPLETE` | Top burning regions with risk categorizations. |
  | `GET /api/v1/dashboard/sensor-comparison` | `DashboardController.getSensorComparison` | `COMPLETE` | Compares avg FRP, observation counts between VIIRS and MODIS. |
  | `GET /api/v1/fires` | `FireController.getFires` | `COMPLETE` | Supports `minLat`, `maxLat`, `minLon`, `maxLon`, `confidence`, `minFrp`, `timeRange`, `limit`, `offset`. |
  | `GET /api/v1/fires/nearby` | `FireController.getNearbyFires` | `COMPLETE` | Haversine radial distance filter around coordinates (`radiusKm`). |
  | `GET /api/v1/fires/:id` | `FireController.getFireById` | `COMPLETE` | Single observation lookup with joined incident details. |
  | `GET /api/v1/incidents` | `IncidentController.getIncidents` | `COMPLETE` | Lists clustered `FireIncident` records with bounding box filtering. |
  | `GET /api/v1/incidents/:id` | `IncidentController.getIncidentById` | `COMPLETE` | Incident details with all clustered member observations. |
  | `GET /api/v1/satellites` | `SatelliteController.getMissions` | `COMPLETE` | Returns Terra, Aqua, Suomi-NPP, NOAA-20 mission records and detection shares. |
  | `GET /api/v1/satellites/:code` | `SatelliteController.getMissionByCode` | `COMPLETE` | Single mission lookup (e.g. `TERRA`, `AQUA`, `NOAA20`). |
  | `GET /api/v1/satellites/imagery/layers` | `SatelliteController.getImageryLayers` | `COMPLETE` | Returns available NASA GIBS WMTS layer templates. |
  | `GET /api/v1/history` | `HistoryController.getStatistics` | `COMPLETE` | Returns `HistoricalFireStatistics` rows filtered by region and period. |
  | `GET /api/v1/weather/nearby` | `WeatherController.getNearbyWeather` | `COMPLETE` | Proxies Open-Meteo live API with database caching fallback. |
  | `POST /api/v1/auth/register` | `AuthController.register` | `COMPLETE` | User registration with Bcrypt (10 rounds) and JWT issuance. |
  | `POST /api/v1/auth/login` | `AuthController.login` | `COMPLETE` | Password verification and JWT issuance. |
  | `GET /api/v1/users/me` | `UserController.getProfile` | `COMPLETE` | Authenticated profile with saved locations and alert rules. |

  ---

  ## 7. NASA FIRMS Integration Audit

  Inspecting `backend/src/services/firmsIngestionService.ts`:

  ### 7.1 Implemented Features
  - A scheduled cron job initialized by `initializeScheduler()` (`jobs/scheduler.ts`) using the cron expression from `INGESTION_CRON` (default: `*/15 * * * *`).
  - Reads `NASA_FIRMS_MAP_KEY` from environment variables.
  - When `NASA_FIRMS_MAP_KEY` is present, executes live GET requests to:
    `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${env.NASA_FIRMS_MAP_KEY}/${source}/USA/1`
  - Logs job execution status (`RUNNING`, `SUCCESS`, `PARTIAL`, `FAILED`) into `data_ingestion_logs` table.

  ### 7.2 Critical Deficiencies & Scientific Inaccuracies

  ```
                                CURRENT BACKEND FIRMS PIPELINE
  ┌─────────────────────────┐     ┌────────────────────────────────────────────────────────┐
  │ firms.modaps.eosdis...  │ ──> │ URL hardcoded to 'USA' only, 1 day, max 200 rows       │
  └─────────────────────────┘     └────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │ CSV Parsing Issues:                                    │
                                  │ • observationTime set to new Date() (ingestion time!)  │
                                  │ • acq_date + acq_time not parsed into UTC timestamp    │
                                  │ • VIIRS confidence 'l','n','h' parsed with parseFloat  │
                                  │   => NaN => falls back to hardcoded 85                 │
                                  │ • Satellite platform hardcoded by source name string   │
                                  └────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │ If KEY is missing or API fails:                        │
                                  │ • Falls back to 10 static hardcoded coordinate samples │
                                  └────────────────────────────────────────────────────────┘
  ```

  1. **Country & Area Constraint**: The URL only queries `USA/1`. It cannot fetch global data, specific continents, or user-selected bounding boxes (`/api/area/csv/...`).
  2. **Missing Satellite Sources**: It only requests `VIIRS_NOAA20_NRT` and `MODIS_NRT`. It completely omits `VIIRS_SNPP_NRT`, `VIIRS_NOAA21_NRT`, and standard archive products (`MODIS_SP`, `VIIRS_SP`).
  3. **Severe Timestamp Parsing Bug**:
    ```ts
    // Line 275 in firmsIngestionService.ts:
    observationTime: new Date(),
    acquisitionDate: new Date(acqDate || Date.now()),
    ```
    `observationTime` is recorded as the instant the ingestion job ran on the server (`new Date()`), rather than the actual satellite overpass time recorded in `acq_date` (e.g. `2024-08-18`) and `acq_time` (e.g. `1430` $\rightarrow$ 14:30 UTC)! This invalidates any diurnal cycle analysis.
  4. **VIIRS Confidence Bug**:
    ```ts
    // Line 267 in firmsIngestionService.ts:
    const conf = parseFloat(cols[headers.indexOf('confidence')] || '85');
    ```
    MODIS returns confidence as an integer percentage (`0`–`100`). VIIRS returns confidence as categorical strings: `'l'` (low), `'n'` (nominal), `'h'` (high). Running `parseFloat('n')` results in `NaN`, which triggers the fallback to `85`. All VIIRS points are incorrectly assigned a confidence of 85%!
  5. **Spacecraft Platform Misattribution**:
    ```ts
    // Line 277 in firmsIngestionService.ts:
    satellitePlatform: source.includes('VIIRS') ? 'NOAA-20' : 'Terra',
    ```
    All MODIS points are labeled `'Terra'`, even if they came from `'Aqua'`. All VIIRS points are labeled `'NOAA-20'`, even if they came from `'Suomi-NPP'`. The actual `satellite` column in the FIRMS CSV (e.g. `T`, `A`, `N`, `1`) is ignored.

  ---

  ## 8. MODIS and VIIRS Harmonization Audit

  > [!CAUTION]
  > **Core Challenge Assessment**: The challenge is **Harmonization of MODIS and VIIRS Hot Spots**. The project currently does **NOT** perform scientific harmonization. Simple co-plotting of both sensors on a map is not harmonization.

  ### Feature-by-Feature Harmonization Evaluation

  | Harmonization Requirement | Status | File Location / Function | Detailed Technical Evaluation |
  | :--- | :---: | :--- | :--- |
  | **Common Data Schema** | `PARTIALLY COMPLETE` | `backend/prisma/schema.prisma` (`FireObservation`) | Stores both sensors in the same table with fields `latitude`, `longitude`, `frp`, `confidence`, `sensor`, `satellitePlatform`. However, it lacks harmonization metadata fields (matched status, grid cell ID, uncertainty bounds, sensor count, adjusted FRP). |
  | **Timestamp Standardization** | `BROKEN` | `backend/src/services/firmsIngestionService.ts:275` | Fails to combine `acq_date` + `acq_time` (HHMM) into ISO 8601 UTC. Instead saves server current time `new Date()`. |
  | **Spatial Grid Assignment** | `NOT IMPLEMENTED` | None | No discrete global grid system (e.g. 0.05°, 0.1°, 0.25° or Equal-Area Scalable Earth Grid EASE-Grid 2.0 / H3 / S2) is implemented. Hotspots remain raw point coordinates. |
  | **Spatial Matching between Sensors** | `NOT IMPLEMENTED` | `firmsIngestionService.ts:46` (`clusterAndAssignIncidents`) | What the project calls "clustering" is simply a greedy distance search ($\le 15\text{ km}$ and $\le 24\text{ hours}$) that merges points into generic `FireIncident` clusters by averaging coordinates. This is **not** spatial matching of overlapping sensor footprints. |
  | **Temporal Matching Window** | `NOT IMPLEMENTED` | None | Does not match observations based on concurrent or near-concurrent satellite overpasses (e.g., Aqua MODIS at ~13:30 local and Suomi-NPP VIIRS at ~13:30 local with a $\pm 30$-minute window). |
  | **Sensor-Specific Confidence Handling** | `BROKEN` | `firmsIngestionService.ts:267` | Fails to map VIIRS categorical confidence (`low`, `nominal`, `high`) to normalized statistical probabilities or calibrated MODIS equivalents ($<30\%$, $30-80\%$, $>80\%$). |
  | **Classification: Matched Observations** | `NOT IMPLEMENTED` | None | Cannot determine whether a fire was co-detected by both MODIS and VIIRS during the same overpass window. |
  | **Classification: MODIS-Only** | `NOT IMPLEMENTED` | None | Does not identify fires seen exclusively by MODIS (e.g. during Terra morning pass when VIIRS was not overhead, or saturated large fire clusters). |
  | **Classification: VIIRS-Only** | `NOT IMPLEMENTED` | None | Does not identify fires detected exclusively by VIIRS (critical for small fire detection thresholds where 375m pixels detect agricultural/spot burns undetectable at 1,000m). |
  | **Unified Burning Activity Metric** | `NOT IMPLEMENTED` | None | Uses raw FRP directly. Does not apply regression models, kernel density estimation, or spatial footprint weighting to calculate an inter-calibrated, sensor-independent burning intensity. |
  | **Quality & Uncertainty Information** | `NOT IMPLEMENTED` | None | No uncertainty variance, confidence interval, or scan angle degradation factor ($\theta_{scan}$) is computed. |

  ---

  ## 9. Database & API Audit

  ### 9.1 Database Architecture
  - **Engine**: PostgreSQL with relational tables mapped via Prisma ORM (`prisma/schema.prisma`).
  - **Connection Configuration**: Loaded via `DATABASE_URL` in `backend/.env`. (Updated to standard TCP `postgresql://postgres:postgres@localhost:5432/firesync`).

  ### 9.2 Data Models

  ```mermaid
  erDiagram
      User ||--o{ SavedLocation : "creates"
      User ||--o{ AlertRule : "configures"
      FireIncident ||--o{ FireObservation : "clusters"
      
      User {
          string id PK
          string email UK
          string passwordHash
          string fullName
          UserRole role
          AccountStatus status
          datetime createdAt
      }
      
      FireIncident {
          string id PK
          string name
          float latitude
          float longitude
          datetime firstObservedAt
          datetime lastObservedAt
          FireStatus status
          int observationCount
          float peakFrp
          float totalFrp
          json estimatedPerimeter
          string region
      }

      FireObservation {
          string id PK
          float latitude
          float longitude
          datetime observationTime
          datetime acquisitionDate
          string satellitePlatform
          string sensor
          float confidence
          float brightnessTemp
          float frp
          float scan
          float track
          string dayNight
          string sourceDataset
          string sourceId UK
          string incidentId FK
      }

      SatelliteMission {
          string id PK
          string missionCode UK
          string name
          string satellitePlatform
          string sensor
          string orbitType
          float altitudeKm
          string spatialResolution
          string status
      }

      DataIngestionLog {
          string id PK
          string source
          string jobId
          datetime startTime
          datetime endTime
          int recordsReceived
          int recordsInserted
          int recordsFailed
          IngestionStatus status
      }
  ```

  ### 9.3 Missing Database Tables for Harmonization
  To deliver a credible scientific harmonization platform, the database lacks:
  1. `HarmonizedFireCell`: Grid-aggregated observations (e.g. $0.1^\circ \times 0.1^\circ$ cells with calculated unified FRP, sensor count, and detection class).
  2. `HarmonizationJob`: Records of harmonization algorithm runs, input parameters, convergence criteria, and statistical discrepancy metrics.
  3. `CrossSensorCalibration`: Lookup table for empirical regression slopes ($FRP_{VIIRS} \leftrightarrow FRP_{MODIS}$) across different global vegetation biomes (Boreal, Savanna, Tropical Moist Forest, Temperate).

  ---

  ## 10. Feature Completion Checklist

  | # | Proposed Feature | Expected Functionality | Actual Status in Code | Verdict |
  | :-: | :--- | :--- | :--- | :---: |
  | **1** | **Main Dashboard** | Global KPIs, diurnal timeline, regional activity, observation table. | Fully interactive UI; connects to backend or uses deterministic cache. | `COMPLETE` |
  | **2** | **Interactive Hotspot Map** | Global 2D map with coordinates, filters, popups, and satellite switcher. | Leaflet map with full filtering, but decoupled from backend database (reads static file). | `PARTIALLY COMPLETE` |
  | **3** | **MODIS vs VIIRS Comparison** | Radiometry comparison, specs matrix, interactive pixel footprint simulator. | High quality educational tools; no live dataset harmonization engine. | `PARTIALLY COMPLETE` |
  | **4** | **Burning Activity Calendar** | Daily calendar heatmap of burning intensity and seasonal fluctuations. | UI rendered; values generated with `Math.sin()`, ignores historical DB records. | `PARTIALLY COMPLETE` |
  | **5** | **Historical Fire Activity Analysis** | Decadal trends, annual comparisons, climate anomaly charts. | Charts render hardcoded array; not connected to API `/history`. | `PARTIALLY COMPLETE` |
  | **6** | **Statistical Anomaly Detection** | Z-score / IQR detection of abnormal fire outbreaks compared to baselines. | Not implemented. "Anomaly" is only used as a label for active fire pixels. | `NOT IMPLEMENTED` |
  | **7** | **Region and Date Filters** | Dynamic filtering by geographic bounding box and date ranges. | Implemented on Dashboard and Hotspot Explorer; backend supports bounding box. | `COMPLETE` |
  | **8** | **Data Export** | Download harmonized data as CSV, GeoJSON, or JSON. | Zero download endpoints or buttons exist. | `NOT IMPLEMENTED` |
  | **9** | **Methodology & Data Sources Page** | Scientific documentation on radiometry physics, FRP, and algorithms. | Comprehensive coverage of Planck/Wooster radiometry; lacks harmonization methodology. | `COMPLETE` |
  | **10** | **Scientific MODIS/VIIRS Harmonization** | Spatiotemporal matching, grid aggregation, unified burning metric. | Completely unbuilt; only naive 15km geographic clustering exists. | `NOT IMPLEMENTED` |

  ---

  ## 11. Bugs, Technical Debts & Technical Risks

  1. **Decoupled Frontend Map**: `HotspotExplorer.tsx` imports `GLOBAL_HOTSPOTS` directly from `fireData.ts` instead of calling `apiClient.getFires()`. As a result, live ingested observations from NASA never appear on the main map.
  2. **FIRMS Acq Time Bug**: `firmsIngestionService.ts` line 275 stamps all incoming records with server clock `new Date()` instead of parsing the satellite overpass `acq_date` and `acq_time`.
  3. **VIIRS Confidence NaN Bug**: `parseFloat(cols[headers.indexOf('confidence')])` evaluates to `NaN` for VIIRS categorical letters (`'l'`, `'n'`, `'h'`), causing every VIIRS detection to silently default to 85.
  4. **Hardcoded Mock Fallbacks Throughout Frontend**:
    - `HistoricalAnalysis.tsx` uses mathematical sine waves for the calendar.
    - `SatelliteComparison.tsx` uses hardcoded counts for detection yield.
    - `apiClient.ts` has 150 lines of static fallback objects.
  5. **Missing Database Indices**: `FireObservation` does not index `(sensor, observationTime)`, which will cause sequential table scans when querying large FIRMS datasets.
  6. **Rate Limiting In-Memory**: `rateLimiter.ts` stores IP counts in an in-memory `Map`. In production multi-process clusters, this state is not shared and will reset on server restart.

  ---

  ## 12. Missing Features Required for Space Apps 2026

  To win or excel in the **Harmonization of MODIS and VIIRS Hot Spots** challenge, the application must provide:

  1. **A Harmonization Engine (Algorithm)**:
    - **Spatial Discretization**: A regular spatial grid (e.g. $0.1^\circ \times 0.1^\circ$ or $0.25^\circ \times 0.25^\circ$ global bounding cells).
    - **Temporal Coincidence Matching**: Pairing Aqua (13:30) and Suomi-NPP/NOAA-20 (13:20–13:30) overpasses within a $\pm 45$-minute window.
    - **Categorization Output**: Every grid cell labeled as:
      1. `CO-DETECTED` (Both MODIS and VIIRS observed the fire).
      2. `VIIRS_EXCLUSIVE` (Fire detected only by 375m VIIRS, e.g. low-intensity or small spot fire).
      3. `MODIS_EXCLUSIVE` (Fire detected only by MODIS, e.g. temporal pass difference or heavy cloud gap).
    - **Unified Burning Intensity Index (UBII / Harmonized FRP)**: Correcting for the 7x resolution bias using an empirical biome-calibrated conversion ratio:
      $$FRP_{harmonized} = f(FRP_{VIIRS}, FRP_{MODIS}, \text{Biome}, \theta_{scan})$$
  2. **Harmonized Map Layer**:
    - On the interactive map, allow the user to toggle:
      - Raw MODIS layer (Cyan)
      - Raw VIIRS layer (Orange)
      - **Harmonized Composite Grid (Green/Gold)** showing cell-based reconciled burning activity.
  3. **Harmonization Metrics Dashboard**:
    - Cross-sensor scatter plot ($FRP_{MODIS}$ vs $FRP_{VIIRS}$) with regression trend line ($R^2$, slope, bias).
    - Detection yield ratio by region ($\text{Ratio} = N_{VIIRS} / N_{MODIS}$).
  4. **Data Export Utility**:
    - Export filtered and harmonized results as GeoJSON, CSV, and netCDF/JSON.
  5. **Actual Historical Database Integration**:
    - Wire `HistoricalAnalysis.tsx` to read real aggregated records from `/api/v1/history`.

  ---

  ## 13. Recommended Development Roadmap

  ### Phase 1: Core Harmonization Algorithm (Highest Priority)
  1. **Create Harmonization Service** (`backend/src/services/harmonizationService.ts`):
    - Implement spatial binning function: given lat/lon, assign to a $0.1^\circ$ or $0.25^\circ$ cell key (`grid_lat_lon`).
    - Implement temporal matching window ($\pm 60$ minutes between Aqua and S-NPP/NOAA-20 passes).
    - Implement classification: `MATCHED`, `VIIRS_ONLY`, `MODIS_ONLY`.
    - Implement unified FRP estimation formula.
  2. **Expose Harmonization REST API** (`backend/src/routes/harmonizationRoutes.ts`):
    - `GET /api/v1/harmonization/grid` (returns grid cells with counts, harmonized FRP, and classification).
    - `GET /api/v1/harmonization/metrics` (returns regression stats, detection ratios, and discrepancy percentages).
  3. **Fix FIRMS Ingestion Pipeline**:
    - Correctly parse `acq_date` + `acq_time` into true UTC ISO timestamps.
    - Properly map VIIRS confidence (`l` $\rightarrow$ 25%, `n` $\rightarrow$ 60%, `h` $\rightarrow$ 95%).
    - Allow area bounding box querying (`/api/area/csv/...`).

  ### Phase 2: Frontend Map & Harmonization Visualization
  1. **Connect Hotspot Explorer to Live Backend**:
    - Update `HotspotExplorer.tsx` to call `apiClient.getFires()` and `apiClient.getHarmonizedGrid()`.
  2. **Add Harmonized View to Map**:
    - Add a layer toggle to `HotspotExplorer.tsx` and `DashboardGlobalMap.tsx`:
      - [x] Raw MODIS (1km)
      - [x] Raw VIIRS (375m)
      - [x] Harmonized 0.1° Grid Cells (Color-coded by Co-detected vs Sensor-exclusive)
  3. **Build Harmonization Analytics Widget** on the Satellite Comparison page:
    - Replace static bar chart with live scatter plot of matched clusters ($FRP_{MODIS}$ vs $FRP_{VIIRS}$) and distribution histograms.

  ### Phase 3: Historical & Export Features
  1. **Wire Historical Page**:
    - Update `HistoricalAnalysis.tsx` to call `/api/v1/history` to render real seasonal curves and calendar heatmaps.
  2. **Implement Data Export**:
    - Add `ExportButton` component allowing download of current query as `GeoJSON` or `CSV`.
    - Add backend endpoint `GET /api/v1/fires/export?format=csv|geojson`.

  ### Phase 4: Final Demonstration Preparation
  1. Ensure graceful fallback continues to work seamlessly when offline.
  2. Add a sample pre-loaded dataset of 2,000 real NASA FIRMS points covering a major historical wildfire event (e.g., 2023 Canadian Wildfires or 2024 Pantanal/Amazon Fire Season) for offline presentation.

  ---

  ## 14. Exact Commands to Run the Application

  ### Prerequisites
  - Node.js (v18, v20, or v22+) installed.
  - PowerShell or Command Prompt on Windows.

  ### Start Everything (Frontend + Backend)
  From the project root directory (`FireSync/`):
  ```powershell
  .\start-all.bat
  ```
  *Or using npm directly:*
  ```powershell
  npm.cmd run dev
  ```

  ### Start Services Individually
  - **Backend Only (Port 5000)**:
    ```powershell
    .\start-backend.bat
    # Or:
    cd backend
    npm.cmd run dev
    ```
  - **Frontend Only (Port 5173)**:
    ```powershell
    .\start-frontend.bat
    # Or:
    cd frontend
    npm.cmd run dev
    ```

  ### Build & Verify Production Bundles
  - **Build Backend**:
    ```powershell
    cd backend
    npm.cmd run build
    ```
  - **Build Frontend**:
    ```powershell
    cd frontend
    npm.cmd run build
    ```

  ---

  ## 15. Key Files to Understand Before Continuing Development

  | File Path | Role & Why You Must Read It |
  | :--- | :--- |
  | [`backend/prisma/schema.prisma`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/backend/prisma/schema.prisma) | The core database schema defining `FireObservation`, `FireIncident`, and `SatelliteMission`. Needs additions for harmonization grid cells. |
  | [`backend/src/services/firmsIngestionService.ts`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/backend/src/services/firmsIngestionService.ts) | Controls NASA FIRMS CSV retrieval, timestamp parsing, and initial clustering. Must be fixed for proper timestamp and confidence handling. |
  | [`backend/src/services/fireService.ts`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/backend/src/services/fireService.ts) | Queries database observations and enriches them with geographic and biome classifications. |
  | [`frontend/src/services/apiClient.ts`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/frontend/src/services/apiClient.ts) | The central REST communication layer between frontend and backend with offline fallback structures. |
  | [`frontend/src/services/satelliteImageryService.ts`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/frontend/src/services/satelliteImageryService.ts) | Generates live NASA GIBS WMS URLs for multi-spectral imagery. |
  | [`frontend/src/pages/HotspotExplorer/HotspotExplorer.tsx`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/frontend/src/pages/HotspotExplorer/HotspotExplorer.tsx) | The primary 2D map interface. Needs to be reconnected to live API data and support harmonized grid display. |
  | [`frontend/src/pages/SatelliteComparison/SatelliteComparison.tsx`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/frontend/src/pages/SatelliteComparison/SatelliteComparison.tsx) | The key page for the challenge. Needs live cross-sensor reconciliation analytics and scatter plots. |
  | [`frontend/src/components/earth/fireData.ts`](file:///c:/Users/PRUTHVIRAJ/Documents/nasa-project/FireSync/frontend/src/components/earth/fireData.ts) | Contains the 58 verified continental hotspot seed coordinates used as fallback across the application. |

