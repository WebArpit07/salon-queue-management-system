# 10-Prompt Execution Log — Salon Queue Management System

**Live Frontend (Vercel):** https://salon-queue-management-system-249om38gv-web-arpit.vercel.app  
**Live Backend API (Render):** https://salon-queue-api-tjbn.onrender.com  
**Database:** MongoDB Atlas (M0 Free Cluster)  
**Staff Demo PIN:** `1234` (Applies to `/reception`, `/barber/:name`, `/admin`)

---

## 1. 10-Prompt Execution Roadmap & Milestones

### Prompt 1: Environment, Docs-First Architecture, Scaffolding & Design Tokens
- **Objective**: Establish the modular monorepo structure, core specification documents (`docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`), project dependencies, luxury design tokens, motion presets, and bilingual scaffolding (`en.js`, `gu.js`, `LanguageContext.jsx`).
- **Key Deliverables**:
  - Root `package.json` with `concurrently` workflows for simultaneous backend and frontend dev execution.
  - Bespoke obsidian palette (`#0B0F17`, `#111827`, `#1F2937`), warm gold accents (`#D4AF37`, `#F59E0B`), and glassmorphism utility classes.
  - Typography configuration: `Plus Jakarta Sans` (Body & UI), `Instrument Serif` (Editorial headings), and `Noto Sans Gujarati` (Native Gujarati script).
  - Apple OS-inspired spring motion presets in `client/src/lib/motion.js`.
  - Verified server and client health-check endpoints.

---

### Prompt 2: MongoDB Schemas, Atomic Token Counter, Seed Data & Bootstrap API
- **Objective**: Implement Mongoose schemas, daily token counter with atomic sequence incrementing, timezone logic for Asia/Kolkata (IST), seed script for Indian salon context, and bootstrap API.
- **Key Deliverables**:
  - `Service.js`: Service catalog with bilingual titles, descriptions, durations, and INR pricing.
  - `Barber.js`: Barbers with slug, status (`available`, `busy`, `on_break`), `onDuty`, and `currentTicketId`.
  - `QueueTicket.js`: Multi-service tickets with compound indexes `{ dateKey, status, joinedAt }` and active phone guards.
  - `DailyCounter.js`: Atomic `getNextToken(dateKey)` generating `S-1`, `S-2`, etc., resetting cleanly at midnight IST.
  - Embedded in-memory MongoDB fallback in `server/src/config/db.js` for zero-setup local execution.
  - `GET /api/bootstrap` snapshot endpoint and `POST /api/auth/verify-pin` (`1234`).

---

### Prompt 3: Core Queue Engine, Business Rules, REST API & Real-Time Socket.IO Sync
- **Objective**: Implement single-source-of-truth queue engine, REST endpoints for Customer, Reception, Barber, and TV display, staff PIN middleware, and Socket.IO state synchronization.
- **Key Deliverables**:
  - `requireStaffPin.js` middleware validating `x-staff-pin` header and body fallback.
  - Forward-only state machine: `waiting ➔ called ➔ in_chair ➔ done`, `waiting ➔ cancelled`, `called ➔ no_show`. Backwards state mutations strictly rejected with HTTP 400.
  - Dynamic wait time algorithm balancing active chair sessions and queue positions.
  - Barber preference assignment rule prioritizing specific requests while allowing flexible "Any" routing.
  - Real-time events: `'queue:updated'` and `'ticket:called'`.
  - Automated 8-test suite in `verifyQueueEngine.js` passing with 0 errors.

---

### Prompt 4: App Shell, EN/GU Language Switcher, Global State, Home & Join Queue Screens
- **Objective**: Construct main client routing, elevated glassmorphic app shell, global Socket.IO/state context, and implement Screen 1 (Home `/`) and Screen 2 (Join Queue `/join`).
- **Key Deliverables**:
  - `QueueContext.jsx` binding Socket.IO and REST snapshot state with optimistic updates.
  - `HomePage.jsx`: Hero glass card, live wait estimate pill, barber chip status carousel, and active ticket quick-access banner.
  - `JoinQueuePage.jsx`: 10-digit Indian mobile mask, max-3 service selector with live price/time tally, barber selector, and duplicate spot recovery.
  - Language toggle (`EN` / `ગુજરાતી`) with instant persistence in `localStorage`.

---

### Prompt 5: Customer Live Status Tracker (/status/:id) & Active Ticket Persistence
- **Objective**: Build Screen 3 (My Status `/status/:id`) modeled on the top-right card of the showcase artwork with live countdown, Web Audio chime, and vibration alerts.
- **Key Deliverables**:
  - Animated SVG countdown ring with pulse states for `waiting`, `called`, `in_chair`, and terminal states.
  - Web Audio harmonic three-tone chime ($E_5 \rightarrow G^\sharp_5 \rightarrow B_5$) and browser vibration pattern `[250, 120, 250]`.
  - Self-service cancellation modal with double-confirmation dialog.
  - Active ticket persistence via `localStorage.salon_active_ticket` and deep-link recovery.

---

### Prompt 6: Staff PIN Gate, Receptionist Dashboard & Barber Station View
- **Objective**: Implement reusable Staff PIN unlock gate, Screen 4 (Receptionist `/reception`), and Screen 5 (Barber Station `/barber/:name`).
- **Key Deliverables**:
  - `StaffPinGate.jsx` with 4-digit PIN pad and session persistence.
  - `ReceptionPage.jsx`: Tablet-optimized multi-column layout, walk-in modal, queue table with >60m wait warnings, row actions (`Call Next`, `No-show`, `Cancel`).
  - `BarberPage.jsx`: Mobile station view with elapsed cut stopwatch, `[ Start ]`, `[ Done ]`, break status toggle, and "Next for you" preview.

---

### Prompt 7: Ambient Waiting Area TV Display (/display)
- **Objective**: Build Screen 6 (Waiting Area TV `/display`) optimized for 1080p/4K TVs visible from 5 meters away.
- **Key Deliverables**:
  - Full-screen distraction-free layout bypassing standard headers/footers.
  - Left pane: Giant "Now Serving" tokens with assigned barber names.
  - Right pane: "Up Next" numbered list with dynamic wait times.
  - Audio-visual callout banner triggered on `'ticket:called'` with Web Audio announcement chime and 6-second gold pulse.

---

### Prompt 8: Owner Settings & Admin Dashboard (/admin) + Mobile & Bilingual Polish
- **Objective**: Build Screen 7 (Owner Admin `/admin`), service catalog CRUD, master queue controls, and mobile tap-target accessibility polish.
- **Key Deliverables**:
  - Today's stats trio: Customers Served, Average Wait Time, No-shows.
  - Master Queue Open/Closed toggle and operating hours editor.
  - Barber roster on-duty switchboard.
  - Service management modal with dual-language inputs and price/duration controls.
  - Minimum 44px tap targets verified across all mobile touch zones.

---

### Prompt 9: End-to-End QA Audit, Production Hardening & Cloud Deployment Config
- **Objective**: Audit 11 core system rules against `docs/03-flows-rules.md`, sanitize all URLs, configure multi-origin CORS, and prepare cloud deployment files.
- **Key Deliverables**:
  - Comprehensive automated test suite `server/src/tests/verifyE2EQAAudit.js` (`npm run test:qa`) passing all 11 criteria.
  - `client/vercel.json` SPA rewrite rules.
  - `render.yaml` infrastructure-as-code blueprint for Render backend.
  - Dynamic CORS supporting comma-separated `CLIENT_URL` and `*.vercel.app` origins.
  - `GET /api/health` reporting accurate database connection and uptime states.

---

### Prompt 10: Production README.md, Prompts.md & Final Submission Audit
- **Objective**: Finalize submission documentation with verified top live links, staff demo credentials, architecture diagrams, API specs, and cloud deployment fixes runbook.
- **Key Deliverables**:
  - Root `README.md` with required 4 top lines, live demo links, 7 routes table, queue rules, and setup instructions.
  - Complete `prompts.md` documenting all 10 prompts, UI reference notes, and detailed deployment fixes.
  - Zero-error test suite verification (`npm run test:qa` and `npm --prefix server run test:engine`).

---

### Prompt 11: Follow-Up Bug Audit & Full E2E Fix — Blank Screens, Navbar Routes & TV Display
- **Objective**: Conduct an exhaustive end-to-end browser audit across all 7 routes, both languages (EN & GU), and desktop/mobile viewports to reproduce and eliminate blank screens, broken navbar targets, and TV display audio/rendering crashes.
- **Key Deliverables & Fixes**:
  - Fixed runtime crash `Uncaught ReferenceError: TactileCard is not defined` in `MyStatusPage.jsx` (`/status/:id`).
  - Implemented `ErrorBoundary.jsx` wrapping the router outlet in `App.jsx` with an interactive recovery button.
  - Added robust route aliases in `App.jsx` (`/barber` -> `/barber/ravi`, `/ticket/:id` -> `MyStatusPage`, `/status`, `/ticket`).
  - Added user-interaction recovery and error-boundary handlers in `soundAlert.js` to prevent unhandled Web Audio autoplay exceptions.
  - Hardened API response destructuring in `JoinQueuePage.jsx` (`res.data.ticket?._id || res.data._id`).
  - Added lowercase status localization fallbacks (`waiting`, `called`, `in_chair`, `done`, `cancelled`, `no_show`) to `en.js` and `gu.js`.
  - Integrated bespoke barber silhouette vector logo (`SalonLogo.jsx`) and modernized bilingual typography lockup across `AppShell.jsx`, `DisplayTvPage.jsx`, and `ReceptionPage.jsx`.
  - Verified clean compilation with `npm --prefix client run build` (0 errors).

#### Executed Follow-Up Audit Prompt:
~~~markdown
# FOLLOW-UP BUG AUDIT & FULL E2E FIX: BLANK SCREENS, NAVBAR ROUTES & TV DISPLAY

Act as a Principal Full-Stack & QA Engineer. Before writing fixes, **start the backend and frontend servers, open a live browser preview, and run a deep end-to-end audit across every route, button, and user flow** to catch all runtime crashes, routing mismatches, and UI bugs.

---

## 1. Known Bugs to Reproduce & Diagnose First
1. **Blank Screen After Submitting "Join Queue" (`/join`):**
  - Fill out the Join Queue form (10-digit phone, 1–3 services, barber preference) and submit.
  - Diagnose why it renders a blank screen after submission:
    - Check route path mismatches between the `navigate(...)` call and `App.jsx` routes (e.g., `/status/:id` vs `/ticket/:id`).
    - Check API response shape destructuring (`res.data._id` vs `res.data.id` vs `res.data.ticket._id`) and verify the target Status page safely handles loading/undefined states without throwing a `Cannot read properties of undefined` crash.
2. **Navbar & Top-Right Navigation Buttons Leading to Blank Screens:**
  - Click every link, icon, and button in the top navigation bar (both desktop navbar and mobile menu) across all screens.
  - Fix any broken `to="..."` / `navigate(...)` targets that do not match defined routes in `App.jsx` (e.g., `/barber` without a slug vs `/barber/ravi`, `/status` without `:id`, etc.) or components crashing on missing props/context.
  - Wrap the router outlet in a clean **React Error Boundary** with a fallback recovery button so no uncaught error can ever produce an empty blank screen.
3. **Waiting Area TV Display (`/display`) Not Working Properly:**
  - Open `/display` and inspect browser console errors, network requests, Socket.IO event listeners, and layout rendering.
  - Fix any crashes caused by empty queue states, undefined barber/ticket fields, broken layout/overflow on standard viewports, or Web Audio API chime errors blocked by browser autoplay policies (gracefully catch audio errors so visual callouts never break).

---

## 2. Deep Full-Site Audit (Find & Fix All Hidden Issues)
Crawl and test **all 7 routes** in both **English** and **ગુજરાતી**, on both **Desktop (1440×900)** and **Mobile (390×844)** viewports, checking the browser console and network tab on every step:
1. **Customer Home (`/`):** Live socket status pill, open/closed banner, barber availability cards, active ticket recovery banner, and every CTA button.
2. **Join Queue (`/join`):** Form validation, service selection (1 to 3 max), duplicate phone handling, and clean redirect to the live ticket screen.
3. **Customer Ticket Status (`/status/:id`):** Direct URL refresh resilience, live queue position, estimated wait countdown, cancel ticket action, and real-time "Your Turn / Called" alert banner.
4. **Receptionist Desk (`/reception`, PIN `1234`):** PIN unlock flow, walk-in ticket creation, Call Next, No-Show, and Cancel buttons.
5. **Barber Station (`/barber/ravi`, `/barber/amit`, `/barber/imran`, PIN `1234`):** Invalid barber slug handling, Call Next, Start Service (`in_chair`), Complete (`done`), and Break toggle.
6. **Waiting Area TV (`/display`):** Real-time "Now Serving / Called" spotlight, waiting list board, and live updates when Reception/Barber calls a client.
7. **Owner Admin (`/admin`, PIN `1234`):** Queue open/closed toggle, barber on-duty toggles, service catalog add/edit/delete, and daily stats.

---

## 3. Execution & Verification Requirements
- **Fix every root cause** cleanly in `client/` and `server/` (do not silence errors with hacks).
- **Re-test every flow end-to-end** in the browser after fixing to confirm **0 console errors**, **0 blank screens**, and **< 1s Socket.IO live sync** across tabs.
- Run `npm --prefix client run build` to verify the production Vite bundle compiles cleanly with 0 errors (and clean up `client/dist/` if git-ignored).
- Provide a concise changelog of every bug found and fixed, followed by the exact `git add`, `git commit`, and `git push origin main` commands so Vercel and Render auto-deploy the fixes.
~~~

---

## 🎨 UI Reference Notes & Design Tokens

### 1. Bespoke Color Palette
- **Obsidian Dark Surface**: `#0B0F17` (Deep foundation), `#111827` (Card surface), `#1F2937` (Subtle borders and elevated panels).
- **Warm Gold & Amber**: `#D4AF37` (Primary brand accent, ticket badges, highlight rings), `#F59E0B` (In-chair and active status pills).
- **Emerald Accent**: `#10B981` (Available barbers, healthy system pulse, completion confirmations).
- **Crimson / Rose**: `#EF4444` (No-shows, cancelled tickets, destructive confirmation actions).
- **Muted Slate**: `#94A3B8` (Secondary labels, time stamps, subtitles).

### 2. Typography System
- **Body & Controls**: `Plus Jakarta Sans`, sans-serif (Clean, modern geometry with high legibility on small mobile displays).
- **Editorial Brand Headlines**: `Instrument Serif`, serif (Elevated luxury flourishes on hero headings).
- **Gujarati Script**: `Noto Sans Gujarati`, sans-serif (Pixel-perfect unicode rendering of Gujarati conjuncts and diacritics).

### 3. Apple OS-Inspired Spring Motion Presets
Configured in `client/src/lib/motion.js`:
- `springSmooth`: `{ type: "spring", stiffness: 350, damping: 28 }`
- `springSnappy`: `{ type: "spring", stiffness: 450, damping: 25 }`
- `springGentle`: `{ type: "spring", stiffness: 200, damping: 24 }`
- No linear transitions — all modals, lists, status rings, and toast notifications enter and exit with natural physical momentum.

### 4. Audio & Haptic Feedback Engine
- **Synthesizer**: Web Audio API `AudioContext` without external sound file dependencies (prevents broken audio links).
- **Chime Chord**: 3 harmonic tones played in micro-arpeggio ($E_5 = 659.25\text{Hz}$, $G^\sharp_5 = 830.61\text{Hz}$, $B_5 = 987.77\text{Hz}$) with exponential gain decay.
- **Haptic Vibration**: Dual-burst pattern `[250, 120, 250]` via `navigator.vibrate` on supported Android and mobile browsers.

---

## 🛠️ Deployment Fixes & Cloud Architecture Runbook

During the production rollout to Render, MongoDB Atlas, and Vercel, three critical cloud configuration challenges were solved:

### 1. Render Root Directory & Monorepo Build Setup
- **The Issue**:
  Render defaulted to the repository root directory. Since the root `package.json` was configured as a workspace runner using `concurrently`, running `npm start` directly on Render caused process lifecycle issues and failed to start the Express server on `0.0.0.0:$PORT`.
- **The Fix**:
  1. Configured `rootDir: server` in `render.yaml` and set the Render Web Service Root Directory to `server`.
  2. Set the Build Command to `npm install` and Start Command to `npm start` (which executes `node src/index.js`).
  3. Bound the HTTP listener explicitly to `0.0.0.0` with `httpServer.listen(PORT, '0.0.0.0', ...)`.

### 2. MongoDB Atlas URI & IP Access Configuration
- **The Issue**:
  Connecting to MongoDB Atlas from cloud instances (like Render) often fails with `MongooseServerSelectionError` because cloud providers allocate dynamic egress IP addresses that change between deployments. If Atlas Network Access is set only to a developer's home IP, cloud connection attempts are rejected.
- **The Fix**:
  1. **Atlas Network Access**: Configured MongoDB Atlas Network Access IP Whitelist to include `0.0.0.0/0` (Allow Access from Anywhere).
  2. **Connection Parameters & Timeouts**: In `server/src/config/db.js`, added explicit timeouts (`serverSelectionTimeoutMS: 15000`, `connectTimeoutMS: 10000`) to gracefully handle DNS SRV lookups on Render cold starts.
  3. **Event Listeners**: Added continuous connection monitoring (`connected`, `disconnected`, `error`) and exposed database status in `/api/health` so Render health checks accurately reflect database readiness.

### 3. Vercel VITE_API_URL Config & Client-Side SPA Rewrites
- **The Issue**:
  1. Vite compiles client environment variables during build time. Without `VITE_API_URL` set in Vercel's build environment, Axios calls defaulted to `http://localhost:5000`.
  2. Direct navigation or browser refreshing on nested routes (`/join`, `/reception`, `/status/:id`, `/display`, `/admin`) returned Vercel 404s because the server looked for static files corresponding to those paths.
- **The Fix**:
  1. **Vercel Environment Variable**: Configured `VITE_API_URL=https://salon-queue-api-tjbn.onrender.com` in Vercel Project Settings > Environment Variables.
  2. **SPA Rewrites**: Added `client/vercel.json`:
     ```json
     {
       "rewrites": [
         { "source": "/(.*)", "destination": "/" }
       ]
     }
     ```
  3. **CORS Origin Validation**: In `server/src/index.js`, implemented dynamic regex matching in CORS configuration:
     ```javascript
     const isVercelPreview = normalized.endsWith('.vercel.app');
     ```
     This automatically permits all current and future Vercel deployments and preview URLs to access the Render API without CORS rejections.
