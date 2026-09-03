# MONTARA — Montessori School Operating System & ERP

> A calm, connected workspace and learning management system designed specifically for Montessori school communities.

---

## Overview

**Montara** is an enterprise-grade, multi-tenant Montessori ERP and School Operating System. It unifies classroom management, child-centered Montessori developmental tracking, financial ledgers, human resources, inventory, parent communication, gamification, AI-driven developmental insights, and resilient offline attendance workflows.

---

## Tech Stack

### Backend
- **Framework:** [NestJS 11](https://nestjs.com/) (TypeScript)
- **Database & ORM:** PostgreSQL with [TypeORM](https://typeorm.io/)
- **Security & Auth:** JWT, Passport.js, bcrypt, Helmet, Throttler rate limiting
- **Validation:** `class-validator` and `class-transformer`
- **AI Integration:** Google Generative AI (`@google/generative-ai`) with deterministic Montessori Heuristic fallback

### Frontend
- **Framework:** [Next.js 13](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS & Radix UI primitives
- **Icons:** Lucide React
- **Client Architecture:** Native fetch API client with centralized token handling & role-based route protection

---

## Core Features

1. **Montessori Academic Core:**
   - Multi-tenant classroom and student management.
   - 5 Montessori curriculum areas (Practical Life, Sensorial, Language, Mathematics, Cultural).
   - Activity tracking, step-by-step presentations, and weekly lesson planning.

2. **Observations & Progress Assessments:**
   - Daily observation logs with developmental stage tracking (*Beginning*, *Developing*, *Proficient*, *Advanced*).
   - Comprehensive multi-area progress rubrics and score evaluations.

3. **Fees & School Finance:**
   - Flexible fee structures (Tuition, Materials, Registration, Extended Care).
   - Student fee assignment, balance calculation, waiver handling, and transaction receipts.

4. **HR & Employee Management:**
   - Staff directory, departmental categorization, and leave request approval pipelines.

5. **Campus Inventory:**
   - Supply & Montessori apparatus tracking, stock adjustments, and reorder alerts.

6. **Communication Hub:**
   - School-wide and targeted announcements with priority tags (*Urgent*, *Important*, *Normal*).
   - Interactive top navbar notification popover with unread counters and mark-as-read state.

7. **Gamification MVP:**
   - Student achievement points ledger, badge awards, and Montessori milestone summaries.

8. **AI Developmental Insights:**
   - Multidimensional progress analysis generating strengths, growth areas, and personalized home activity recommendations.
   - Dual-engine design: Google Gemini API integration with an automatic Montessori heuristic fallback engine when API keys are absent.

9. **Offline Attendance MVP:**
   - IndexedDB client queue allowing teachers to record daily attendance without an active internet connection.
   - Automatic background replay and conflict-safe synchronization upon reconnection.

---

## Project Structure

```text
montara/
├── backend/                      # NestJS API & Database Monolith
│   ├── src/
│   │   ├── admin/                # Workspace & Tenant Settings
│   │   ├── ai/                   # AI Developmental Insights & Heuristic Engine
│   │   ├── assessments/          # Learning Assessments & Evaluations
│   │   ├── attendance/           # Daily & Offline Attendance Records
│   │   ├── auth/                 # JWT Authentication & RBAC Guards
│   │   ├── classrooms/           # Montessori Classrooms
│   │   ├── communication/        # School Announcements & Broadcasts
│   │   ├── curriculum/           # Montessori Curriculum Areas & Activities
│   │   ├── database/             # TypeORM Data Source, Migrations & Seeds
│   │   ├── finance/              # Fee Structures, Student Fees & Payments
│   │   ├── gamification/         # Points & Badge Achievements
│   │   ├── hr/                   # Staff Directory & Leave Management
│   │   ├── inventory/            # Apparatus & Supplies Management
│   │   ├── lessons/              # Lesson Planning & Scheduling
│   │   ├── observations/         # Daily Child Observations
│   │   ├── students/             # Montessori Student Directory
│   │   ├── tenants/              # Multi-tenancy Management
│   │   └── users/                # User Entities & RBAC
│   └── .env.example
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # Route Pages (Dashboard, Students, Finance, etc.)
│   ├── components/               # UI Primitives, Forms, Charts & Layout Shell
│   ├── lib/                      # API Client, Auth Context, Permissions & Navigation
│   └── .env.example
├── package.json                  # Root Orchestrator (concurrent development)
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18+ or v20+
- **PostgreSQL:** Running locally or via Docker on port `5432`

---

### 1. Installation

Install all root, backend, and frontend dependencies:

```bash
# Install root orchestrator dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### 2. Environment Configuration

#### Backend Environment:
Create `backend/.env` (or copy from `backend/.env.example`):

```bash
# In backend/.env
NODE_ENV=development
PORT=5000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=montara_erp

JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRATION=1d

# Optional: Gemini API Key (If omitted, heuristic fallback engine is used automatically)
GEMINI_API_KEY=
```

#### Frontend Environment:
Create `frontend/.env.local` (or copy from `frontend/.env.example`):

```bash
# In frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### 3. Database Migrations & Seeding

1. **Create the PostgreSQL Database:**
   ```sql
   CREATE DATABASE montara_erp;
   ```

2. **Run TypeORM Migrations:**
   ```bash
   npm --prefix backend run migration:run
   ```

3. **Seed Clean Realistic Demo Data:**
   ```bash
   npm run seed
   ```
   *(Or run `npm --prefix backend run seed`)*

---

### 4. Running the Development Server

Start both the NestJS backend (`http://localhost:5000`) and the Next.js frontend (`http://localhost:3000`) simultaneously using a single command:

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## Demo Accounts & Credentials

All seeded demo accounts share the standard password:

> **Default Password:** `Password123!`

| Role | Email | Capabilities & Scope |
|---|---|---|
| **School Admin** | `fatima@admin.com` | Full school administration, tenant settings, all modules |
| **Super Admin** | `admin@superadmin.com` | System-wide administrator, tenant onboarding & settings |
| **Teacher** | `hassan@teacher.com` | Attendance, observations, assessments, lessons, gamification |
| **Parent** | `ali@parent.com` | Read-only view for enrolled children, progress, fees & attendance |
| **Accountant** | `rafay@accountant.com` | Fee structures, student billing, payment ledger, students directory |
| **HR Manager** | `sana@hr.com` | Employee records, leave requests & staff approvals |
| **Inventory Manager** | `usman@inventory.com` | School apparatus catalog, stock transactions & material levels |

---

## Verification & Build Commands

```bash
# Backend compilation
npm --prefix backend run build

# Frontend type checking
npm --prefix frontend run typecheck

# Frontend production build
npm --prefix frontend run build
```

---

## License

This project is proprietary software developed for Montara School Operating System. All rights reserved.
