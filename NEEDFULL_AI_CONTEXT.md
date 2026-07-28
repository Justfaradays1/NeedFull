# NeedFull — AI Onboarding Document

> **For Z.ai Desktop**: Everything you need to know before contributing to the NeedFull project.
>
> This document is the single source of truth for the project's current state,
> architecture, conventions, and roadmap. Read it fully before making any changes.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Idea](#2-core-idea)
3. [Current Development Status](#3-current-development-status)
4. [Project Architecture](#4-project-architecture)
5. [UI/UX Philosophy](#5-uiux-philosophy)
6. [Features Already Discussed](#6-features-already-discussed)
7. [Outstanding Tasks](#7-outstanding-tasks)
8. [Known Bugs](#8-known-bugs)
9. [Technical Debt](#9-technical-debt)
10. [Coding Standards](#10-coding-standards)
11. [AI Collaboration Rules](#11-ai-collaboration-rules)
12. [Future Vision](#12-future-vision)
13. [Project Glossary](#13-project-glossary)
14. [Executive Summary for Z.ai](#14-executive-summary-for-zai)

---

## 1. Project Overview

### What NeedFull Is

NeedFull is a **campus economy platform** for Nigerian university students. It is a
trusted two-sided marketplace where students who need help with campus tasks can
connect with other students who want to earn money. NeedFull acts as the
trusted middleman — holding funds in escrow until the task is completed.

### The One Problem It Solves

> "A student needs help with a campus task right now. Another student wants to
> earn money. Neither trusts the other enough to hand over cash. NeedFull is
> the trusted middleman."

This trust gap is the core problem. Existing solutions (WhatsApp groups,
word-of-mouth, social media) lack escrow protection, structured task management,
and dispute resolution. Students are reluctant to pay upfront (fear of being
scammed) and reluctant to work without payment (fear of not being paid). NeedFull
solves both sides of this trust equation.

### Vision

Build the largest campus economy network across Africa — starting with Nigerian
universities.

### Long-Term Mission

Create a trusted marketplace where any student on any campus can earn money,
access services, and build financial independence, all within a safe,
escrow-protected environment.

### Target Users

- **UNIVERSITY STUDENTS** (primary): Both task posters and task doers
- **CAMPUS BUSINESSES** (future): Student-run businesses offering services
- **LOCAL NEIGHBORHOODS** (future): Residents near campuses offering services

### What Makes NeedFull Different

| Differentiator | NeedFull | Competitors |
|---|---|---|
| **Escrow protection** | Funds locked until task is done | No escrow in informal platforms |
| **Campus-specific** | Built for university students | General freelancing platforms |
| **Mobile-first** | Optimised for 3G, low-end Android | Desktop-first or hybrid |
| **Free primary payment** | Manual bank transfer (free) | Card fees on every transaction |
| **Trust scoring** | Bayesian trust score engine | Basic star ratings only |
| **Real-time chat** | Socket.io-powered, integrated | Separate messaging apps |

---

## 2. Core Idea

### Posters

Users who need tasks done. They:
- Post tasks with title, description, budget, category, deadline, location
- Fund their wallet via bank transfer (free) or card (Paystack)
- Review applications from NeedRunners
- Accept a runner → escrow locks
- Confirm completion → escrow releases to runner
- Rate the runner after completion

### NeedRunners (also called "Agents" or "Runners")

Users who complete tasks and earn money. They:
- Browse open tasks in the task feed
- Apply to tasks they want (with optional message/bid)
- Get accepted by the poster
- Complete the task and mark it done
- Receive payment from escrow after poster confirms
- Build trust score and reputation with each completed task
- Can toggle availability on/off

### Businesses (Future)

Student-run businesses (photographers, tutors, designers) can register as
business accounts, post services, and accept bookings.

### Nearby Services

Tasks are location-tagged using PostGIS. Users see tasks within a configurable
radius (1–50 km, default 5 km). Sorting options: nearest, newest, budget, urgent.

### Campus Ecosystem

Currently live at **FUOYE** (Federal University Oye-Ekiti) as the pilot campus.
The platform is designed to work for any Nigerian university — no hardcoded
campus-specific logic in the codebase. Campus expansion is planned for 2026.

### Trust and Verification System

Multi-layered trust system:
1. **Email verification** — OTP-based, required for basic access
2. **Phone verification** — OTP-based, optional but boosts trust
3. **Student ID verification** — Admin-approved photo upload, optional but adds
   verified-student badge
4. **Trust score** — Bayesian engine (0–100) factoring: ratings, completion rate,
   verifications, reports, tenure
5. **Reviews** — 1–5 star rating after each completed task, with written comment

### Wallet and Payment Philosophy

Every user gets an auto-created wallet on registration. The wallet has two
separate columns: **balance** (spendable) and **escrow** (locked). Users never
mix the two. All amounts stored in **kobo** (integers), never naira floats.
The only file allowed to modify wallet balances is `wallet.service.ts` — every
operation uses `SELECT FOR UPDATE` row locking, runs within database
transactions, and logs every change to `wallet_transactions`.

Primary payment method: **Manual bank transfer** (free, no fees). The user
transfers money to the company's bank account, uploads a receipt, and an admin
confirms the deposit. Secondary: **Paystack card payment** (fees apply, not in
MVP).

### Safety Mechanisms

- Escrow lock prevents fund misuse
- Platform fee (10%) covers operations
- Dispute system for purchase tasks
- Admin can ban bad users
- Reports system for flagging problematic users
- Rate limiting on auth endpoints

---

## 3. Current Development Status

### What Is Fully Completed

| Feature | Status | Notes |
|---|---|---|
| User registration with email verification | ✅ Complete | 3-step flow: account → role → verify |
| Login with email/password | ✅ Complete | JWT access + refresh tokens |
| Token refresh with retry queue | ✅ Complete | Axios interceptor, concurrent 401 queue |
| Google OAuth | ✅ Complete | Popup flow, callback handling |
| Role system | ✅ Complete | poster/runner/admin with activeRole switching |
| Task CRUD with image upload | ✅ Complete | Title, description, budget, category, location, deadline |
| Task feed with filtering/sorting | ✅ Complete | sortBy, status, category, perPage, geo-filtering |
| Task applications | ✅ Complete | Apply, accept, reject, withdraw |
| Wallet system | ✅ Complete | Balance + escrow columns, SELECT FOR UPDATE, full audit trail |
| Escrow lock/release/refund | ✅ Complete | Lock on accept, release on confirm, refund on cancel |
| Manual bank transfer deposits | ✅ Complete | User submits receipt, admin confirms |
| Withdrawal requests | ✅ Complete | User requests, admin processes |
| Real-time chat | ✅ Complete | Socket.io, typing indicators, conversation management |
| In-app notifications (backend) | ✅ Complete | DB persistence + Socket.io push |
| In-app notifications (frontend) | ✅ Complete | Full UI with grouping by date, context menu |
| User profiles | ✅ Complete | Avatar, bio, school, department, hostel, skills |
| Edit profile | ✅ Complete | Bottom-sheet modal form |
| Reviews/ratings | ✅ Complete | 1–5 stars with comment after task completion |
| Trust score engine | ✅ Complete | Bayesian calculation with 5 factors |
| Admin dashboard | ✅ Complete | Stats, users, deposits, withdrawals, verifications, tasks, reports, transactions, runner apps |
| FAQ page | ✅ Complete | Static data with accordion UI |
| Landing page | ✅ Complete | 10 sections: hero, how-it-works, earn, testimonials, poster, FAQ, CTA, footer |
| About page | ✅ Complete | Mission, story, values |
| Privacy & Terms pages | ✅ Complete | Static content |
| Settings page | ✅ Complete | Account, linked accounts, logout |
| Notification settings UI | ✅ Complete | 4 toggle groups (UI only, not persisted) |
| Verification page | ✅ Complete | Email/phone/student ID with trust breakdown |
| Explore page | ✅ Complete | Nearby runners, services, credits |
| Become a Runner flow | ✅ Complete | Application form, admin approval |
| Purchase escrow system | ✅ Complete | Receipt upload, delivery OTP, budget approvals, disputes, audit logs |
| Password reset flow | ✅ Complete | Forgot/reset with email OTP |
| UI component library | ✅ Complete | 30+ custom components |
| Light/dark theme | ✅ Complete | CSS custom properties, `data-theme` attribute, system-aware |
| Mobile responsiveness | ✅ Complete | All pages tested and responsive |
| Role-aware bottom navigation | ✅ Complete | Different tabs for poster vs runner |
| Role switcher | ✅ Complete | Switch active role from UI |
| Command palette (⌘K) | ✅ Complete | Quick actions panel |
| Floating support button | ✅ Complete | Bottom-right help button |
| Celebration modal with confetti | ✅ Complete | On verification, runner approval |
| Loading skeletons | ✅ Complete | 9 custom skeleton components |
| Global loading bar | ✅ Complete | Wired to all API requests |
| Admin sidebar layout | ✅ Complete | Stat cards, navigation |
| Availability toggle | ✅ Complete | Toggle runner availability from profile |
| User preferences API | ✅ Complete | Theme, role, sidebar, language, notifications, radius, sort |
| Email sending | ✅ Complete | Resend API with branded templates |
| Cron job (expired task cleanup) | ✅ Complete | Hourly check, refund escrow |
| Health check endpoint | ✅ Complete | `GET /api/health` |

### What Is Partially Completed

| Feature | Status | What's Missing |
|---|---|---|
| Settings notification toggles | ⚠️ Partial | Toggles are local state only — not persisted to backend |
| Chat dispute button | ⚠️ Partial | Button exists in UI but does nothing |
| Review prompt on task completion | ⚠️ Partial | Visual prompt exists but not wired to review API |
| Avatar upload | ⚠️ Partial | Two `<input>` elements share same `fileRef` — one handler overwrites the other |
| Pre-MVP features included | ⚠️ Partial | Virtual accounts (Monnify), card payments (Paystack), loyalty credits, referral system code exists but explicitly not in MVP scope |

### What Is Currently Broken

| Issue | Location | Impact |
|---|---|---|
| Avatar upload broken | `profile/page.tsx` | Two inputs share same fileRef, avatar handler overwritten by student ID handler |
| `/disputes` route missing | `feed/page.tsx:130` | Links to `/disputes` which returns 404 |
| Chat route navigation not wired | `tasks/page.tsx:420` | Both branches redirect to feed — should redirect to chat |
| Notifications frontend is stub | `useNotifications.ts` | Full backend notifications exist but hook uses hardcoded empty data |
| Frontend dev server login fails from Vercel deployment | Vercel | `NEXT_PUBLIC_API_URL` defaults to `localhost:5000` in build — Vercel can't reach it, must be set to deployed backend URL |

### Planned But Not Started

| Feature | Notes |
|---|---|
| NIN verification | Planned for identity verification, not started |
| Smart matching / push notifications | Auto-assign open tasks to nearby available runners |
| Loyalty credits / referral system | Code exists in constants but not active |
| Full admin dashboard (10+ pages) | 9 admin pages exist, but more planned (reports charting, etc.) |
| PWA / offline support | Service worker, offline caching, install prompt |
| Explore / coming soon pages | Placeholder sections exist on explore page but standalone page missing |

---

## 4. Project Architecture

### Monorepo Structure

```
NeedFull/
├── needfull-backend/          # Express.js + TypeScript API server
│   ├── src/
│   │   ├── config/            # Environment, DB, constants
│   │   ├── controllers/       # Route handlers (14 controllers)
│   │   ├── middleware/         # Auth, validation, rate limiting
│   │   ├── routes/            # Express routers (15 route files)
│   │   ├── services/          # Business logic (13 services)
│   │   ├── jobs/              # Cron jobs
│   │   ├── types/             # TypeScript type declarations
│   │   └── index.ts           # Entry point
│   ├── migrations/            # SQL migration files
│   └── package.json
├── needfull-frontend/         # Next.js 14 App Router + React 19
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── (auth)/        # Login, register, forgot-password
│   │   │   ├── (main)/        # Protected app pages
│   │   │   ├── (admin)/       # Admin dashboard pages
│   │   │   ├── faq/           # FAQ
│   │   │   ├── about/         # About page
│   │   │   ├── terms/         # Terms of service
│   │   │   └── privacy/       # Privacy policy
│   │   ├── components/        # Reusable React components
│   │   │   ├── ui/            # Generic UI components (30+)
│   │   │   ├── auth/          # Auth-specific components
│   │   │   ├── landing/       # Landing page sections
│   │   │   ├── layout/        # Layout wrappers, providers
│   │   │   ├── tasks/         # Task-related components
│   │   │   ├── wallet/        # Wallet components
│   │   │   ├── profile/       # Profile components
│   │   │   ├── notifications/ # Notification components
│   │   │   └── verification/  # Verification components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # Zustand state stores
│   │   ├── lib/               # Utilities, API client, constants
│   │   └── proxy.ts           # Edge middleware (Next.js 16)
│   ├── public/                # Static assets
│   └── package.json
├── CONTEXT.md                 # Project brief
├── ADMIN_SETUP.md             # Admin guide
└── NEEDFULL_AI_CONTEXT.md     # ← You are here
```

### Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | React framework with App Router |
| React | 19.0.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x (with v4 `@import "tailwindcss"`) | Styling |
| Zustand | 4.4.4 | Client state management |
| TanStack React Query | 5.x | Server state management |
| Axios | 1.6.2 | HTTP client with interceptors |
| Socket.io Client | 4.7.2 | Real-time communication |
| Lucide React | 0.344.0 | Icons |
| react-hot-toast | 2.4.1 | Toast notifications |
| Zod | 3.22.4 | Schema validation |

### Backend Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18.0 | Runtime |
| Express.js | 4.18.2 | HTTP framework |
| TypeScript | 5.2.2 | Type safety |
| PostgreSQL (Supabase) | Latest | Database |
| PostGIS | Latest | Spatial queries (location-based tasks) |
| `pg` (raw SQL) | 8.11.3 | Database driver |
| Socket.io | 4.7.2 | Real-time |
| jsonwebtoken | 9.0.2 | JWT generation/verification |
| bcryptjs | 2.4.3 | Password hashing (cost 12) |
| Zod | 3.22.4 | Environment variable validation |
| Cloudinary SDK | 1.40.0 | Image upload |
| Resend SDK | Latest | Email delivery |
| Paystack SDK | Latest | Card payments (secondary) |
| Monnify SDK | Latest | Virtual accounts (not MVP) |
| node-cron | Latest | Scheduled jobs |
| Multer | Latest | File upload handling |

### Database

- **Host**: Supabase PostgreSQL with PostGIS extension
- **Access**: Raw SQL via `pg` Pool (no ORM)
- **Migrations**: Manual SQL files in `needfull-backend/migrations/`
- **Key patterns**:
  - `query<T>(sql, values?)` — returns `QueryResult<T>`
  - `queryOne<T>(sql, values?)` — returns single row, throws 404 if none
  - `withTransaction<T>(callback)` — wraps BEGIN/COMMIT/ROLLBACK around callback
  - All wallet mutations use `PoolClient` parameter (must be in transaction)
  - All wallet mutations use `SELECT FOR UPDATE` row locking

### Authentication Architecture

```
Login/Register
    ↓
Backend validates credentials
    ↓
JWT access token (15 min) + refresh token (7 days) issued
    ↓
Frontend stores:
  - localStorage: nf_access_token, nf_refresh_token
  - Cookie: nf_access_token (for Edge middleware)
    ↓
Every Axios request:
  - Request interceptor: attaches Bearer token
  - Response interceptor: on 401 → attempt refresh → retry queue
    ↓
Token refresh:
  - POST /auth/refresh with refreshToken
  - New tokens stored, queued requests retried
  - On failure: handleSessionExpired() → logout → redirect to /login
    ↓
Edge middleware (proxy.ts):
  - Reads nf_access_token cookie
  - Decodes JWT payload (no signature verify — only for role routing)
  - Auth routes → redirect to /admin or /feed if logged in
  - Protected routes → redirect to /login if no token
```

### State Management

- **Auth state**: Zustand store with `persist` middleware, saved to localStorage key `nf-auth`
- **Loading state**: Zustand store tracking in-flight API requests for loading bar
- **User preferences**: React Context + Persisted Context (theme, role, settings)
- **Server state**: TanStack React Query (not yet heavily used — most pages use direct API calls)

### Key Environment Variables

#### Backend (`needfull-backend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Min 32 characters |
| `FRONTEND_URL` | Yes | — | CORS origin, email links |
| `CLOUDINARY_CLOUD_NAME` | Yes | — | Image hosting |
| `CLOUDINARY_API_KEY` | Yes | — | |
| `CLOUDINARY_API_SECRET` | Yes | — | |
| `RESEND_API_KEY` | Yes | — | Email service |
| `EMAIL_FROM` | Yes | — | Sender email |
| `PAYSTACK_SECRET_KEY` | Yes | — | Card payments |
| `NEEDFULL_BANK_NAME` | Yes | — | Displayed for manual deposits |
| `NEEDFULL_ACCOUNT_NUMBER` | Yes | — | |
| `NEEDFULL_ACCOUNT_NAME` | Yes | — | |
| `PORT` | No | 5000 | |
| `JWT_ACCESS_EXPIRES_IN` | No | 15m | |
| `JWT_REFRESH_EXPIRES_IN` | No | 7d | |
| `PLATFORM_FEE_PERCENT` | No | 10 | |
| `WITHDRAWAL_FEE_KOBO` | No | 5000 | ₦50 |

#### Frontend (`needfull-frontend/.env.local`)

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` | Socket.io server |
| `NEXT_PUBLIC_NEEDFULL_BANK_NAME` | — | Display for manual deposits |
| `NEXT_PUBLIC_NEEDFULL_ACCOUNT_NUMBER` | — | |
| `NEXT_PUBLIC_NEEDFULL_ACCOUNT_NAME` | — | |

### API Architecture

- All API routes mounted under `/api`
- Controllers handle request/response, services handle business logic
- `wallet.service.ts` is the ONLY file allowed to modify wallet balances
- Route protection: `authenticate` → `requireRole("admin")` for admin endpoints
- Validation: Zod schemas + express-validator middleware
- Error pattern: `try/catch` in every controller, `console.error` + 500 response

### Deployment

- **Backend**: Render (Node.js, `npm run build` + `npm start`)
- **Frontend**: Vercel (Next.js, auto-detected by framework)
- **Database**: Supabase (PostgreSQL managed)
- **Image storage**: Cloudinary
- **Email**: Resend

---

## 5. UI/UX Philosophy

### Clean Modern UI

The interface follows a clean, modern aesthetic inspired by products like
Linear, Stripe, and Notion. Minimal visual noise, generous whitespace, and
clear typographic hierarchy. The goal is to feel premium and trustworthy —
critical for a platform handling money.

### Supabase-Inspired Authentication

The login/register pages use a split-screen layout: a glassmorphism form on
one side and a decorative image/graphic on the other. This pattern, inspired
by Supabase, signals modernity and professionalism from the first interaction.

### System Theme Follows Device Theme

The app detects the user's system preference (`prefers-color-scheme`) and
defaults to matching it. A manual toggle overrides when needed. The theme
is persisted in localStorage and synced to the backend via user preferences.

### Minimal Clutter

Every screen shows only what's necessary for the current task. Progressive
disclosure: advanced options are hidden behind expandable sections or modals.
Tooltips and inline help text replace separate documentation.

### Premium Feeling

Subtle animations (fade-in, scale-in, slide-up) with carefully tuned
durations (0.3–0.5s) and delays. Glassmorphism effects on cards and modals.
Gradient backgrounds on hero sections. The brand colors (`#1A6B4A` green +
`#EAA325` gold accent) convey trust and value.

### Mobile-First

All designs start from mobile (375px width) and expand to tablet/desktop
using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). The bottom
navigation bar is the primary navigation on mobile. Touch targets are at
least 44×44px. Optimised for 3G networks and low-end Android devices.

### Accessibility

- Skip-to-content link at the top of every page
- Semantic HTML (proper heading hierarchy, landmarks)
- `aria-label` on icon-only buttons
- Focus-visible outlines for keyboard navigation
- `role="status"` on dynamic content regions
- Color contrast ratios meet WCAG AA minimums
- Reduced motion respected via `prefers-reduced-motion`

### Fast Interactions

- Optimistic UI updates where possible
- Skeleton loaders instead of spinners for content-heavy pages
- Global loading bar (top of page) during API requests
- Toast notifications for success/error feedback
- Keyboard shortcuts via command palette (⌘K)

### Progress Indicators

Multi-step flows (registration, task creation, purchase workflow) use
progress step indicators showing the user exactly where they are and how
many steps remain.

### Floating Support Button

A persistent floating help button in the bottom-right corner provides quick
access to FAQ, contact support, and in-app guidance.

### Consistent Spacing and Typography

- **Fonts**: `Syne` (display/headings), `Plus Jakarta Sans` (body)
- **Scale**: 4px base unit, consistent `space-y-*` and `gap-*` values
- **Corners**: `rounded-xl` (12px) for cards/inputs, `rounded-full` for pills
- **Shadows**: `shadow-sm` is the default card shadow, `shadow-lg` for modals

---

## 6. Features Already Discussed

This section describes every feature that has been planned or discussed,
organized by implementation status.

### Fully Implemented Features

#### Task Posting and Lifecycle
Users post tasks with title, description, budget (in kobo), category, location
(PostGIS point), deadline, and optional image. Tasks flow through statuses:
`open` → `in_progress` (runner accepted) → `completed` → (automatic escrow
release). Posters can cancel tasks before accepting a runner, and the system
cancels expired tasks via cron.

#### Task Discovery (Feed)
Open tasks displayed in a feed sorted by nearest, newest, budget, or urgent.
Users filter by category, status, and distance. The feed re-fetches on mount
and on filter change.

#### Application System
NeedRunners browse the feed and apply to tasks with a message and optional
bid amount. Posters review applications and accept/reject. Accepted
applications trigger escrow lock. Rejected applications notify the runner.

#### Real-Time Chat
Socket.io-powered chat with conversation management. Each task gets a
dedicated conversation between poster and assigned runner. Features include
typing indicators, message timestamps, and unread counts.

#### Wallet and Escrow System
Every user has a wallet with two separate balances: spendable balance and
locked escrow. Funds move between these states:
- Task posted → balance unchanged (escrow locks on runner acceptance)
- Runner accepted → `lockEscrow` moves funds from balance to escrow
- Task completed + confirmed → `releaseEscrow` moves from escrow to runner
  balance (minus 10% platform fee)
- Task cancelled → `refundEscrow` moves funds back to poster balance
- Manual deposit → admin confirms → `creditWallet`
- Withdrawal → admin processes → `debitWallet`

All operations use `SELECT FOR UPDATE`, run in transactions, and log to
`wallet_transactions`.

#### Manual Bank Transfer Deposits
Users initiate a deposit, see the company's bank details, transfer money,
upload a receipt screenshot. Admin confirms → wallet credited. Every deposit
has an idempotency key preventing double-crediting.

#### Withdrawal Requests
Users request withdrawal with bank details. Admin processes the transfer
offline and marks it as processed in the system.

#### Trust Score Engine
Bayesian calculation combining:
- **Rating points**: Average rating weighted by reviewer count (Bayesian
  adjustment toward population mean)
- **Completion points**: Tasks completed, capped contribution
- **Verification points**: Email (+5), phone (+4), student ID (+6)
- **Report penalty**: -20 per report, max -40
- **Tenure points**: +2 per month since registration, max +20

Score range: 0–100. Initial score: 50.

#### Google OAuth
Google OAuth 2.0 login with popup flow. Users can link/unlink Google accounts
from settings. The backend stores `google_id` on the users table and creates
a session on successful Google authentication.

#### Role System
Three roles: `poster`, `runner`, `admin`. Users start with `poster` role and
can apply to become a runner. Admin is set via SQL. Active role determines
the dashboard UI and navigation. Users can switch roles from the UI.

#### Purchase Escrow System (Extended MVP)
For purchase tasks (runner buys items for poster):
1. Poster creates purchase task with estimated item cost + runner fee
2. Total escrowed upfront
3. Runner buys item, uploads receipt
4. If receipt exceeds budget, runner requests budget approval from poster
5. Runner enters delivery OTP (generated by system, shared by poster)
6. Escrow released to runner after OTP verification
7. Full audit log tracks every action
8. Dispute system with evidence uploads

### Partially Implemented Features

#### Notification System
**Backend**: Fully implemented — notification creation on key events, DB
persistence, Socket.io real-time push, mark-as-read, delete.
**Frontend**: Full UI exists (date-grouped list, context menu, icons per
type) but the `useNotifications` hook is completely stubbed — it never calls
the backend APIs. TODO comment says "Wire to backend endpoint when ready."

#### Review System
**Backend**: Fully implemented — create reviews after task completion, fetch
reviews by user, rating aggregation.
**Frontend**: UI prompt exists on completed tasks but the star-rating
component is not wired to the review API.

### Planned But Not Yet Implemented

#### NeedRunner Verification
A formal NeedRunner verification process beyond basic student ID verification.
Planned: background check, in-person verification at campus office, verified
badge on profile.

#### Smart Matching / Push Notifications
When a task is posted, the system should intelligently match it with nearby
available NeedRunners and push a notification. The `matching.service.ts`
exists but is not fully integrated.

#### Streak System
Gamification: consecutive days of completing tasks earns streak bonuses,
displayed as badges on the profile. Increases trust score.

#### Business Accounts
Student-run businesses register as businesses, list services, set pricing,
accept bookings through the platform.

#### NeedWork Concept
A separate track for professional/regular part-time work arrangements
(not one-off tasks). Think "internship marketplace for students."

#### Loyalty Credits / Referral System
Code exists in `constants.ts` (loyalty credits per task, thresholds, bonus
amounts, referral rewards) but no UI or logic is active.

#### Lending Circle
Peer-to-peer micro-lending among verified students. Low-interest short-term
loans backed by reputation. Code exists in `constants.ts` as LOAN_TIERS.

#### Full Admin Dashboard
More admin pages: detailed charts, CSV exports, bulk actions, audit log
viewer, platform revenue reports.

---

## 7. Outstanding Tasks

### Critical

| # | Task | Why It Matters | Current Blocker | Suggested Approach |
|---|---|---|---|---|
| 1 | **Wire frontend notifications to backend** | Users receive zero in-app notifications despite backend being ready. Every key event (task assigned, escrow released, etc.) is invisible. | `useNotifications` hook is stubbed with hardcoded empty data | Update `useNotifications.ts` to call `GET /notifications`, `POST /notifications/:id/read`, `DELETE /notifications/:id` via the existing apiClient. The backend endpoints already exist. |
| 2 | **Fix avatar upload on profile page** | Avatar and student ID upload both use the same `fileRef`, causing the avatar upload handler to be overwritten. Clicking avatar pencil triggers student ID upload instead. | Two `<input>` elements share a single React `ref` — only the last rendered one wins | Give each `<input>` its own unique ref, or use `onClick` to programmatically trigger the correct input. |
| 3 | **Create `/disputes` page** | The feed dashboard links to `/disputes` for users with open disputes. This page doesn't exist — users get a 404. | Page never created | Create a simple disputes page showing the user's open disputes using the existing purchase dispute endpoints, or remove the link if disputes aren't MVP. |
| 4 | **Wire chat navigation from tasks page** | Both branches of the conditional (line 420 of `tasks/page.tsx`) redirect to `/feed/${task.id}` instead of the chat route. Users can't navigate to chat from their task list. | Chat route not created in the conditional logic | Update the redirect to use `/chat/${conversationId}` instead of `/feed/${task.id}`. The conversation ID would need to be fetched or derived. |

### High

| # | Task | Why It Matters | Current Blocker | Suggested Approach |
|---|---|---|---|---|
| 5 | **Persist settings toggles to backend** | Notification preferences, urgent task alerts, and privacy toggles on the Settings page are local `useState` only. Every refresh resets them. | No API calls wired to toggle changes | Connect each toggle to the existing `PATCH /user/preferences` endpoint. Use the `userPreferences` context to sync initial values and persist changes. |
| 6 | **Set `NEXT_PUBLIC_API_URL` on Vercel** | Vercel deployment hardcodes `http://localhost:5000/api` because no env var is set. All API calls fail from the deployed site. | Env var not configured in Vercel dashboard | Add `NEXT_PUBLIC_API_URL` env var to Vercel pointing to the deployed backend URL. Requires backend to be deployed to Render first. |
| 7 | **Wire review/rating after task completion** | Completed tasks show a review prompt but the star-clicking UI is not connected to the review API. Users cannot rate their experience. | Star rating component not wired to `POST /reviews` | Add API call to create review when user submits star rating. Use existing backend endpoint at `/api/reviews`. |
| 8 | **Fix profile dropdown passing fullName as email prop** | `feed/page.tsx` passes `user.fullName` to the `email` prop of the Avatar component. This is semantically wrong and may cause display issues. | Copy-paste error in prop passing | Change to pass `user.email` as the email prop and `user.fullName` as the name prop (or the correct prop name). |

### Medium

| # | Task | Why It Matters | Current Blocker | Suggested Approach |
|---|---|---|---|---|
| 9 | **Replace `<a href>` with Next.js `<Link>` on landing page** | HeroSection uses `<a href="/register">` causing full page reloads instead of client-side transitions. Slower navigation UX. | Uses standard anchor tags | Replace with Next.js `<Link>` component for internal route navigation. |
| 10 | **Replace hardcoded brand colors with CSS variables** | 50+ locations hardcode `#1A6B4A` and `#EAA325` instead of using Tailwind theme tokens. Maintainability issue when colors change. | Multiple files with inline hex values | Create a script to find and replace hardcoded brand colors with `bg-brand`, `text-gold`, etc. Use `scripts/check-hardcoded-colors.mjs` to detect remaining instances. |
| 11 | **Replace `any` types with proper TypeScript** | 100+ locations use `: any` or `as any` across frontend and backend. Weakens type safety and IDE support. | Large scope, gradual process | Start with the most impactful: replace `catch (err: any)` patterns, stub component types, and `db.query<any>` calls. |
| 12 | **Remove pre-MVP feature code** | Virtual accounts (Monnify), card payments (Paystack), loyalty credits, and loan tiers are built but explicitly NOT in MVP. Creates ~1500 lines of dead code. | Features may be needed post-MVP | Either remove the code (cleaner) or gate behind feature flags / env vars (safer for later). |
| 13 | **Clear empty `src/app/notifications/` directory** | An empty directory at `src/app/notifications/` has no `page.tsx` but creates a route segment. Dead weight. | Unused directory | Delete the empty directory — the real notifications page is at `src/app/(main)/notifications/`. |
| 14 | **Handle null wallet in `getMe` controller** | The LEFT JOIN with wallets can return `wallet_id: null` if no wallet exists. The controller destructures without null check, risking a runtime error. | Edge case — should never happen due to wallet trigger, but defensive coding needed | Add a null check after the query. If no wallet exists, create one on-the-fly or return a default zero-balance wallet object. |

### Low

| # | Task | Why It Matters | Current Blocker | Suggested Approach |
|---|---|---|---|---|
| 15 | **Add Socket.io cleanup on user change** | The socket singleton doesn't disconnect/reconnect when the user changes (login/logout). Could leak events to wrong user. | `useSocket.ts` only cleans up the `connect` listener | Add a useEffect dependency on userId that disconnects the old socket and creates a new one. |
| 16 | **Replace `console.log` with proper logger** | ~80 console.log statements in backend (cron, db, index.ts, all controllers). No structured logging. | No logging library configured | Integrate a lightweight logger (pino or winston) and replace console.log/error calls. |
| 17 | **Replace inline theme styles with Tailwind classes** | Login/register pages use inline `style={{ color: "var(--color-foreground)" }}` instead of Tailwind classes like `text-gray-900`. Inconsistent with the rest of the app. | Inline styles are maintenance-heavy | Replace with equivalent Tailwind utility classes. The theme variables are already available in `@theme` block. |
| 18 | **Remove unused imports** | `explore/page.tsx` imports `patch` from apiClient but never uses it. | Linting oversight | Remove unused import. |
| 19 | **Upgrade stub UI components** | `Sheet` and `ScrollArea` in `components/ui/` are typed as `: any` and have no real behavior. They're essentially div wrappers. | TypeScript `any` types, no behavior | Either implement the actual sheet/scroll behavior with proper types, or remove if unused. |
| 20 | **Remove `console.log("User logged out")` from hook** | `useAuthHooks.ts` has a debug log that warns on every logout. Production code should not have debug logs. | Developer debug leftover | Remove the console.log, or wrap in `if (process.env.NODE_ENV !== 'production')`. |

---

## 8. Known Bugs

### Bug 1: Avatar upload handler overridden by student ID upload handler

- **Location**: `needfull-frontend/src/app/(main)/profile/page.tsx` (line 241 and 489)
- **Reproduction**:
  1. Go to Profile page
  2. Click the pencil/edit icon on the avatar
  3. Select an image file
- **Expected**: The selected file triggers `handleAvatarUpload` and updates the avatar
- **Actual**: The selected file triggers `handleVerificationUpload` (student ID upload handler) because both `<input>` elements share the same `fileRef` — only the last rendered `fileRef` reference wins, which is the student ID upload input
- **Likely cause**: Two `<input type="file">` elements use `ref={fileRef}` — React's ref can only point to one DOM element, and the second one (student ID) overwrites the first (avatar)
- **Priority**: Critical (functionality broken)
- **Suggested fix**: Give each input its own unique ref (e.g., `avatarFileRef` and `verificationFileRef`), or use `onClick` handlers on the visible buttons to programmatically trigger the correct hidden input

### Bug 2: `/disputes` route returns 404

- **Location**: `needfull-frontend/src/app/(main)/feed/page.tsx` (line 130, `cta: { label: "View dispute", href: "/disputes" }`)
- **Reproduction**:
  1. Have a task with an open dispute
  2. Look at the feed dashboard — hero state shows "View dispute" CTA
  3. Click "View dispute"
- **Expected**: Navigate to a disputes page showing the user's open disputes
- **Actual**: 404 page (page doesn't exist)
- **Likely cause**: Page was never created
- **Priority**: High (broken navigation)
- **Suggested fix**: Create a `/disputes` page using existing purchase dispute endpoints, or change the link to point to the relevant purchase task detail page

### Bug 3: Chat redirect from tasks page goes to feed instead of chat

- **Location**: `needfull-frontend/src/app/(main)/tasks/page.tsx` (line 420)
- **Reproduction**:
  1. Have a task with an accepted runner
  2. Go to My Tasks page
  3. Click the chat button on the task card
- **Expected**: Navigate to the chat thread for that task
- **Actual**: Both branches of the conditional redirect to `/feed/${task.id}` — the TODO comment says "Navigate to chat — TODO: create the chat route"
- **Likely cause**: Chat route navigation was never implemented for this button
- **Priority**: High (navigates to wrong page)
- **Suggested fix**: The chat route exists at `/chat/[id]`. Fetch or compute the conversation ID for the task and redirect to `/chat/${conversationId}`

### Bug 4: Login fails from Vercel deployment

- **Location**: Vercel environment configuration
- **Reproduction**:
  1. Visit `https://needfull-frontend.vercel.app/login`
  2. Enter valid email and password
  3. Click Sign in
- **Expected**: Successful login, redirect to feed
- **Actual**: API call fails with network error because the frontend sends requests to `http://localhost:5000/api/auth/login` (the default URL baked into the build)
- **Likely cause**: `next.config.ts` uses `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"` in the `env` block. At Vercel build time, no `NEXT_PUBLIC_API_URL` is set, so it defaults to `localhost:5000` — which Vercel's servers cannot reach
- **Priority**: Critical (deployment broken)
- **Suggested fix**: Set `NEXT_PUBLIC_API_URL` env var in Vercel project dashboard to the deployed backend URL. Requires backend to be deployed on Render first.

### Bug 5: Settings notification toggles reset on refresh

- **Location**: `needfull-frontend/src/app/(main)/settings/page.tsx`
- **Reproduction**:
  1. Go to Settings
  2. Toggle "Task alerts" OFF
  3. Refresh the page
- **Expected**: "Task alerts" should remain OFF
- **Actual**: Toggle resets to ON (default)
- **Likely cause**: Toggles are local `useState` with no persistence layer. The backend preferences endpoint exists (`PATCH /user/preferences`) but isn't called
- **Priority**: Medium (UX inconsistency)
- **Suggested fix**: Wire each toggle to the `PATCH /user/preferences` API. Use the existing `UserPreferencesContext` to read initial values and persist changes

### Bug 6: Profile dropdown passes fullName to email prop

- **Location**: `needfull-frontend/src/app/(main)/feed/page.tsx` (some line near the ProfileDropdown component)
- **Reproduction**:
  1. Log in
  2. Look at the feed page header — the profile dropdown likely shows the user's name in the email field
- **Expected**: Email field shows the user's email
- **Actual**: Shows the user's full name (passed as the `email` prop to Avatar)
- **Likely cause**: Copy-paste error — `user.fullName` passed where `user.email` was intended
- **Priority**: Low (cosmetic, but could cause confusion if email is used elsewhere)
- **Suggested fix**: Change the prop to pass `user.email` as the email prop and `user.fullName` as the correct prop for display name

---

## 9. Technical Debt

### Duplicated Code

1. **Two `apiClient` instances**: `authStore.ts` creates its own `axios.create({...})` with the same `baseURL` as the shared `apiClient` in `lib/apiClient.ts`. The auth store version doesn't have the same interceptors (loading bar tracking). If the auth store version ever needs token refresh handling, it would need to duplicate the logic from `lib/apiClient.ts`.

2. **SVG logo embedded in multiple files**: The NeedFull logo SVG (brand icon with circles and paths) is duplicated across at least 10 files (login page, register page, feed page, navbar, footer, auth components, etc.). Any change to the logo requires updating all copies.

3. **Brand colors hardcoded in 50+ locations**: `#1A6B4A` and `#EAA325` appear as inline styles, SVG fills, and CSS values throughout the codebase. Should be referenced via Tailwind theme tokens (`bg-brand`, `text-gold`, etc.).

### Places Needing Refactoring

1. **`profile/page.tsx`**: At 522 lines, this is one of the largest components. Should be split into smaller sub-components (ProfileHeader, OverviewTab, ReviewsTab, ActivityTab, SettingsTab, etc.).

2. **`feed/page.tsx`**: At 833 lines, this is the largest component in the project. The runner dashboard is already extracted to a separate component (`RunnerDashboard`), but the poster dashboard should also be extracted or broken into sections.

3. **`purchase/[id]/page.tsx`**: Complex purchase workflow page with multiple states. Large file that should be split into workflow step components.

4. **Auth middleware (`auth.ts`)**: The `authenticate` function has async role loading that isn't awaited before calling `next()`. This creates a race condition where `req.user` may not be fully populated when the route handler runs. The `loadRoles` Promise should be awaited before `next()`.

5. **Stub UI components**: `sheet.tsx` and `scroll-area.tsx` are typed as `any` and have no real behavior. They should either be properly implemented or removed.

### Performance Concerns

1. **No image optimization**: Task images are loaded from Cloudinary at full resolution. No Cloudinary transformations (width, quality) are applied to reduce payload size on mobile connections.

2. **No pagination virtualization**: Long task lists, transaction lists, and notification lists are rendered as flat arrays. No virtual scrolling means performance degrades with large lists.

3. **No request deduplication**: If a component re-renders and re-fetches the same API endpoint, there's no built-in request caching or deduplication (beyond what React Query could provide).

4. **Unoptimized re-renders**: Zustand store subscriptions are not granular — components that subscribe to `useAuth()` re-render on any auth state change, even if they only use `user` and not `isLoading`.

### UI Inconsistencies

1. **Inline theme styles vs Tailwind classes**: Login/register pages use inline `style={{ color: "var(--color-foreground)" }}` while most other pages use Tailwind classes like `text-gray-900`.

2. **Admin pages use `bg-white` instead of theme tokens**: Admin dashboard pages use hardcoded `bg-white` instead of theme-aware background variables, causing visual glitches in dark mode.

3. **Hardcoded verification points**: Verification page shows `+5` for email, `+4` for phone, `+6` for student ID as hardcoded values. These should be fetched from the backend or stored in a single constant file.

### Architecture Improvements

1. **Feature flags**: Pre-MVP features (virtual accounts, card payments, loyalty credits) are fully built in the code but shouldn't be accessible. Should be gated behind environment-level feature flags.

2. **No testing**: Zero test files exist anywhere in the project. No unit tests, integration tests, or E2E tests. This is a significant risk for a platform handling money.

3. **No input validation on frontend**: Form validation uses Zod schemas but they're not consistently applied. Some forms lack client-side validation before API calls.

4. **No proper logging**: Backend uses `console.log` and `console.error` everywhere. No structured logging, log levels, or log aggregation.

### Security Concerns

1. **JWT secret in environment variable**: Good practice, but the JWT_SECRET is validated with Zod on startup. If validation fails, the server exits. This is a single point of failure.

2. **CORS configured broadly**: The backend allows `FRONTEND_URL` (one origin) but the configuration should be audited for production.

3. **Rate limiting skip function is broken**: The `authLimiter` in `rateLimiter.ts` has a `skip` function that checks `req.res?.statusCode` — but the status code isn't set until the response is written, so the check is meaningless. This effectively disables rate limiting for all requests.

4. **Console.warn exposes user data**: Auth middleware logs `JSON.stringify(user.roles)` in a warning message — potential sensitive data exposure in production logs.

### Scalability Improvements

1. **No database connection pooling limits**: The pool max is configurable (default 20), but there's no circuit breaker or connection retry with backoff for database failures.

2. **No caching layer**: Frequently accessed data (categories, user profiles, task lists) has no caching. Every request hits the database.

3. **No job queue**: The cron job runs inline in the server process. For a production deployment, this should be a separate worker process.

---

## 10. Coding Standards

### Naming Conventions

| Convention | Pattern | Example |
|---|---|---|
| Files | `kebab-case` | `auth-store.ts`, `wallet.service.ts` |
| React components | `PascalCase.tsx` | `TaskCard.tsx`, `WalletHero.tsx` |
| Functions | `camelCase` | `handleLogin()`, `formatCurrency()` |
| Variables | `camelCase` | `user`, `accessToken`, `transactionList` |
| Constants | `UPPER_SNAKE_CASE` | `PLATFORM_FEE_PERCENT`, `SESSION_EXEMPT_PATHS` |
| Types/Interfaces | `PascalCase` | `AuthUser`, `LoginResponse` |
| CSS classes | Tailwind utilities (no custom classes) | `flex`, `text-sm`, `rounded-xl` |

### Folder Organization

- **Components** go in `src/components/<domain>/` (e.g., `components/tasks/TaskCard.tsx`)
- **Generic UI components** go in `src/components/ui/` (e.g., `components/ui/button.tsx`)
- **Pages** follow Next.js App Router conventions inside `src/app/`
- **Route groups** use parentheses: `(auth)`, `(main)`, `(admin)`
- **Store files** go in `src/store/` — one file per store
- **Hooks** go in `src/hooks/` — one file per hook
- **Utilities** go in `src/lib/` — API client, constants, helpers

### Reusable Components

- Build small, focused components that do one thing well
- Accept `className` prop for style customization
- Use `forwardRef` for interactive elements (inputs, buttons)
- Export from `index.ts` barrel files where grouped
- Prefer composition over complex props

### TypeScript Practices

- Prefer `interface` over `type` for object shapes (extendability)
- Use `type` for unions, tuples, and utility types
- Avoid `any` — use `unknown` and type guards instead
- Use strict null checks (no `!` assertions unless absolutely necessary)
- Define response types for API calls (e.g., `LoginResponse`, `MeResponse`)
- Use enums for fixed value sets (task status, notification types)

### Tailwind Practices

- Use Tailwind utility classes exclusively for styling
- Use `@theme` tokens for colors, fonts, spacing
- CSS custom properties for dynamic theming (light/dark mode)
- Responsive design with breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Use `space-y-*` or `gap-*` for spacing between elements
- Prefer `flex` and `grid` over absolute positioning
- Dark mode: use Tailwind's `dark:` variant (or toggle via CSS custom properties)

### Accessibility Rules

- All images must have `alt` text (even if empty for decorative)
- Interactive elements must be keyboard-accessible
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`, `<a>`)
- Forms must have proper `<label>` elements linked via `htmlFor`/`id`
- Loading states must have `aria-busy` or `role="status"`
- Focus indicators must be visible (don't remove `outline:none` without replacement)
- Color is never the sole indicator of state (add icons, text, or patterns)
- Respect `prefers-reduced-motion`

### Responsive Design Rules

- Mobile-first: design for 375px, enhance for larger screens
- Bottom navigation is the primary nav on mobile
- Sidebar/desktop nav at `lg:` breakpoint
- Touch targets minimum 44×44px
- No horizontal scrolling on any page
- Text must be readable without zoom at 320px width

### Animation Philosophy

- Subtle and purposeful — not decorative
- Duration: 0.2–0.4s for UI transitions, 0.5s for celebratory animations
- Use `transition-all duration-150` for interactive elements (hover, focus)
- Use `animate-fade-in`, `animate-slide-up`, `animate-scale-in` for entrance animations
- Respect `prefers-reduced-motion` — disable animations entirely
- No infinite animations (except loading spinners)

### Error Handling

- Every API call in a try/catch block
- Display user-friendly error messages (never raw error objects)
- Network errors → generic "Something went wrong. Please try again."
- Validation errors → specific field-level messages
- 401 → token refresh, redirect to login on failure
- 403 → "You don't have permission to do this"
- 404 → "This resource wasn't found"
- 500 → "Something went wrong on our end. Please try again."

### Loading States

- Skeleton loaders for content-rich pages (feed, profile, wallet)
- Spinners for small inline actions (buttons, toggles)
- Global loading bar for page transitions and API navigation
- Toast notifications for async operation results
- Disable submit buttons during form submission

### Empty States

- Every list/data view must have an empty state
- Empty states show: an illustration/icon, a clear message, and an action CTA
- Use the shared `EmptyState` component from `components/ui/empty-state.tsx`
- Examples: "No tasks yet. Be the first to post one.", "No notifications. You're all caught up!"

### Skeleton Loaders

- Create a skeleton variant for each major page type
- Skeletons should match the layout of the loaded content
- Use animated pulse effect (`animate-pulse`)
- Minimum skeleton height to prevent layout shift
- Don't show skeletons for <500ms loads (use minimum display time)

### Optimistic Updates

- For actions where failure is rare (toggling switches, updating preferences):
  1. Update the UI immediately
  2. Fire the API call
  3. On success: keep the optimistic UI
  4. On failure: revert the optimistic UI + show error toast

### Code Comments

- Use structured block headers at the top of every file:
  ```
  // WHAT: <what this file does>
  // WHY: <why it exists>
  // FUTURE: <planned improvements>
  ```
- Inline comments for complex logic (not for obvious code)
- Use `// WHAT:` and `// WHY:` prefixes for code block explanations
- Use `// FUTURE:` for planned improvements inline

### Testing Expectations

- Currently: **zero tests exist**
- Target: Start with critical path tests
- Priority for testing:
  1. Wallet service (every mutation)
  2. Auth flow (login, register, refresh, session expiry)
  3. Escrow logic (lock, release, refund)
  4. Trust score calculation
  5. Task lifecycle (create, apply, accept, complete)

---

## 11. AI Collaboration Rules

### How Opencode and Z.ai Work Together

Opencode and Z.ai are **two AI development assistants** collaborating on the
NeedFull project. Each has distinct strengths and responsibilities.

### Z.ai's Responsibilities

| Responsibility | Description |
|---|---|
| **Understand existing architecture** | Read and understand the full codebase before suggesting changes. Don't assume patterns that don't exist. |
| **Never rewrite large working sections** | Prefer targeted edits over wholesale replacements. If code works and is maintainable, keep it. |
| **Improve existing components** | Before suggesting a new component, check if an existing one can be enhanced. |
| **Maintain design consistency** | Every UI addition should follow the existing design system, theme tokens, and Tailwind patterns. |
| **Preserve project vision** | All suggestions must align with the MVP scope and long-term roadmap. Don't suggest features outside the current scope. |
| **Suggest scalable solutions** | Think about how a solution will work at 100 users, then 10,000 users. Avoid patterns that don't scale. |
| **Look for edge cases** | Before accepting a solution, identify empty states, error states, loading states, and boundary conditions. |
| **Improve performance** | Identify unnecessary re-renders, large bundle sizes, unoptimized queries, and missing code splitting. |
| **Improve accessibility** | Check for missing ARIA attributes, keyboard navigation gaps, color contrast issues, and screen reader support. |
| **Catch bugs before implementation** | Review PR descriptions and planned changes for logical errors, race conditions, and type mismatches. |
| **Review security implications** | Flag any change that touches auth, wallet, user data, or input validation. |
| **Recommend better architecture** | When you see a better pattern (e.g., extracting a service, using a hook, splitting a component), suggest it with clear reasoning. |
| **Keep solutions production-ready** | Every suggestion should consider error handling, loading states, type safety, and documentation. |

### Opencode's Responsibilities

| Responsibility | Description |
|---|---|
| **Continue implementing and integrating features** | Opencode handles the primary development work — writing code, fixing bugs, building features. |
| **Keep the codebase clean and maintainable** | Opencode maintains the code quality, removes dead code, and follows the established conventions. |
| **Use Z.ai as a reviewer and architect** | When facing a complex decision, Opencode can ask Z.ai for architecture review, debugging help, or brainstorming. |
| **Ensure adopted suggestions fit the project** | Z.ai's suggestions should be reviewed for alignment with the current codebase style, project scope, and timeline before implementation. |

### Communication Protocol

- **Z.ai** provides analysis, recommendations, and warnings in its responses
- **Opencode** makes the final implementation decisions and writes the code
- Both should reference specific file paths and line numbers when discussing code
- Both should use the same terminology defined in the Project Glossary
- When disagreeing, prefer the simpler solution that matches the existing patterns

---

## 12. Future Vision

### MVP (Current Stage)

- ✅ Core two-sided marketplace: post tasks, apply, complete, get paid
- ✅ Escrow protection on every transaction
- ✅ Wallet system with manual bank transfer deposits
- ✅ Real-time chat between posters and runners
- ✅ Trust scoring and review system
- ✅ Basic admin dashboard for deposit confirmation and user management
- ✅ Single campus (FUOYE) as pilot
- 🚧 Wire frontend notifications to backend
- 🚧 Fix known bugs and technical debt
- 🚧 Deploy backend to Render, set Vercel env vars

### Campus Launch (Next 3–6 Months)

- Full deployment at FUOYE with real student users
- Marketing campaign on campus
- On-campus support (dedicated email, FAQ, guides)
- Bug fixes from real user feedback
- Performance optimization for campus-scale traffic (5000+ users)
- Responsive support team for dispute resolution
- Student ID verification enforcement for runners

### Multi-Campus Expansion (Late 2026)

- Expand to 5–10 Nigerian universities
- Region-specific content (local currencies, local banks)
- Campus ambassador program
- Localized marketing per university
- Administration dashboards per campus
- Cross-campus task capability (optional)
- Campus-specific category customization

### Nationwide Expansion (2027)

- Available at 50+ Nigerian universities
- NeedWork: regular part-time employment matching
- Business accounts for campus-area businesses
- Loan system (trust-score-based micro-lending)
- Premium features (priority support, promoted tasks)
- Mobile money integration (not just bank transfers)
- Analytics dashboard for platform health

### Global Launch (2028+)

- African universities beyond Nigeria
- Multiple currency support
- Regional bank/payment integration
- Localized compliance (each country's regulations)
- AI-powered task matching
- Advanced fraud detection
- Community-driven governance model

---

## 13. Project Glossary

### NeedFull
The platform itself. A campus economy marketplace connecting students who need
tasks done with students who want to earn money. Derived from "need fulfilled."

### NeedRunner (also "Runner" or "Agent")
A user who applies to and completes tasks in exchange for payment. Can toggle
availability on/off. Must be at least email-verified. Building trust score
improves their visibility and earning potential.

### Poster (also "Seeker")
A user who posts tasks and pays NeedRunners to complete them. Funds their
wallet, posts tasks, reviews applications, accepts a runner, confirms
completion, and leaves a review.

### Trust Score
A numerical value (0–100) representing a user's reliability on the platform.
Calculated by a Bayesian engine factoring: ratings, completion rate,
verifications, reports, and account tenure. New users start at 50. Displayed
on profiles and influences task acceptance likelihood.

### Verification
The process of proving identity on the platform. Three levels:
1. **Email** (OTP, required) — unlocks basic access
2. **Phone** (OTP, optional) — adds trust points
3. **Student ID** (photo upload + admin approval, optional) — adds verified
   badge and maximum trust points

### Wallet
Every user's digital wallet with two separate balances:
- **Balance**: Spendable funds (can be used to post tasks or withdrawn)
- **Escrow**: Locked funds (held until task completion or cancellation)

All amounts stored in kobo. All mutations use SELECT FOR UPDATE and are logged
to wallet_transactions.

### Business Account (Future)
A special account type for student-run businesses (photographers, tutors,
designers, etc.). Allows service listing, booking management, and recurring
client relationships.

### NeedWork (Future)
A separate marketplace track for regular part-time work (vs. one-off tasks).
Designed for students who want consistent income. Includes schedules, recurring
payments, and long-term trust building.

### Task
A unit of work on the platform. Contains title, description, budget (kobo),
category, location (PostGIS point), deadline, optional image, and status
(open → in_progress → completed → cancelled/disputed).

### Purchase Task
A special task type where a NeedRunner purchases items on behalf of the poster.
Has additional workflow: receipt upload, delivery OTP, budget approvals, and
dispute system with evidence.

### Escrow
Funds locked in the platform's wallet system until a task is completed and
confirmed by the poster. Cannot be accessed by either party while locked.
Released to runner on confirmation, refunded to poster on cancellation.

### Category
Task classification (e.g., Laundry, Delivery, Tutoring, Graphic Design).
Used for filtering the task feed. Stored in the `categories` table with name
and icon.

### Streak (Future)
A gamification feature: consecutive days of completing tasks earns streak
bonuses. Displayed as badges on the user's profile and influences trust score.

### Platform Fee
The fee charged by NeedFull on each completed task. Default: 10% of the task
budget. Deducted from escrow before releasing earnings to the runner.

### Manual Transfer
The primary deposit method. User transfers money from their bank to NeedFull's
bank account, uploads a receipt, and an admin confirms the deposit (crediting
the user's wallet). Free for the user (no platform fee).

### Support Center
In-app help system accessible via the floating support button. Links to FAQ,
contact support form, and guided help articles.

### Command Palette (⌘K)
A keyboard shortcut (Ctrl+K / Cmd+K) that opens a quick-actions search panel.
Allows navigating to any page, creating a task, accessing settings, etc.

---

## 14. Executive Summary for Z.ai

# Welcome to NeedFull

**What NeedFull is**: A campus economy platform for Nigerian university students.
A trusted middleman connecting students who need tasks done with students who
want to earn money. Escrow-protected, mobile-first, and free to use.

**Current stage**: Late-stage MVP. The core feature set is complete:
registration, login, task posting and discovery, task applications with escrow,
real-time chat, wallet with manual bank transfer deposits, withdrawal requests,
trust scoring, reviews, admin dashboard, purchase escrow workflow, Google OAuth,
role system, full UI with light/dark theme, and 40+ pages. The backend is
feature-complete. The frontend has all pages implemented with real API wiring.

**Biggest priorities right now**:

1. **Fix the Vercel deployment** — Set `NEXT_PUBLIC_API_URL` env var on Vercel
   and deploy the backend to Render so the live site actually works
2. **Wire frontend notifications to backend** — The backend is ready but the
   frontend hook is stubbed. Users get zero in-app notifications.
3. **Fix the avatar upload bug** — Two file inputs sharing the same ref
   breaks the avatar upload feature
4. **Fix the `/disputes` broken link** — Users with disputes get a 404
5. **Wire the chat navigation** — Tasks page doesn't redirect to chat

**What Z.ai should focus on first**:

- Review the codebase to confirm the architecture described here
- Help identify bugs and edge cases before features are built
- Assist with the notification wiring and avatar upload fix
- Review any new features for consistency with the existing patterns
- Catch scalability concerns, security issues, and accessibility gaps

**How Z.ai can best help the team succeed**:

- Be the architecture reviewer and quality gatekeeper
- Identify edge cases that the primary developer might miss
- Suggest improvements that make the codebase more maintainable
- Keep the vision focused on MVP goals (not feature creep)
- Document reasoning clearly so both humans and AI teammates understand

The codebase is substantial (40+ pages, 14 controllers, 13 services, 30+ UI
components) but follows consistent patterns. Read the file headers, check the
existing implementations before suggesting changes, and always ask: "Does this
match how the rest of the project does it?"

Welcome to the team, Z.ai. Let's ship this MVP.
