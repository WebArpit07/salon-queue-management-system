# 02-screens.md — Comprehensive Screen & Route Specifications

The application consists of seven distinct viewports, each tailored for a specific role and viewport context.

---

## 1. Home / Landing Page (`/`)
- **Target Audience**: Walk-in patrons, new visitors, salon staff.
- **Purpose**: Welcoming brand portal introducing the salon, current live lobby wait time, active barbers on duty, and rapid CTA buttons.
- **Key Elements**:
  - Hero header with kinetic text reveal (`SplitHeading`).
  - Live Salon Pulse pill: "Currently 4 in queue • Avg wait ~15 mins".
  - Quick action cards: "Join the Queue" (Customer), "Track Existing Ticket", "Staff Portal".
  - Language toggle (English / ગુજરાતી) in top utility bar.

---

## 2. Customer Join Queue Page (`/join`)
- **Target Audience**: Customers checking in on their smartphones or an in-store tablet kiosk.
- **Purpose**: Fast 3-step queue entry form.
- **Key Elements**:
  - Step 1: Customer Name & Phone Number (with optional WhatsApp / SMS opt-in).
  - Step 2: Service Selection (Haircut, Beard Trim, Luxury Shave, Hair Spa) with durations and prices.
  - Step 3: Barber Preference ("Any Available" or specific stylist).
  - Summary review & tactile submit button with instant ticket generation redirecting to `/status/:id`.

---

## 3. Customer Live Status Page (`/status/:id`)
- **Target Audience**: The customer waiting at a nearby café, walking around, or sitting in the lounge.
- **Purpose**: Real-time personal ticket telemetry.
- **Key Elements**:
  - Prominent ticket identifier (e.g., `#A-104`).
  - Animated circular progress showing tickets ahead (e.g., "2 people ahead of you").
  - Dynamic estimated call time with real-time countdown.
  - Audio/vibration alert when status transitions to `CALLED` ("Please proceed to Chair 3").
  - Self-service action buttons: "Cancel Ticket" (with confirmation), "Running Late (+10m)".

---

## 4. Receptionist Concierge Console (`/reception`)
- **Target Audience**: Front desk host / receptionist.
- **Purpose**: Master control station for the entire salon floor.
- **Key Elements**:
  - Split-screen layout: Quick walk-in addition form on left, interactive master queue list on right.
  - Queue management: Drag-and-drop or one-click priority elevation (VIP), barber re-assignment, ticket removal.
  - Staff duty toggles: View which barbers are active, busy, or on break.
  - Emergency Broadcast / announcement bar trigger for TV.

---

## 5. Barber Station Dashboard (`/barber/:name`)
- **Target Audience**: Individual barbers / stylists operating from a phone or iPad mount beside their chair.
- **Purpose**: Minimalist, high-focus tool to run their chair.
- **Key Elements**:
  - Station status badge: `Available`, `In Service`, `Break`.
  - Current client in chair card: Name, requested services, elapsed time counter.
  - One-tap primary controls:
    - `Call Next Client`: Pulls the next eligible ticket from general or personal pool.
    - `Start Service`: Starts active timer.
    - `Complete Service`: Closes ticket, logs duration, prompts for next.
  - Personal queue preview: Next 3 upcoming clients assigned to this barber.

---

## 6. Ambient Display TV Screen (`/display`)
- **Target Audience**: Patrons sitting in the waiting lounge; high-contrast 16:9 / 4K / 1080p wall displays.
- **Purpose**: Ambient, readable-from-10-meters status broadcast.
- **Key Elements**:
  - Dual-panel layout:
    - **Active Chairs Grid**: Cards for each barber station showing current patron and cut in progress.
    - **Up Next Queue**: Horizontally scrolling or clean numbered list of the next 5-8 tickets.
  - Kinetic arrival flash & sound chime when a ticket number is called.
  - Current time, date, and bilingual salon welcome ticker.

---

## 7. Admin Intelligence & Settings Page (`/admin`)
- **Target Audience**: Salon owner and general managers.
- **Purpose**: Configuration and analytics.
- **Key Elements**:
  - Analytics KPIs: Total clients served today, average wait time, average service duration, peak traffic hours.
  - Barber Roster Management: Add/edit staff, set commission or station numbers.
  - Service Catalog Management: Add services, prices, estimated durations.
  - PIN / Passcode protected entry.
