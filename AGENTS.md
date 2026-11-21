# AGENTS.md — Salon Queue Management System Architectural Blueprint

This document governs the engineering architecture, design standards, and operational guidelines for AI agents and engineers working across the 10-prompt lifecycle of the **Salon Queue Management System**.

---

## 1. System Vision & Architecture

The **Salon Queue Management System** is a modern, real-time, bilingual (English + Gujarati) queue coordination platform for high-end barbershops and salons. It replaces chaotic paper sign-in sheets and noisy crowded lobbies with transparent digital queues, live wait time estimation, multi-station barber dashboards, TV display boards, and customer status tracking.

### Tech Stack
- **Database**: MongoDB (Mongoose ODM)
- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: React 18+ (Vite), TailwindCSS, Framer Motion, Lucide React
- **Client Networking**: Axios (REST), Socket.IO Client (WebSockets)
- **State & i18n**: Custom Context-driven architecture with English (`en`) and Gujarati (`gu`) language switching persisted in `localStorage`.

---

## 2. 10-Prompt Roadmap Overview

1. **Prompt 1: Scaffolding, Spec Docs, Design Tokens & Bilingual Foundations** *(Current Step)*
   - Project directory structure, specification docs (`docs/`), root scripts, environment variables.
   - Bespoke design tokens (luxury obsidian, warm gold/amber, glassmorphism), Apple OS-inspired spring motion presets.
   - Full bilingual scaffolding (`en.js`, `gu.js`, `LanguageContext.jsx`).
   - Minimal server & client health check setups.

2. **Prompt 2: Data Models, Schemas & Seed Data**
   - Mongoose schemas: `QueueTicket`, `Barber`, `Service`, `SalonConfig`.
   - Seed scripts with realistic barbers, services, and initial queue tickets.

3. **Prompt 3: Core Queue Engine & Calculation Services**
   - Dynamic wait time algorithms (service durations, barber assignment, real-time queue position offset).
   - Ticket transition state machine: `WAITING` ➔ `CALLED` ➔ `IN_SERVICE` ➔ `COMPLETED` / `CANCELLED` / `NO_SHOW`.

4. **Prompt 4: Express REST API Endpoints & Validation**
   - Queue endpoints (join, status, list, cancel, reorder).
   - Staff/Barber actions (next client, start service, finish service, pause).
   - Admin settings & analytics endpoints.

5. **Prompt 5: Real-Time Socket.IO Synchronization Layer**
   - Centralized socket room management (`room:lobby`, `room:barber:<id>`, `room:ticket:<id>`).
   - Event contracts: `queue:updated`, `ticket:called`, `ticket:progress`, `barber:status_changed`.

6. **Prompt 6: Customer Experience (Join Queue & Live Status Tracker)**
   - Customer join form with barber preference, service picker, phone number, and instant digital ticket generator.
   - Live ticket tracker (`/status/:id`) with real-time countdown, animated queue position, and sound/vibration alerts.

7. **Prompt 7: Receptionist / Concierge Command Station**
   - Walk-in fast entry modal, queue re-ordering, VIP/priority tagging, manual reassignment, and SMS notification trigger.

8. **Prompt 8: Barber Station Dashboard & Personal Queue**
   - Barber view (`/barber/:name`): Next client button, current client timer, finish & notes, break toggle.

9. **Prompt 9: Ambient Display TV Screen (`/display`)**
   - High-contrast 4K/1080p ambient display board for in-salon TVs: active chairs, up-next carousel, audio chime announcements.

10. **Prompt 10: Admin Intelligence, Analytics & Polish**
    - Daily throughput, peak hours heatmap, average wait vs service time, staff efficiency metrics, Gujarati localization review.

---

## 3. Strict Development Rules for Agents

- **Step Isolation**: Always complete only the requested prompt step. Never preemptively create database schemas or complex features slated for future prompts.
- **Bilingual First**: Every user-facing string must be referenced via `t('key')` through `LanguageContext`. Never hardcode raw English text without a matching Gujarati translation in `client/src/i18n/gu.js`.
- **Design Standard**:
  - Palette: Dark luxury obsidian (`#0B0F17`, `#111827`, `#1F2937`), warm amber/gold accents (`#D4AF37`, `#F59E0B`), soft emerald for active statuses (`#10B981`).
  - Typography: `Plus Jakarta Sans` for clean modern body/headings, `Instrument Serif` for editorial luxury flourishes, and `Noto Sans Gujarati` for rendering Gujarati script natively.
  - Motion: Apple OS-inspired spring transitions via Framer Motion (`stiffness: 300-400`, `damping: 25-30`). No jarring linear transitions.
- **Reliable Fallbacks**: The client and server must handle disconnects gracefully. If MongoDB or Socket.IO disconnects, UI displays friendly fallback badges rather than throwing white-screen exceptions.
- **Clean Git & Commit Hygiene**: Never commit build artifacts (`dist/`, `build/`) or environment secrets (`.env`).

---

## 4. Port & Environment Allocations

| Component | Default Port | Environment Variable | Config File |
|-----------|--------------|----------------------|-------------|
| Client (Vite) | 5173 | `VITE_API_URL` | `client/.env` |
| Server (Express) | 5000 | `PORT`, `MONGO_URI`, `CLIENT_URL` | `server/.env` |
| Database | 27017 | `MONGO_URI` | `server/.env` |

---

## 5. Directory Mapping

```text
salon-queue/
├── docs/                 # Specification & design documents
├── server/
│   └── src/
│       ├── config/       # Database & external connections
│       ├── models/       # Mongoose schemas (Prompt 2)
│       ├── routes/       # Express route controllers (Prompt 4)
│       ├── services/     # Pure queue & math services (Prompt 3)
│       └── sockets/      # Socket.IO handlers (Prompt 5)
└── client/
    └── src/
        ├── components/   # Atomic UI primitives and AppShell
        ├── context/      # LanguageContext, SocketContext
        ├── i18n/         # en.js and gu.js dictionaries
        ├── lib/          # API, socket, and motion primitives
        └── pages/        # All 7 destination routes
```
