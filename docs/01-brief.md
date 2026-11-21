# 01-brief.md — Project Vision & System Brief

## 1. Problem Statement
Upscale barbershops and salons suffer from chaotic physical lobby queues, customer uncertainty regarding wait times, and miscommunication between receptionists, barbers, and patrons. Customers either leave without booking or crowd the entrance, while barbers lose track of station throughput. Furthermore, in multilingual urban environments (particularly communities with significant Gujarati-speaking populations), digital systems lacking native localized language support cause friction and alienate clients.

## 2. Product Solution
The **Salon Queue Management System (Q-Salon)** is a real-time, responsive MERN-stack queue coordination platform designed with a high-end luxury aesthetic (Apple-inspired tactile micro-interactions, dark obsidian glassmorphism, and warm champagne/amber accents).

It provides:
1. **Frictionless Customer Check-in**: Direct self-service queue entry via mobile browser or QR code scan with barber preference and service selection.
2. **Personal Real-Time Ticket Tracker**: Live countdown, animated queue position, and proactive alert states ("You're Next", "Head to Station").
3. **Barber Station Console**: Dedicated tablet/desktop interface for each stylist to control their own chair queue, start/pause/complete cuts, and signal reception.
4. **Reception / Concierge Command Center**: Master queue management for walk-ins, VIP overrides, manual seat assignment, and customer cancellations.
5. **Ambient TV Waiting Room Display**: High-impact ambient monitor display with live chair status, upcoming tickets, and gentle sound alerts.
6. **Native Bilingual Experience**: 100% synchronized English and Gujarati (ગુજરાતી) UI with single-click persistent language toggling.

## 3. Target User Personas

| Persona | Primary Needs | Key Device / Screen |
|---------|---------------|---------------------|
| **Patron / Client** | Check wait time, join queue remotely or at entrance, track live turn without being tethered to lobby | Mobile browser (`/join`, `/status/:id`) |
| **Barber / Stylist** | View own queue, trigger "Next Client", see selected services, mark cuts complete | Tablet / Mobile (`/barber/:name`) |
| **Receptionist / Host** | Fast walk-in entry, manage disputes, reassign barbers, tag VIPs | Desktop / Laptop (`/reception`) |
| **Waiting Room Audience** | Glanceable overview of who is in chair and who is up next | Wall-mounted TV / 1080p display (`/display`) |
| **Salon Owner / Admin** | Configure services, staff members, pricing, monitor daily volume | Desktop (`/admin`) |

## 4. Architectural Highlights
- **Real-Time Synchronization**: Socket.IO connects clients, receptionists, barbers, and the TV display with sub-second state sync.
- **Resilient Offline / Reconnect Tolerance**: Auto-reconnect handling for unstable mobile connections.
- **Doc-First & Component-Driven Architecture**: Fully modular design tokens and decoupled service logic ensuring clean maintainability across all 10 project phases.
