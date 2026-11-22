# Salon Queue Management System
**Live demo:** https://salon-queue-management-system.vercel.app/
**Hosted on:** Vercel (frontend) + Render (backend) + MongoDB Atlas
**Staff Demo PIN (Reception / Barber / Admin):** `1234`

---

## 📖 Overview & Key Features

The **Salon Queue Management System (Studio Kashi Salon · સ્ટુડિયો કાશી સલૂન)** is a modern, real-time, bilingual (English + Gujarati) queue orchestration platform engineered for high-end barbershops and luxury grooming salons. It replaces chaotic paper sign-up sheets, arbitrary turn guessing, and noisy lobby crowding with transparent digital queues, real-time ticket telemetry, multi-station barber dashboards, wall-mounted ambient TV broadcast displays, and responsive concierge command stations.

### 🌟 Key Highlights
- **100% Native Bilingual UX (EN / ગુજરાતી)**: Seamless one-click language toggle persisted across sessions via `localStorage`. Every string, status badge, service description, notification, and dialog is localized in authentic Gujarati and English.
- **Sub-30ms Real-Time Synchronization**: Full-duplex WebSocket communication powered by **Socket.IO** ensures instantaneous state updates across customer phones, reception desks, barber tablet mounts, and ambient TV screens.
- **Dynamic Turn Telemetry & Countdown**: Intelligent wait time engine factoring in selected service durations, barber preference routing, active chair cut times, and station throughput.
- **Bespoke Luxury Obsidian Design Tokens**: Crafted with dark obsidian glassmorphism (`#0B0F17`, `#111827`, `#1F2937`), warm champagne/gold highlights (`#D4AF37`, `#F59E0B`), emerald status accents (`#10B981`), and Apple OS-inspired spring physics (`stiffness: 300-400`, `damping: 25-30`).
- **Sound & Haptic Turn Notifications**: Dual-channel Web Audio three-tone harmonic chime ($E_5 \rightarrow G^\sharp_5 \rightarrow B_5$) and mobile vibration alert pattern `[250, 120, 250]` triggered the instant a customer's token is called.
- **Active Spot Recovery Guard**: 10-digit Indian mobile validation prevents duplicate queue spamming. If an already queued patron resubmits, the system safely recovers and redirects them to their active live ticket.
- **Master Operational Controls**: Automatic salon hours gate (IST timezone), queue open/close switches, barber on-duty switchboards, and live service catalog management with instant price updates.

---

## 🗺️ All 7 Routes & Access Roles

| Route | Viewport / Screen | Target Persona | Access Level | Description |
|---|---|---|---|---|
| `/` | **Home Portal** | Walk-in Patrons, Visitors | Public (Zero-Auth) | Hero brand introduction, live queue pulse (`"X in queue • ~Y mins wait"`), active barber roster chips, and quick-action navigation cards. |
| `/join` | **Customer Join Queue** | Patrons (Mobile / Tablet Kiosk) | Public (Zero-Auth) | 3-step wizard: Name & 10-digit phone number, multi-service selector (up to 3 services with live duration & price tally), and barber preference ("Any Available" or specific stylist). |
| `/status/:id` | **Live Status Tracker** | Waiting Customers | Public / URL Token | Real-time SVG countdown ring, active queue position ("X people ahead"), barber assignment pill, sound/vibration turn chime, and self-service cancellation dialog. |
| `/reception` | **Reception Concierge Station** | Front Desk Host / Concierge | Staff PIN Protected (`1234`) | High-throughput command station: Walk-in fast entry modal, master queue table with wait alerts (>60m warning), Call Next, No-show, Cancel, and VIP priority overrides. |
| `/barber/:name` | **Barber Station Console** | Barbers & Stylists | Staff PIN Protected (`1234`) | Minimalist tablet/phone mount interface for each chair: Live elapsed haircut timer/stopwatch, one-tap `[Start]` and `[Done]` controls, break status toggle, and upcoming personal queue preview. |
| `/display` | **Ambient Waiting Area TV** | Waiting Lounge Patrons | Public / TV Display | 1080p/4K distraction-free widescreen layout: Left pane displays "Now Serving" station cards; Right pane displays "Up Next" queue list. Kinetic gold banner and audio chime trigger on call. |
| `/admin` | **Owner Settings & Analytics** | Salon Owner / General Manager | Staff PIN Protected (`1234`) | Business intelligence KPIs (Clients Served, Avg Wait Time, No-Shows), master queue open/close toggle, operating hours editor, barber duty switchboard, and service catalog CRUD. |

---

## ⚙️ Core Queue Engine Rules

The system implements a single-source-of-truth queue engine (`server/src/services/queueEngine.js`) enforcing strict business logic:

1. **Forward-Only State Machine**:
   - `waiting` $\rightarrow$ `called` $\rightarrow$ `in_chair` $\rightarrow$ `done`
   - `waiting` $\rightarrow$ `cancelled` (customer self-drop or receptionist action)
   - `called` $\rightarrow$ `no_show` (unresponsive patron after call threshold)
   - Backwards or illegal state jumps (e.g., `done` $\rightarrow$ `waiting`) are strictly rejected with HTTP `400 Bad Request`.
2. **Atomic Token Generation & Daily IST Reset**:
   - Tickets follow sequence `S-1`, `S-2`, `S-3`, etc.
   - Sequence generation utilizes MongoDB's atomic `$inc` operation via `DailyCounter` keyed on `Asia/Kolkata` date (`YYYY-MM-DD`), cleanly resetting every midnight.
3. **Barber Preference Matching & Work-Stealing Pool**:
   - If a customer requests a specific barber (e.g., `Ravi`), their ticket is reserved exclusively for that barber.
   - If a customer selects `"Any Available"`, any available barber can pull the ticket. When calling next, barbers prioritize their designated preferred tickets first, then seamlessly draw from the general `"any"` pool in FIFO order.
4. **Dynamic Wait Time Estimation Algorithm**:
   - For a specific barber: Sum of remaining service durations of active and waiting tickets assigned to that barber + a 3-minute turnover buffer per ticket.
   - For general queue ("Any Barber"):
     $$\text{Estimated Wait} = \frac{\sum \text{Pending Service Durations}}{\text{Number of Active On-Duty Barbers}} + \text{Buffer}$$
   - Active tickets subtract elapsed service time from their estimated completion calculation.
5. **Duplicate Spot Recovery**:
   - If a customer with an active ticket (`waiting`, `called`, or `in_chair`) submits the join form with the same phone number, the system recovers their existing ticket instead of polluting the queue.
6. **Operating Hours & Online Queue Cutoff**:
   - Online registration via `/join` is automatically locked outside configured operating hours (e.g., before 09:00 or after 21:00 IST) or when the master toggle is closed.
   - Front-desk staff on `/reception` can bypass online cutoff for physical walk-ins.

---

## 📂 Folder Architecture

```text
salon_queue_management_system/
├── AGENTS.md                  # Architectural blueprint and agent guidelines
├── prompts.md                 # 10-prompt lifecycle log and deployment runbooks
├── README.md                  # Production documentation and quickstart guide
├── render.yaml                # Infrastructure-as-code blueprint for Render
├── package.json               # Root scripts (concurrently dev, QA audit test)
├── docs/                      # Architectural specifications
│   ├── 01-brief.md            # Product brief & target personas
│   ├── 02-screens.md          # 7 viewports & screen specifications
│   └── 03-flows-rules.md      # State machines, wait algorithms & event contracts
├── server/                    # Node.js + Express + Socket.IO Backend
│   ├── package.json
│   ├── .env                   # Server environment variables
│   └── src/
│       ├── index.js           # Server entry point, CORS & Socket.IO initialization
│       ├── config/
│       │   └── db.js          # MongoDB connection with in-memory fallback
│       ├── middleware/
│       │   └── requireStaffPin.js # 4-digit Staff PIN security middleware
│       ├── models/            # Mongoose schemas
│       │   ├── Barber.js
│       │   ├── DailyCounter.js
│       │   ├── QueueTicket.js
│       │   ├── SalonConfig.js
│       │   └── Service.js
│       ├── routes/            # REST API route controllers
│       │   ├── adminRoutes.js
│       │   ├── authRoutes.js
│       │   ├── barberRoutes.js
│       │   ├── bootstrapRoutes.js
│       │   ├── index.js
│       │   ├── queueRoutes.js
│       │   └── receptionRoutes.js
│       ├── seed/
│       │   └── seedData.js    # Initial seed data for Indian salon context
│       ├── services/
│       │   └── queueEngine.js # Pure queue state machine & wait time calculations
│       ├── sockets/
│       │   └── index.js       # Real-time rooms and event dispatchers
│       ├── tests/             # Automated test suites
│       │   ├── verifyAdminEndpoints.js
│       │   ├── verifyE2EQAAudit.js
│       │   └── verifyQueueEngine.js
│       └── utils/
│           ├── errors.js      # AppError custom error hierarchy
│           └── salonTime.js   # Asia/Kolkata timezone utilities
└── client/                    # React 18 + Vite + TailwindCSS Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js     # Bespoke luxury obsidian & gold design tokens
    ├── vercel.json            # Vercel SPA rewrite rules
    ├── index.html             # Google Fonts typography imports
    └── src/
        ├── App.jsx            # 7-route navigation switch
        ├── main.jsx           # App bootstrapping
        ├── index.css          # Glassmorphism utilities & animations
        ├── components/
        │   ├── common/        # Buttons, modals, input fields, badges
        │   └── layout/        # AppShell, Navbar, LanguageSwitcher, StaffPinGate
        ├── context/
        │   ├── LanguageContext.jsx # EN/GU translation provider
        │   └── QueueContext.jsx    # Socket.IO & REST state provider
        ├── i18n/
        │   ├── en.js          # English dictionary
        │   └── gu.js          # Authentic Gujarati dictionary
        ├── lib/
        │   ├── api.js         # Axios REST client with interceptors
        │   ├── audio.js       # Web Audio API harmonic chime synthesizer
        │   ├── motion.js      # Apple OS-inspired Framer Motion spring presets
        │   └── socket.js      # Socket.IO client manager
        └── pages/
            ├── AdminPage.jsx
            ├── BarberPage.jsx
            ├── DisplayTvPage.jsx
            ├── HomePage.jsx
            ├── JoinQueuePage.jsx
            ├── MyStatusPage.jsx
            └── ReceptionPage.jsx
```

---

## 🚀 Local Setup & Testing

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- *(Optional)* Local MongoDB running on port `27017` (if not running, the server automatically starts an embedded zero-config `mongodb-memory-server`).

### 2. Installation
Clone the repository and install all dependencies across root, server, and client:
```bash
# Clone repository
git clone https://github.com/WebArpit07/salon_queue_management_system.git
cd salon_queue_management_system

# Install all dependencies with single command
npm run install:all
```

### 3. Environment Configuration
Create or review `.env` files in `server/` and `client/`:

**`server/.env`**:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/salon_queue
CLIENT_URL=http://localhost:5173
STAFF_PIN=1234
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Running Locally
Run both backend and frontend concurrently with live reload:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 5. Running Automated Verification Suites
The project includes three automated test suites covering pure math, state transitions, admin CRUD, and end-to-end audit rules:

```bash
# 1. Comprehensive 11-step E2E QA audit (docs/03-flows-rules.md)
npm run test:qa

# 2. Pure queue engine & Socket.IO synchronization suite
npm --prefix server run test:engine

# 3. Staff PIN security & Admin management API suite
npm --prefix server run test:admin
```
All suites run with automatic in-memory MongoDB initialization for frictionless testing without external database dependencies.

---

## 🔒 Staff Demo Credentials

For testing staff and administrative workflows on the live demo:
- **Staff / Admin PIN**: `1234`
- **Applicable Routes**:
  - Receptionist Console: `/reception`
  - Barber Stations: `/barber/ravi`, `/barber/amit`, `/barber/imran`
  - Owner Admin Dashboard: `/admin`
