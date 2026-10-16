# Nivasa — Smart Apartment & Society Management System

A modern, production-grade, full-stack society and apartment management platform built with React, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL (via Prisma ORM).

Designed with a premium interface, robust role-based access control (RBAC), and high operational fidelity across three user roles: **Society Administrator**, **Resident**, and **Gate Security**.

---

## 🌟 Key Features

### 🏢 Society Administrator Portal
- **Operations Dashboard**: Real-time KPI statistics (Occupancy rate, Active residents, Campus visitor count, Open complaints, Annual maintenance collection rate).
- **Resident Directory**: Full roster with search, filter (Owner vs Tenant), addition modal, move-in dates, and linked unit records.
- **Apartments & Inventory**: Unit directory (Tower/Building, Unit No, Floor, Unit Type, Area sq ft, Monthly maintenance charge, Occupancy status).
- **Visitor Logs & Approvals**: Real-time pass approval, passcode validation, and arrival logs.
- **Maintenance & Billing Engine**: Generate bulk monthly bills across all occupied units, record offline/manual payments, and view generated payment receipts.
- **Helpdesk & Ticket Management**: Assign support tickets to technicians, update status (Submitted, Assigned, In Progress, Resolved, Closed), and record resolution notes.
- **Amenity Management**: Create and configure clubhouse amenities (timings, slot duration, capacity, rules, and approval requirements).
- **Booking Approvals**: Review resident slot reservations, detect scheduling conflicts, confirm or reject bookings.
- **Notice Board / Broadcasts**: Publish urgent notices, category filters, and pin critical circulars.
- **Reports & Analytics**: Financial recovery rates, visitor demographics by type, complaint categorization, and annual billing summaries.
- **Audit Logs**: Chronological security audit trail with expandable JSON payload inspection.

### 🏡 Resident Portal
- **Personalized Resident Dashboard**: Quick view of apartment details, pending visitor gate approvals, unpaid dues, open tickets, and latest circulars.
- **Pre-invite Visitors**: Generate digital gate pass codes (e.g. `NV-XXXXXX`) with one-click clipboard copying to share with guests or delivery drivers.
- **1-Click Gate Approvals**: Approve or deny entry to arriving visitors directly from the portal.
- **Maintenance Payments**: Review monthly service invoices and complete instant simulated payments (Demo Card, UPI, Net Banking) with automated receipt generation.
- **Helpdesk Ticket Filing**: Raise maintenance requests with categories, urgency priority, and detailed descriptions; monitor technician progress.
- **Amenity Booking**: Check facility operating hours and book reserved time slots.
- **Family & Vehicle Registry**: Register family members (with emergency SOS contact flags) and vehicles (license plate, parking slot).
- **Notification Feed**: Live stream of payment receipts, complaint status changes, and visitor arrival alerts with unread counter.

### 🛡️ Security Guard Portal
- **Passcode Clearance Terminal**: Fast verification box that validates visitor pass codes and performs instant check-in.
- **Live Campus Roster**: Real-time list of all visitors currently on premises, including time spent inside and quick 1-click Check Out button.
- **Walk-in Entry Logging**: Directly register unannounced deliveries, cabs, or service workers to destination units at the gate.
- **Chronological Gate Ledger**: Physical check-in and check-out ledger with timestamps, visitor info, license plates, and security remarks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v7, React Hook Form, Zod, Axios, React Hot Toast |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| **Security & Auth** | JWT (Access + Refresh tokens), HttpOnly Cookies, Bcrypt password hashing, Helmet, Rate Limiting, CORS |
| **Documentation & Tests** | Swagger / OpenAPI (`/api/docs`), Vitest test suite |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database (or local connection string)

### 1. Clone & Install Dependencies
From the repository root:
```bash
# Install root, frontend, and backend packages
npm install
```

### 2. Configure Environment Variables
Copy and update backend `.env`:
```bash
# In backend/.env:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nivasa_db?schema=public"
JWT_SECRET="nivasa-jwt-secret-minimum-32-characters"
JWT_REFRESH_SECRET="nivasa-refresh-secret-minimum-32-characters"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Migration & Seed Data
Initialize your schema and populate realistic demo records:
```bash
# From workspace root
npm run db:migrate
npm run db:seed
```

### 4. Run the Full Application
Start both the backend and frontend simultaneously with a single command:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000/api/v1`
- **Swagger Documentation**: `http://localhost:4000/api/docs`

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@nivasa.com` | `Admin@123` |
| **Resident** | `resident@nivasa.com` | `Resident@123` |
| **Security Staff** | `security@nivasa.com` | `Security@123` |

*Note: The login page provides one-click autofill buttons for each demo role.*

---

## 🧪 Testing & Production Build

### Run Unit Tests
```bash
npm run test
```

### Production Build
Build optimized bundles for both backend and frontend:
```bash
npm run build
```

---

## 📂 Project Architecture

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Complete schema (Users, Apartments, Visitors, Bills, Bookings, etc.)
│   │   └── seed.ts             # Comprehensive database seeder with realistic test data
│   ├── src/
│   │   ├── config/             # Environment, Prisma client, and constants
│   │   ├── middleware/         # JWT Auth, RBAC authorization, and error handling
│   │   ├── modules/            # Domain-driven backend modules:
│   │   │   ├── auth/           # Login, refresh tokens, logout, change password
│   │   │   ├── users/          # User profiles and staff management
│   │   │   ├── apartments/     # Society apartment units and occupancy
│   │   │   ├── residents/      # Resident profiles and rosters
│   │   │   ├── family/         # Household family members
│   │   │   ├── vehicles/       # Vehicle registration and parking slots
│   │   │   ├── visitors/       # Visitor passes, pre-invites, approvals
│   │   │   ├── gate/           # Security check-in, check-out, verify pass
│   │   │   ├── maintenance/    # Recurring billing and invoice generation
│   │   │   ├── payments/       # Simulated gateways, receipts, transactions
│   │   │   ├── complaints/     # Support tickets and technician resolutions
│   │   │   ├── amenities/      # Clubhouse amenities and scheduling
│   │   │   ├── bookings/       # Slot reservations with conflict detection
│   │   │   ├── announcements/  # Notice board and broadcasts
│   │   │   ├── notifications/  # User notifications with unread tracking
│   │   │   └── reports/        # Analytics, financial recovery, audit logs
│   │   ├── utils/              # Audit logging, pagination, notifications helpers
│   │   ├── app.ts              # Express application and middleware pipeline
│   │   └── server.ts           # Server bootstrap and graceful shutdown
│   └── tests/                  # Backend unit and integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AdminLayout, ResidentLayout, SecurityLayout
│   │   │   └── ui/             # Badges, StatCards, Loading, Modals, Pagination
│   │   ├── contexts/           # AuthContext (JWT session persistence)
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage with role selector
│   │   │   ├── admin/          # 11 Administrator management screens
│   │   │   ├── resident/       # 11 Resident self-service screens
│   │   │   └── security/       # 4 Gate security operations screens
│   │   ├── services/           # Axios API instance with token auto-refresh
│   │   ├── types/              # Complete TypeScript domain interfaces
│   │   ├── App.tsx             # Protected routes and role-based redirect routing
│   │   └── index.css           # Custom styling system and Tailwind tokens
│   └── vite.config.ts          # Vite build configuration with API reverse proxy
│
└── docs/                       # Architecture diagrams and technical documentation
```
