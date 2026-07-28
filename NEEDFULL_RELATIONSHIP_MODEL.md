# NeedFull — Poster ↔ NeedRunner Relationship Model

> **Version:** 1.0
> **Status:** Draft for Jo's approval
> **Scope:** MVP task lifecycle only (purchase tasks, NeedWork, etc. deferred)
> **Based on:** Codebase audit 2026-07-28

---

## Table of Contents

1. [User Journey — Complete Task Lifecycle](#1-user-journey)
2. [Relationship States](#2-relationship-states)
3. [Screen-by-Screen UI](#3-screen-by-screen-ui)
4. [Communication System](#4-communication-system)
5. [Payment Relationship](#5-payment-relationship)
6. [Trust System](#6-trust-system)
7. [Notifications](#7-notifications)
8. [Edge Cases](#8-edge-cases)
9. [Visual Timeline](#9-visual-timeline)
10. [Future-Proof Architecture](#10-future-proof-architecture)

---

## 1. User Journey

### 1.1 Complete Task Lifecycle (Full Fidelity)

```
PHASE 0 ─── PRE-TASK
  │
  ├── Poster funds wallet (manual deposit or card)
  ├── Runner sets availability online
  └── Runner browses available tasks
        │
        ▼
PHASE 1 ─── CREATION
  │
  ├── Poster creates task → wallet balance checked
  │     ├── Sufficient balance → escrow locked immediately
  │     └── Insufficient balance → prompt to fund wallet first
  ├── Task becomes visible in feed (status = "open")
  ├── System broadcasts: "New task in [category]" to eligible runners
  └── Runner discovers task via feed, search, or notification
        │
        ▼
PHASE 2 ─── APPLICATION
  │
  ├── Runner views task details (budget, location, deadline, description)
  ├── Runner applies with optional message + optional proposed price
  ├── Poster receives notification: "RunnerName applied to your task"
  ├── Poster reviews runner profile (trust score, completion rate, past reviews)
  ├── Poster actions:
  │     ├── Accept application → task moves to "in_progress"
  │     ├── Reject application → runner notified
  │     └── Counter-offer → runner can accept or decline
  └── On accept, all other pending applications auto-rejected
        │
        ▼
PHASE 3 ─── EXECUTION
  │
  ├── Task status = "in_progress", runner assigned
  ├── Chat between poster and runner becomes active
  ├── Runner progresses:
  │     ├── Standard task: runner completes work, marks as done
  │     └── Purchase task: runner moves through states (at_store → shopping → receipt_uploaded → heading_to_delivery → delivered)
  ├── Poster can track progress via:
  │     ├── Task status indicator
  │     ├── Chat with runner
  │     └── Status update timeline
  └── Runner can request clarification or extra budget via chat/counter
        │
        ▼
PHASE 4 ─── COMPLETION
  │
  ├── Runner marks task as complete (POST /tasks/:id/done)
  ├── Poster notified: "Task marked complete — confirm or report issue"
  ├── Poster confirms completion (POST /tasks/:id/complete)
  ├── Escrow released:
  │     ├── Runner receives budget - platform fee (10%)
  │     └── Platform fee recorded as earnings
  ├── Both parties prompted to rate each other
  ├── Trust scores recalculated via Bayesian average
  └── Task archived in both users' history
        │
        ▼
PHASE 5 ─── POST-TASK
  │
  ├── Rating window open (7 days)
  ├── Both users can edit their review within 24 hours
  ├── Unrated after 7 days → auto-closed, no default rating
  ├── Task appears in "Completed" tab for both users
  └── Chat remains accessible read-only for 30 days
```

### 1.2 MVP vs. Future Scope

| Step | MVP | Future |
|------|-----|--------|
| Wallet funding | Manual bank transfer only | Card (Paystack), Virtual accounts (Monnify) |
| Task discovery | Feed browsing + basic filters | Smart matching, push to available runners |
| Runner availability | Manual toggle | Auto-offline, schedule, location radius |
| Progress updates | Runner messages in chat | Live location sharing, photo updates, ETA |
| Completion | Poster confirms → escrow released | Auto-confirm after timer, OTP for physical delivery |
| Purchase tasks | Separate flow (MVP stretch) | Unified with regular tasks |

---

## 2. Relationship States

### 2.1 Full State Map — Task-Centric

The task is the atomic unit of the Poster↔NeedRunner relationship. Every state is a task status.

```
                  ┌─────────────┐
                  │   FUNDING   │ (poster has insufficient balance)
                  └──────┬──────┘
                         │ wallet funded
                         ▼
                  ┌─────────────┐
             ┌─── │    OPEN     │ ◄── Task created, escrow locked, visible in feed
             │    └──────┬──────┘
             │           │ runner applies
             │           ▼
             │    ┌──────────────┐
             │    │  APPLICANTS  │ (multiple runners can apply)
             │    └──────┬───────┘
             │           │ poster accepts one
             │           ▼
             │    ┌──────────────┐
             │    │ IN_PROGRESS  │ ◄── Runner assigned, escrow held
             │    └──────┬───────┘
             │           │ runner completes work
             │           ▼
             │    ┌──────────────┐
             │    │  COMPLETED   │ ◄── Runner marks done, awaiting poster confirmation
             │    └──────┬───────┘
             │           │ poster confirms
             │           ▼
             │    ┌──────────────┐
             │    │  COMPLETED   │ ◄── Escrow released, rating phase
             │    └──────┬───────┘
             │           │ (7-day rating window)
             │           ▼
             │    ┌──────────────┐
             └──► │   ARCHIVED   │
                  └──────────────┘

                  ┌──────────────┐
         CANCELLED │  (from open) │ ◄── No escrow impact (already locked though — needs refund)
                  └──────────────┘

                  ┌──────────────┐
         CANCELLED │ (in_progress)│ ◄── Escrow refunded to poster
                  └──────────────┘

                  ┌──────────────┐
          DISPUTED │              │ ◄── Requires admin intervention (MVP: manual only)
                  └──────────────┘
```

### 2.2 Per-State Detail

#### STATE: `funding` (pre-task gap)

| Aspect | Detail |
|--------|--------|
| **What it is** | Poster has insufficient balance to create task. ***Not currently implemented — task creation currently errors out if balance is insufficient.*** |
| **Poster sees** | "Insufficient balance" inline error + "Fund Wallet" CTA button. Task creation form stays filled in. |
| **Runner sees** | Nothing — task never created. |
| **Actions** | Fund wallet (manual/card). Task creation resumes from saved draft. |
| **Notifications** | None. |
| **UI** | Inline error banner below budget field. Wallet balance shown with callout. |

#### STATE: `open`

| Aspect | Detail |
|--------|--------|
| **What it is** | Task is live in the feed. Escrow locked. Poster waiting. |
| **Poster sees** | Task in "My Tasks → Posted" tab with badge "Awaiting Runners". Number of applicants visible. |
| **Runner sees** | Task in feed with budget, location, deadline. "Apply" CTA shown. |
| **Poster actions** | Cancel task (escrow refunded). View applicants. |
| **Runner actions** | Apply (with message + optional price). |
| **Poster notifications** | "New applicant" (per application). |
| **Runner notifications** | None (unless poster sends a counter-offer). |
| **UI changes** | Poster: See applicants list with accept/reject/counter buttons. Runner: "Applied" indicator if already applied. |

#### STATE: `in_progress`

| Aspect | Detail |
|--------|--------|
| **What it is** | Runner is actively working. Escrow held. |
| **Poster sees** | Task in "My Tasks → Active" tab. Runner profile card. Status indicator. Chat button. Complete button (poster confirms completion). |
| **Runner sees** | Task in "My Tasks → Active" tab. "Mark as Done" button. Chat button. |
| **Poster actions** | Cancel task (escrow refunded). Chat with runner. Mark as disputed (future). |
| **Runner actions** | Mark as done. Chat with poster. |
| **Poster notifications** | None (until runner marks done). |
| **Runner notifications** | None (passive state). |
| **UI** | Prominent active task card on both dashboards. Progress bar (manual chat-based or status-based for MVP). |

#### STATE: `awaiting_confirmation` (completion — runner done)

| Aspect | Detail |
|--------|--------|
| **What it is** | Runner marked task as done. Poster must confirm. ***MVP gap: no distinct "runner done" state exists. Runner cannot currently mark done; only poster can complete. This is a missing endpoint.*** |
| **Poster sees** | Task badge changes to "Confirm Completion". Timer visible (auto-confirm countdown if implemented). |
| **Runner sees** | "Awaiting poster confirmation" status. Waiting indicator. |
| **Poster actions** | Confirm (releases escrow). Report issue (triggers dispute, future). |
| **Runner actions** | None (waiting). Send chat message reminding poster. |
| **Poster notifications** | "RunnerName marked your task as complete — confirm now or raise an issue (24h)". |
| **Runner notifications** | "PosterName confirmed completion!" / "PosterName reported an issue". |
| **UI** | Poster sees confirmation CTA with countdown. Runner sees waiting state with spinner. |

#### STATE: `completed`

| Aspect | Detail |
|--------|--------|
| **What it is** | Task done. Escrow released. Rating open. |
| **Poster sees** | Task in "Completed" tab. Rate button next to runner name. Review comment form. |
| **Runner sees** | Task in "Completed" tab. Rate button next to poster name. Earnings amount shown. |
| **Actions** | Rate the other party (1-5 stars + optional comment). View the other party's rating of you (after both have rated). |
| **Notifications** | "Rate RunnerName — your feedback builds the community". |
| **UI** | Rating modal / inline form. After both rated: rating shown. Stars display. Review snippet visible. |

#### STATE: `cancelled`

| Aspect | Detail |
|--------|--------|
| **What it is** | Task cancelled before completion. Escrow refunded if `in_progress`. |
| **Poster sees** | Task in "Cancelled" tab (future) with reason. "Refunded" badge if applicable. |
| **Runner sees** | Task in "Cancelled" tab (future) with reason. |
| **Auto-reject** | If cancelled from `open`: all pending applications auto-rejected. If cancelled from `in_progress`: escrow refunded to poster. |
| **Notifications** | Both parties notified with reason (who cancelled, why). |

#### STATE: `disputed`

| Aspect | Detail |
|--------|--------|
| **What it is** | Escrow frozen. Admin intervention required. ***MVP: no dispute flow; mark as future.*** |
| **Both see** | "Task is under review — an admin will look into this within 24 hours". |
| **Actions** | Submit evidence (chat history is preserved). |
| **Notifications** | Admin notified. Both users notified of resolution. |

### 2.3 Purchase Task States (existing in code, separate flow)

The purchase task system (`purchase.service.ts`) has a richer state machine with 14 states (`accepted → at_store → shopping → receipt_uploaded → needs_budget_approval → heading_to_delivery → delivered → confirmed → completed`, plus `cancelled`, `disputed`, `refunded`, `expired`, `pending_payment`, `funded`). This is an existing implementation but is a **separate flow from regular tasks**. The relationship model should document the gap: purchase tasks have a more expressive state machine than regular tasks. Future work should either unify these or make regular tasks equally expressive.

---

## 3. Screen-by-Screen UI

### 3.1 Poster Screens

#### 3.1.1 Create Task

| Element | Detail |
|---------|--------|
| **Route** | `/tasks/create` (exists) |
| **Layout** | 3-step form: What (title, description, category, budget) → Where/When (location, deadline, urgent toggle) → Review (summary + create button) |
| **Primary CTA** | "Post Task & Lock Escrow" — creates task, locks escrow, redirects to task detail |
| **Secondary CTA** | "Save Draft" — persists locally |
| **Empty state** | N/A (form is never empty) |
| **Loading state** | Button shows spinner, fields disabled during submission |
| **Error state** | "Insufficient balance" banner if wallet < budget. "Network error" toast. |
| **Success state** | Redirect to `/tasks/[id]` with toast "Task posted! Waiting for runners." |
| **Note** | Budget input in naira, converted to kobo on submit. Fee breakdown shown: "You'll pay ₦X (₦Y fee included)" |

#### 3.1.2 Task Detail (Public / Feed)

| Element | Detail |
|---------|--------|
| **Route** | `/feed/[id]` (exists) |
| **Layout** | Title, description, budget, deadline, location, category badge, urgent badge. Poster avatar + name. Applicant count. |
| **Poster's own task** | Shows applicants tab (list of runners + accept/reject/counter buttons per app). |
| **Runner viewing** | Shows "Apply" CTA or "Applied" indicator. |
| **Empty state (no applicants)** | "No applicants yet. Share this task or wait for runners to discover it." |
| **Loading state** | Skeleton card. |
| **Error state** | "Task not found" with link back to feed. |

#### 3.1.3 Active Task (Poster View)

| Element | Detail |
|---------|--------|
| **Route** | `/tasks/[id]` (exists) |
| **Layout** | Task info header (status badge = "In Progress"). Runner profile card (name, trust score, completion rate, avatar). Live timeline. Chat entry point. |
| **Primary CTA** | "Mark as Complete" — when runner has indicated done. Disabled until runner marks done. |
| **Secondary CTA** | "Chat with Runner" — opens chat drawer/navigation. |
| **Empty state** | N/A — requires an assigned runner. |
| **Loading state** | Skeleton with runner card. |
| **Error state** | "Unable to load task details. Try again." |
| **Success state** | Full task info with real-time status indicator. |
| **Note** | ***MVP gap: no POST /tasks/:id/done endpoint exists for runner to mark completion. Poster can only see the task, chat, and cancel.*** |

#### 3.1.4 Rating (Poster Rates Runner)

| Element | Detail |
|---------|--------|
| **Route** | Inline in `/tasks/[id]` after completion, or `/tasks/[id]/rate` |
| **Layout** | Runner name + avatar. 5-star interactive input. Optional textarea for comment. |
| **Primary CTA** | "Submit Rating" |
| **Secondary CTA** | "Skip" — dismisses for 24 hours |
| **Empty state** | N/A |
| **Loading state** | Button spinner |
| **Error state** | "Failed to submit rating. Try again." |
| **Success state** | "Thank you! Your feedback builds trust." + revealed other party's rating (if both rated) |

#### 3.1.5 My Tasks (Poster)

| Element | Detail |
|---------|--------|
| **Route** | `/tasks` (exists with tabs) |
| **Layout** | Two tabs: "Posted" (open tasks) and "Active" (in_progress tasks). ***MVP gap: no "Completed" tab, no "Cancelled" tab.*** |
| **Empty state (Posted)** | "You haven't posted any tasks yet. Create your first task!" + CTA to `/tasks/create` |
| **Empty state (Active)** | "No active tasks. When a runner accepts your task, it will appear here." |
| **Card content** | Title, budget, status badge, applicant count (open), runner name + status (active), date |

### 3.2 Runner Screens

#### 3.2.1 Feed / Browse Tasks

| Element | Detail |
|---------|--------|
| **Route** | `/feed` (exists) |
| **Layout** | Search bar + filter chips (category, location, budget range, urgent). Task cards in vertical feed. |
| **Primary CTA** | Tap card → task detail |
| **Empty state** | "No tasks match your filters. Try expanding your search." + illustration |
| **Loading state** | Skeleton cards |
| **Error state** | "Couldn't load tasks. Pull to refresh." |
| **Note** | Tasks shown: status = "open", not own poster's tasks. Budget in naira. |

#### 3.2.2 Task Detail (Runner View)

| Element | Detail |
|---------|--------|
| **Route** | `/feed/[id]` (exists) |
| **Layout** | Full task description, budget, deadline, location, poster name, urgency badge |
| **Primary CTA** | "Apply" — opens application sheet |
| **Secondary CTA** | "Save" — bookmark for later (future) |
| **Applied state** | "Applied — waiting for poster's response." Cancel application button. |
| **In Progress state** | "You are working on this task." + "Mark as Done" CTA. |
| **Empty state** | N/A |
| **Loading state** | Skeleton |
| **Error state** | "Task not found or no longer available." |
| **Success state** | Full task details with apply flow |

#### 3.2.3 Application Sheet

| Element | Detail |
|---------|--------|
| **Route** | Modal/sheet on `/feed/[id]` |
| **Layout** | Task budget displayed. Optional message textarea. Optional proposed price input (defaults to task budget). |
| **Primary CTA** | "Submit Application" |
| **Secondary CTA** | "Cancel" |
| **Error state** | "You already applied to this task." / "Cannot apply to your own task." |
| **Success state** | Sheet closes. Task card shows "Applied" badge. Toast: "Application submitted!" |

#### 3.2.4 Active Task (Runner View)

| Element | Detail |
|---------|--------|
| **Route** | `/tasks/[id]` (exists) |
| **Layout** | Task details. Poster profile card. Chat button. Status updates. |
| **Primary CTA** | "Mark as Done" — sets task to awaiting_confirmation. ***MVP gap: endpoint doesn't exist.*** |
| **Secondary CTA** | "Chat with Poster" — opens chat. "Report Issue" — triggers dispute (future). |
| **Empty state** | N/A |
| **Loading state** | Skeleton |
| **Error state** | "Couldn't load task." |
| **Note** | Runner can see the agreed amount prominently. Time since started shown. |

#### 3.2.5 My Tasks (Runner)

| Element | Detail |
|---------|--------|
| **Route** | `/tasks` (exists with tabs) |
| **Layout** | Tabs: "Active" (in_progress) and "Completed" (completed). ***MVP gap: missing "Completed" tab.*** |
| **Empty state (Active)** | "You haven't taken any tasks yet. Browse the feed to find opportunities!" |
| **Card content** | Task title, budget (agreed amount), poster name, status badge |

### 3.3 Shared Screens

#### 3.3.1 Runner Dashboard

| Element | Detail |
|---------|--------|
| **Route** | `/tasks` (runner role active) — currently no custom dashboard route |
| **Layout** | Online toggle, stats cards (today's earnings, weekly earnings, acceptance rate, trust score), nearby tasks, performance card, activity feed |
| **Note** | Full of mock data (see Issue 3 diagnostic). Must be cleaned up. |

#### 3.3.2 Chat

| Element | Detail |
|---------|--------|
| **Route** | `/chat/[id]` (exists) |
| **Layout** | Message bubble list. Text input + send button. Typing indicator (future). |
| **Primary CTA** | Send message |
| **Empty state** | "Start a conversation" — first message placeholder |
| **Loading state** | Skeleton bubbles |
| **Error state** | "Couldn't load messages. Retry." |
| **Chat availability** | Only after task is in_progress (runner assigned). Chat disabled for open/cancelled/completed tasks (read-only after 30 days). |

---

## 4. Communication System

### 4.1 Chat Availability Matrix

| Task Status | Poster can chat | Runner can chat | Notes |
|-------------|----------------|-----------------|-------|
| `funding` | No | No | Task not created |
| `open` | No | No | ***Current code disables chat until runner assigned (task.service.ts:67). This is correct — prevents pre-acceptance negotiation outside the application system.*** |
| `in_progress` | Yes | Yes | Full bidirectional chat |
| `awaiting_confirmation` | Yes | Yes | Both can still communicate |
| `completed` | Read-only (30 days) | Read-only (30 days) | History preserved, no new messages |
| `cancelled` | Read-only (7 days) | Read-only (7 days) | History preserved briefly |
| `disputed` | Yes | Yes | Both must be able to submit evidence |

### 4.2 Chat Features per Phase

| Feature | MVP | Future |
|---------|-----|--------|
| Text messaging | ✅ | — |
| Read receipts | ✅ (implied by `is_read` column) | — |
| Image sharing | ❌ (no upload in chat) | ✅ |
| Quick reply suggestions | ❌ | ✅ "On my way!", "Almost done", "Please confirm" |
| Typing indicators | ❌ | ✅ via Socket.io |
| Location sharing | ❌ | ✅ Live tracking |
| Voice notes | ❌ | ✅ Async voice messages |
| Support escalation | ❌ | ✅ "Escalate to admin" button |
| Message edit/delete | ❌ | ✅ Edit within 5 min |
| Chat groups | ❌ | ✅ For multi-stop tasks (future) |

### 4.3 Communication Boundaries

**Allowed:**
- Task coordination (status updates, clarifying requirements)
- Location sharing during active task
- Payment confirmation messages

**Not allowed (system-enforced or community guidelines):**
- Off-platform contact sharing (phone, WhatsApp, Instagram)
- Harassment or abusive language
- Negotiating outside the application system
- Spam or unsolicited offers

**Reporting:** Both users can report a chat message. Reported messages are flagged for admin review (future).

---

## 5. Payment Relationship

### 5.1 Complete Payment Lifecycle

```
Poster creates task with budget ₦X
  │
  │  Wallet balance = ₦Y
  │  Does Y >= X?
  │   ├── YES → Escrow lock: Y - X, Escrow += X (escrow_lock transaction)
  │   └── NO → Blocked: "Please fund wallet" (no partial escrow)
  │
  ▼
Task is open. Escrow held = ₦X
  │
  ▼
Poster accepts Runner application (agreed amount = ₦A, possibly different from budget)
  │  No wallet change — budget already in escrow
  │  If agreed amount ≠ budget: additional lock or refund
  │
  ▼
Task is in_progress. Escrow held = ₦A
  │
  ▼
Runner marks done → Poster confirms
  │
  │  Platform fee = 10% of ₦A = ₦F
  │  Runner receives = ₦A - ₦F
  │
  ├── Runner wallet: balance += (₦A - ₦F)  (earnings transaction)
  ├── Poster wallet: escrow -= ₦A           (no change to balance — escrow removed)
  └── Platform fee recorded (platform_fee transaction)
  │
  ▼
Task completed. Funds settled.
```

### 5.2 Fee Structure

| Item | Rate | Notes |
|------|------|-------|
| Platform fee | 10% of task budget | Covers payment processing, escrow, support |
| Minimum fee | ₦50 | Floor for very small tasks |
| Maximum fee | ₦5,000 | Cap for large tasks |
| Runner payout | Budget - platform fee | Net amount credited to runner wallet |

### 5.3 Cancellation Refund

| Scenario | Refund | Who loses |
|----------|--------|-----------|
| Poster cancels from `open` | Full escrow refunded | No one (runner didn't start) |
| Poster cancels from `in_progress` | Full escrow refunded | Runner loses potential earnings (no compensation for work done — product decision needed) |
| Runner withdraws from `open` | N/A (escrow not yet locked per runner) | No one |
| Runner abandons `in_progress` | Escrow refunded to poster | Runner reputation damaged (trust score) |

**Product decision needed:** Should runner receive partial compensation if poster cancels after runner has started? Options:
1. No compensation (MVP) — simple, harsh
2. Poster forfeits a cancellation fee (e.g., 20% of budget to runner) — fairer, complex
3. Time-based: if runner has marked "started" (future status), fee applies

### 5.4 Dispute Resolution (Future)

| Scenario | Resolution |
|----------|------------|
| Both agree to cancel | Escrow refunded to poster |
| Runner claims work done, poster disagrees | Admin reviews chat + evidence, decides |
| Partial completion | Admin determines fair split |
| Fraud (runner didn't do work) | Escrow returned to poster, runner banned |
| Fraud (poster lying to get free work) | Escrow released to runner, poster penalized |

### 5.5 Transaction History Visibility

| Transaction | Poster sees | Runner sees | Admin sees |
|-------------|-------------|-------------|------------|
| Escrow lock | Debit entry | Not visible | Full detail |
| Escrow release | Credit (escrow removal) | Credit (earnings) | Full detail |
| Platform fee | Not shown (poster never pays extra beyond budget) | Deduction shown on payout | Full detail |
| Refund | Credit entry | Not visible | Full detail |

---

## 6. Trust System

### 6.1 Trust Score Components

```
Total Trust Score (0-100)
  │
  ├── Bayesian Rating (0-40 points)
  │     Calculated from 1-5 star reviews with a prior of 3.5 stars / 3 reviews
  │     Existing implementation in trust.service.ts:121-129
  │
  ├── Completion Rate (0-25 points)
  │     Completed tasks / (completed + cancelled) tasks
  │     ***Not yet implemented in trust.service.ts***
  │
  ├── Response Speed (0-15 points)
  │     Average time to respond to messages / accept applications
  │     ***Not yet implemented***
  │
  ├── Acceptance Rate (0-10 points)
  │     Accepted tasks / total applications (runner only)
  │     ***Not yet implemented***
  │
  └── Verification Bonus (0-10 points)
        Email verified (+3), Student ID verified (+5), Phone verified (+2)
        ***Partial: email_verified exists but not factored into trust score***
```

### 6.2 Trust Score Display

| Score Range | Label | Color | Badge |
|-------------|-------|-------|-------|
| 85-100 | Trusted | `green-700` | Shield with checkmark |
| 65-84 | Reliable | `green-600` | Shield |
| 45-64 | Building | `amber-600` | Star |
| 25-44 | New | `blue-600` | Leaf |
| 0-24 | At Risk | `red-700` | Warning triangle |

Display location: profile header, task detail (runner card), chat header, leaderboard (future).

### 6.3 Rating UI Contract

**After task completion:**
1. Both parties are prompted to rate (inline or modal)
2. Rating is 1-5 stars (integer) + optional text comment
3. Ratings are NOT revealed until both parties have rated, OR 7 days have passed (prevents retaliation ratings)
4. After both rated: both ratings visible, trust score recalculated
5. If not rated within 7 days: rating window closes, no penalty
6. Each review shows: stars, comment snippet, relative time ("2 weeks ago")

### 6.4 Trust Impact of Actions

| Action | Runner trust impact | Poster trust impact |
|--------|-------------------|-------------------|
| Complete task successfully | +Rating (0-40 pts) | +Rating (0-40 pts) |
| Cancel after acceptance | -10 pts | -5 pts |
| Abandon task in progress | -20 pts | N/A |
| Receive dispute | -15 pts (if at fault) | -15 pts (if at fault) |
| Verify student ID | +5 pts | +5 pts |
| Verify email | +3 pts | +3 pts |

---

## 7. Notifications

### 7.1 Complete Notification Catalog

Poster-notifications in **Bold**, Runner-notifications in *Italic*, Shared in `Code`.

| # | Trigger | Recipient | Title | Body | Priority | Deep Link |
|---|---------|-----------|-------|------|----------|-----------|
| 1 | Task created (escrow locked) | **Poster** | "Task Posted" | "Your task \"{title}\" is live. Waiting for runners." | Low | `/tasks/{taskId}` |
| 2 | New applicant | **Poster** | "New Application" | "{runnerName} applied to your task \"{title}\"" | High | `/tasks/{taskId}` |
| 3 | *Counter-offer received* | *Runner* | "Counter Offer" | *"{posterName} sent a counter-offer on \"{title}\""* | High | `/tasks/{taskId}` |
| 4 | *Application accepted* | *Runner* | "Application Accepted!" | *"You've been assigned to \"{title}\"! Chat with {posterName} to coordinate."* | High | `/tasks/{taskId}` |
| 5 | *Application rejected* | *Runner* | "Application Not Selected" | *"{posterName} chose another runner for \"{title}\"."* | Low | `/feed` |
| 6 | *Other apps auto-rejected* | *Runners* | "Task No Longer Available" | *"The task \"{title}\" has been assigned to another runner."* | Low | `/feed` |
| 7 | Runner marked done | **Poster** | "Task Marked Complete" | "{runnerName} says \"{title}\" is done. Confirm completion or report an issue." | High | `/tasks/{taskId}` |
| 8 | Poster confirmed completion | *Runner* | "Payment Released!" | *"{posterName} confirmed \"{title}\" is complete. ₦{amount} added to your wallet."* | High | `/wallet` |
| 9 | Task completed | **Poster** | "Task Complete" | "Thanks for using NeedFull! Rate {runnerName} to help the community." | Medium | `/tasks/{taskId}/rate` |
| 10 | Task cancelled (poster) | *Runner* | "Task Cancelled" | *"The task \"{title}\" has been cancelled by the poster."* | Medium | `/tasks` |
| 11 | Task cancelled (runner) | **Poster** | "Task Cancelled" | "Your task \"{title}\" has been cancelled by the runner." | Medium | `/tasks/{taskId}` |
| 12 | `Escrow refunded` | **Poster** | "Escrow Refunded" | "₦{amount} has been returned to your wallet for \"{title}\"." | Medium | `/wallet` |
| 13 | `New message` | Both | "New Message" | "{senderName}: {messagePreview}" | Medium | `/chat/{conversationId}` |
| 14 | `Review prompt` | Both | "How was your experience?" | "Rate your {taskPartner} for \"{title}\"" | Low | `/tasks/{taskId}/rate` |
| 15 | Wallet funded (manual confirmed) | User | "Deposit Confirmed" | "₦{amount} has been added to your wallet." | High | `/wallet` |
| 16 | Wallet funded (manual rejected) | User | "Deposit Rejected" | "Your deposit of ₦{amount} could not be verified. Contact support." | High | `/wallet/fund/manual` |
| 17 | Insufficient balance (task creation) | **Poster** | "Insufficient Balance" | "You need at least ₦{budget} to post \"{title}\". Fund your wallet to continue." | Medium | `/wallet/fund` |

### 7.2 Notification Delivery Channels

| Channel | MVP | Future |
|---------|-----|--------|
| In-app notification drawer | ✅ | — |
| Socket.io real-time push | ✅ | — |
| Email | ❌ (too expensive for MVP) | ✅ |
| SMS | ❌ | ✅ (for critical: payment received, dispute) |
| Push notification (mobile web) | ❌ | ✅ when PWA ready |

### 7.3 Notification Expiry / Cleanup

- Read notifications: archived after 30 days
- Unread notifications: never auto-deleted
- System notifications (deposit confirmed, etc.): kept 90 days
- Task-related notifications: kept as long as task exists

---

## 8. Edge Cases

### 8.1 Runner Cancels

| Scenario | System Behavior |
|----------|----------------|
| Before acceptance (withdraw application) | Status set to `withdrawn`. No escrow impact. Poster sees applicant removed from list. |
| After acceptance (runner cancels) | ***MVP gap: no "runner cancels from in_progress" endpoint exists.*** Proposed: runner calls `POST /tasks/:id/cancel`. Task goes to `cancelled`. Poster notified with reason. Escrow refunded to poster. Runner trust score penalized (-20 pts). Runner marked as having abandoned the task. |

### 8.2 Poster Cancels

| Scenario | System Behavior |
|----------|----------------|
| From `open` | Escrow refunded. All pending apps auto-rejected. No penalty (poster can cancel before runner starts). |
| From `in_progress` | Escrow refunded. Runner notified. ***Product decision: should poster pay a cancellation fee to runner?*** |

### 8.3 Runner Becomes Unreachable

| Scenario | System Behavior |
|----------|----------------|
| No response in chat for 12+ hours during `in_progress` | Poster can escalate to support. Evidence: chat inactivity. Admin can cancel task, refund escrow, penalize runner. ***MVP: manual admin action. Future: auto-escalation.*** |
| Runner stops responding after marking done | Poster can still confirm completion (if work is done) or dispute (if not done). |

### 8.4 Poster Becomes Unreachable

| Scenario | System Behavior |
|----------|----------------|
| Poster doesn't respond during `in_progress` | Runner can continue working. Chat available. If poster doesn't confirm completion after runner marks done: auto-confirm after 48 hours (if implemented). |
| Poster doesn't respond to counter-offer | Counter-offer expires after 48 hours. Status reverts to `pending`. |

### 8.5 Wrong Location / Wrong Task

| Scenario | System Behavior |
|----------|----------------|
| Runner arrives at wrong location | Chat to coordinate. Runner can mark location issue. If unable to complete: cancel with "wrong location" reason. |
| Poster provided incorrect details | Runner can request clarification in chat. If significantly different from agreed scope: cancel or negotiate new terms. Dispute if poster refuses. |

### 8.6 Insufficient Payment / Additional Purchase

| Scenario | System Behavior |
|----------|----------------|
| Runner needs extra funds for a purchase task | Purchase task flow handles this via `receipt_uploaded → needs_budget_approval` flow. Poster approves or rejects. |
| Runner wants more money for standard task | Runner can ask in chat. Poster can agree (no system mechanism — future: task amendment). Or runner can threaten cancellation (reputation hit). |

### 8.7 Task Expires

| Scenario | System Behavior |
|----------|----------------|
| Deadline passes while task is `open` | Auto-cancel task. Escrow refunded to poster. All pending apps auto-rejected. ***MVP gap: no deadline enforcement exists.*** |
| Deadline passes while task is `in_progress` | Soft warning to both parties: "Task deadline has passed. Please coordinate." Auto-extend by 24h (once). If still not resolved: dispute window opens. |

### 8.8 Multiple Runners Apply Simultaneously

| Scenario | System Behavior |
|----------|----------------|
| Two runners apply at the same millisecond | Application inserts are idempotent (duplicate check per runner-task pair). Both get `pending`. Poster chooses. |
| Two runners apply and poster accepts one | Other pending apps auto-rejected. No race condition — DB transaction handles this (application.service.ts:152 within `withTransaction`). |

### 8.9 Payment Failure

| Scenario | System Behavior |
|----------|----------------|
| Wallet balance insufficient at task creation | Error: "Insufficient balance." Task not created. Form preserved. |
| Escrow lock fails mid-creation | Transaction rollback (task.service.ts uses `withTransaction`). User sees error toast. |
| Escrow release fails | Already in transaction. Rollback. No funds lost. Retry: manual admin action for now. |

### 8.10 Dispute Initiated (Future)

| Scenario | System Behavior |
|----------|----------------|
| Poster reports issue | Task moves to `disputed`. Escrow frozen. Both submit evidence. Admin decides. Resolution: refund poster OR release to runner. |
| Runner reports issue | Same flow. |
| Admin resolves | Winner gets escrow (or split). Loser can appeal (future). |

### 8.11 Emergency Support

| Scenario | System Behavior |
|----------|----------------|
| User reports safety concern | Dedicated "Safety" report button (future). For MVP: support email. |
| Runner or poster feels threatened | Immediate admin notification. User can block the other party (future). |

---

## 9. Visual Timeline

### 9.1 Complete Flow Diagram

```
POSTER                           SYSTEM                           RUNNER
  │                                │                                │
  │  Create Task                    │                                │
  ├─── POST /tasks ───────────────► │                                │
  │                                ├── Check wallet balance          │
  │                                ├── Lock escrow                   │
  │                                ├── INSERT task (status=open)    │
  │                                ├── Notify nearby runners ───────►│
  │                                │                                │
  │  ◄──── Task Created ──────────┤                                │
  │       "Waiting for runners"    │                                │
  │                                │                                ├── Browse feed
  │                                │                                ├── View task detail
  │                                │                                │
  │  ◄── New Application ─────────┤  ◄── POST /applications ────────┤
  │       Review applicant         │                                │
  │                                │                                │
  │  ├── Accept ──────────────────►│  Application Accepted ────────►│──► Assigned!
  │  │  POST /applications/:id/    │  ├── Lock escrow (adjust)      │
  │  │  accept                    │  ├── UPDATE task status         │
  │  │                            │  │   = in_progress              │
  │  │                            │  ├── Assign runner              │
  │  │                            │  ├── Reject other apps          │
  │  │                            │  └── Create conversation        │
  │  ├── Reject ──────────────────►│  Application Rejected ────────►│──► Notified
  │  └── Counter ─────────────────►│  Counter Offer ───────────────►│──► Accept/Decline
  │                                │                                │
  │                                │                                │
  │  ◄── "Runner is working" ─────┤  ◄── Task in progress ─────────┤──► Works on task
  │                                │                                │
  │                                │                                ├── POST /tasks/:id/done
  │                                │                                │   (MVP gap)
  │  ◄── "Runner marked done" ────┤  ◄── Task awaiting_confirmation │
  │       Confirm?                 │                                │
  │                                │                                │
  │  ├── Confirm ─────────────────►│  ├── Release escrow           │
  │  │  POST /tasks/:id/complete   │  ├── Deduct platform fee       │
  │  │                            │  ├── UPDATE task = completed    │
  │  │                            │  ├── Credit runner wallet ─────►│──► Funds received
  │  │                            │  ├── Notify both to rate        │
  │  │                            │  └── Recalculate trust          │
  │  ├── Report Issue ───────────►│  ├── Dispute initiated          │
  │  └── (Do nothing for 48h) ───►│  └── Auto-confirm (future)      │
  │                                │                                │
  │  ├── Rate runner ─────────────►│  ◄── Rate poster ──────────────┤
  │  │                            │                                │
  │  ▼                            ▼                                ▼
│  Both rated / 7 days passed                                  │
│  Task fully archived                                          │
```

### 9.2 UI States Timeline (for both users)

```
Poster sees:                                          Runner sees:
┌────────────┐                                         ┌────────────┐
│ CREATE     │  (form)                                 │ FEED       │  (browse)
│ TASK       │                                         │            │
└─────┬──────┘                                         └─────┬──────┘
      │                                                      │
      ▼                                                      ▼
┌────────────┐                                         ┌────────────┐
│ WAITING    │  "Awaiting runners"                      │ BROWSE     │  Task detail
│ (posted)   │  Applicant count: 0                       │ + APPLY    │  "Apply" button
└─────┬──────┘                                         └─────┬──────┘
      │ applicant arrives                                    │
      ▼                                                      ▼
┌────────────┐                                         ┌────────────┐
│ REVIEW     │  Applicant card with profile             │ APPLIED    │  "Application submitted"
│ APPLICANT  │  Accept / Reject / Counter                │            │
└─────┬──────┘                                         └─────┬──────┘
      │ accept                                               │ accepted
      ▼                                                      ▼
┌────────────┐                                         ┌────────────┐
│ ACTIVE     │  "In progress"                           │ ACTIVE     │  "In progress"
│ TASK       │  Runner profile, Chat button             │ TASK       │  Poster profile, Chat
│ (poster)   │  "Chat with Runner"                       │ (runner)   │  "Mark as Done"
└─────┬──────┘                                         └─────┬──────┘
      │ runner marks done                                  │
      ▼                                                      ▼
┌────────────┐                                         ┌────────────┐
│ CONFIRM    │  "Runner completed — confirm?"           │ WAITING    │  "Awaiting confirmation"
│ COMPLETION │  Confirm / Report Issue                  │            │
└─────┬──────┘                                         └─────┬──────┘
      │ confirm                                              │ confirmed
      ▼                                                      ▼
┌────────────┐                                         ┌────────────┐
│ COMPLETED  │  "Task complete — rate runner"           │ COMPLETED  │  "Payment received!
│ + RATE     │                                          │ + RATE     │   Rate poster"
└────────────┘                                         └────────────┘
```

---

## 10. Future-Proof Architecture

### 10.1 Design Principles

1. **Task is the atomic unit** — Every relationship state is a task status. New task types inherit the same state machine.
2. **Separation of concerns** — Task lifecycle (status, assignee) is separate from payment lifecycle (escrow, release) which is separate from trust lifecycle (reviews, scoring).
3. **Extensible state machine** — New statuses can be inserted between existing ones without breaking transitions.
4. **Role-agnostic foundation** — The same schema supports Poster↔Runner, Buyer↔Seller, and future role pairs.

### 10.2 Feature Readiness Matrix

| Future Feature | What changes | Effort | Dependency |
|---------------|-------------|--------|------------|
| **Multi-stop errands** | Task gets ordered subtasks. Each subtask has its own location and status. Runner marks each subtask complete. | Medium | Task schema change (`subtasks` table or JSONB) |
| **Scheduled tasks** | Task gets `scheduled_start` + `scheduled_end`. Task auto-transitions from `scheduled` → `open` at the right time. | Low | Add `scheduled` status. Timer/ cron job. |
| **Recurring tasks** | Task template with `interval` (daily/weekly/monthly). System clones task after completion. | Medium | New `task_templates` table. Clone logic. |
| **Group/team tasks** | Multiple runners assigned to one task. Escrow split. | High | Schema: `task_assignees` table (many-to-many). Split payment logic. |
| **Business accounts** | Organizations can post tasks. Multiple org members manage tasks. | High | New `organizations` table. RLS policies. Role hierarchy. |
| **NeedWork (services/digital)** | Task category changes scope but not state machine. Digital delivery (file upload) vs physical delivery. | Low | File upload field. Same status flow. |
| **AI Assistant** | Chatbot helps runner with common questions. Suggest replies. Auto-categorize tasks. | Medium | New service. No schema change. |
| **Live tracking** | Runner shares GPS during active task. Poster sees ETA. | Medium | Socket.io location events. Map UI. Privacy: opt-in per task. |
| **Wallet upgrades** | Savings goals, payout scheduling, instant withdrawal (fee). | Low-Medium | Extension of existing wallet service. |
| **Loyalty / referral** | Credits for referring friends. Redeemable for fee discounts. | Medium | New `referrals` table. Credit system (separate from kobo balance). |
| **Subscription plans** | Free tier (basic) vs Premium (lower fees, priority matching). | High | Subscription table. Fee calculation switch. |

### 10.3 Schema Evolution Path

**Current schema:**
```
tasks (poster_id, assigned_to, status, budget_kobo, ...)
applications (task_id, runner_id, status, proposed_amount, ...)
reviews (task_id, reviewer_id, reviewee_id, rating, ...)
```

**Future schema (extensible):**
```
tasks (same + scheduled_start, scheduled_end, is_recurring, template_id)
task_assignees (task_id, runner_id, status, share_pct)
subtasks (task_id, title, location, status, order)
purchase_tasks (already exists — needs unification)
task_status_history (task_id, from_status, to_status, changed_by, timestamp)
```

### 10.4 What to Build Now (MVP) vs. Later

**Build now:**
- Complete the 4 missing task statuses (`awaiting_confirmation`, `disputed`, `archived`, `expired`)
- `POST /tasks/:id/done` endpoint for runner
- `Auto-reject` applications on timer (deadline passes)
- Remove all mock data from RunnerDashboard
- Wire "Go Online" toggle to actual presence logic

**Build after MVP (Phase 2):**
- Dispute flow with admin panel
- Purchase task status visibility in regular task UI
- Auto-confirm after 48h timeout
- Leaderboard (real data, not fake)
- Runner cancellation from `in_progress`
- Notification preferences (mute per type)

**Future (Phase 3+):**
- AI assistant / smart matching
- Live location tracking
- Multi-stop / scheduled / recurring tasks
- Business accounts

---

## Open Product Decisions (for Jo)

### Decision 1: Runner's "Mark as Done" Endpoint

Does the runner have the ability to mark a task as complete, triggering the `awaiting_confirmation` state? Or does only the poster confirm completion?

- **Option A (recommended):** Runner marks done → Poster confirms → Escrow released. This gives both parties agency and creates a clear audit trail.
- **Option B:** Only poster can complete. Runner must ask in chat. Simple but no accountability for runner.

### Decision 2: Poster Cancellation Penalty

If poster cancels while the task is `in_progress` (runner has started working), should the runner receive partial compensation?

- **Option A (MVP):** No compensation. Runner loses potential earnings. Simple, but unfair.
- **Option B:** Poster forfeits 20% of budget to runner as cancellation fee.
- **Option C:** Time-based: if runner has been working > 1 hour, fee applies.

### Decision 3: Auto-Confirm Timeout

If poster doesn't confirm completion after runner marks done, should the system auto-confirm?

- **Option A:** No auto-confirm. Escrow stays locked until poster confirms. Runner may wait indefinitely. Pressures poster to act.
- **Option B (recommended):** Auto-confirm after 48 hours of inactivity. Escrow released. Runner gets paid. Poster can still dispute after.
- **Option C:** Auto-confirm after 24 hours. Faster payout, but less time for poster to verify.

### Decision 4: Mock Data Removal

Should the social-proof sections (Leaderboard, Hot Zones, Challenges) be hidden entirely until there's a real backend endpoint, or replaced with empty-state cards?

- **Option A (recommended):** Remove entirely. No empty cards. Sections simply don't render. Backend endpoints built later.
- **Option B:** Show empty-state cards with value-prop content. "No runners yet — be the first!"

### Decision 5: Runner Availability Privacy

Should runner availability (online/offline) be visible to all posters, or only to those with an active task relationship?

- **Option A (fastest):** Visible to all posters in the "Available Runners Nearby" list. Risk: stalking via status polling.
- **Option B:** Visible only to posters who have an accepted application or active task with the runner. Safer.
- **Option C (recommended):** Visible to all posters but with privacy controls: runner can set "show to everyone," "show to task partners only," or "invisible."

---

---

## Appendix A: Admin Dimension — Poster ↔ Runner ↔ Admin

The Admin is the **trust anchor** of the platform. Admin does not participate in tasks but enforces the rules when the Poster↔Runner relationship breaks down.

### A.1 Admin's Role in the Task Lifecycle

```
POSTER ──create──► ESCROW ──accept──► RUNNER ──complete──► COMPLETED
                    ▲                                        │
                    │                                        │ dispute
                    │                                        ▼
                    │                                    ADMIN
                    │                                   │     │
                    └───────── refund ──────────────────┘     │
                                                              │ resolve
                                                              ▼
                                                     DISPUTE RESOLVED
                                                     (winner gets escrow)
```

**Admin is NOT involved in:**
- Task creation, discovery, application, or acceptance
- Chat between poster and runner
- Escrow lock/release during normal flow
- Rating and review process

**Admin IS involved in:**
- Confirming manual deposits (financial integrity)
- Verifying student IDs (identity trust)
- Cancelling tasks when both parties can't resolve (moderation)
- Resolving disputes (when trust breaks down)
- Banning bad actors (reputation enforcement)
- Reviewing runner applications (quality gate)

### A.2 Admin Screens (Existing)

| Route | Purpose | Status |
|-------|---------|--------|
| `GET /admin/stats` | Dashboard: total users, tasks, deposits, disputes, revenue | ✅ Implemented |
| `GET /admin/users` | List users with filters (role, verified, banned, runner) | ✅ Implemented |
| `POST /admin/users/:id/ban` | Ban a user | ✅ Implemented |
| `POST /admin/users/:id/unban` | Unban a user | ✅ Implemented |
| `GET /admin/verifications` | List student ID verification requests | ✅ Implemented |
| `POST /admin/verifications/:id` | Approve/reject student ID verification | ✅ Implemented |
| `GET /admin/deposits` | List manual deposit requests | ✅ Implemented |
| `POST /admin/deposits/:id/confirm` | Confirm manual deposit (credits wallet) | ✅ Implemented |
| `POST /admin/deposits/:id/reject` | Reject manual deposit | ✅ Implemented |
| `GET /admin/withdrawals` | List withdrawal requests | ✅ Implemented |
| `POST /admin/withdrawals/:id/process` | Process a withdrawal | ✅ Implemented |
| `GET /admin/tasks` | List all tasks with status filter (including `disputed`) | ✅ Implemented |
| `POST /admin/tasks/:id/cancel` | Cancel any task, refund escrow if in_progress | ✅ Implemented |
| `GET /admin/runner-applications` | List runner applications | ✅ Implemented |
| `POST /admin/runner-applications/:id/review` | Approve/reject runner application | ✅ Implemented |
| `GET /admin/transactions` | List all platform transactions with filters | ✅ Implemented |
| `GET /admin/reports` | List user reports | ✅ Implemented |
| `POST /admin/reports/:id/resolve` | Resolve/dismiss a report | ✅ Implemented |
| `GET /admin/purchase/disputes` | List purchase task disputes | ✅ Implemented |
| `POST /admin/purchase/disputes/:id/resolve` | Resolve purchase dispute with evidence | ✅ Implemented |

### A.3 Admin Powers Per Task State

| State | Admin Can |
|-------|-----------|
| `open` | Cancel (refund escrow). Notified if dispute filed. |
| `in_progress` | Cancel (refund escrow). Intervene if one party is unreachable. |
| `awaiting_confirmation` | Force-complete or force-cancel if one party is unresponsive. ***MVP gap: no force-complete endpoint.*** |
| `completed` | Re-open for dispute (if fraud reported post-completion). Reverse escrow if fraud proven. ***MVP gap: no post-completion reversal flow.*** |
| `cancelled` | Re-open (unlikely — mostly historical). |
| `disputed` | Review evidence. Decide winner. Release escrow accordingly. ***MVP gap: no dispute flow for regular tasks.*** |

### A.4 Dispute Flow (for Regular Tasks — MVP Gap)

Currently, dispute handling exists only for purchase tasks (`purchase.service.ts`). Regular tasks need the same:

```
User clicks "Report Issue" on completed/in_progress task
  │
  ├── Task status → "disputed"
  ├── Escrow frozen (cannot be released or refunded)
  ├── Both parties notified: "A dispute has been opened"
  │
  ▼
Admin reviews dispute in admin panel
  │
  ├── Admin sees: task details, chat history, both parties' statements
  ├── Admin actions:
  │     ├── Release escrow to runner (runner was right)
  │     ├── Refund escrow to poster (poster was right)
  │     ├── Split escrow (both partially at fault) — future
  │     └── Dismiss dispute (no action, un-freeze escrow)
  │
  ▼
Resolution notified to both parties
  │
  ├── Trust score adjusted:
  │     ├── At-fault party: -15 to -25 points
  │     ├── Wronged party: +5 points (compensation)
  │     └── False reporter: -10 points (if dispute was frivolous)
  └── Task moved to `completed` or `cancelled` based on resolution
```

**Schema needed for regular task disputes:**
```sql
CREATE TABLE task_disputes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id),
  opened_by   UUID NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',  -- open | under_review | resolved
  resolution  TEXT,          -- winner: "poster" | "runner" | "split"
  admin_id    UUID REFERENCES users(id),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_dispute_evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id    UUID NOT NULL REFERENCES task_disputes(id),
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  file_url      TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### A.5 Admin Notification Types

| # | Trigger | Recipient | Title | Body | Priority |
|---|---------|-----------|-------|------|----------|
| A1 | Dispute opened | **Admin** | "New Dispute" | "Dispute filed on task \"{title}\" by {userName}. Reason: {reason}" | High |
| A2 | Dispute resolved | Both parties | "Dispute Resolved" | "The admin has resolved the dispute on \"{title}\". {outcome}" | High |
| A3 | User reported | **Admin** | "New Report" | "{reporterName} reported {reportedName}: {reason}" | Medium |
| A4 | Runner application pending | **Admin** | "New Runner Application" | "{userName} wants to become a NeedRunner" | Low |
| A5 | Large withdrawal requested | **Admin** | "Large Withdrawal" | "{userName} requested ₦{amount} withdrawal" | Low |
| A6 | User banned/unbanned | User | "Account {action}" | "Your account has been {banned/unbanned} by an administrator." | High |

### A.6 Admin ↔ Regular Task Dispute: Database Design (Proposed)

Add to existing schema rather than creating new tables (reuse purchase dispute infrastructure or create parallel tables):

**Option A (reuse):** Add `task_type` column to `purchase_disputes` to distinguish regular vs purchase tasks. Rename table to `task_disputes`. More refactoring but cleaner long-term.

**Option B (parallel, recommended for MVP):** Create new `task_disputes` and `task_dispute_evidence` tables (schema in A.4). Keep purchase disputes unchanged. Higher initial work but zero regression risk against existing purchase flow.

**Recommendation: Option B**, then unify in Phase 2.

### A.7 Admin Trust Score Override Powers

Admin should have the ability to manually adjust trust scores in exceptional cases:

| Scenario | Admin Action |
|----------|-------------|
| False negative review (malicious rating) | Remove the review, recalculate trust score |
| User was hacked / account compromised | Reset trust score to pre-incident level |
| Wrongful dispute resolution (admin error) | Compensate with fixed trust score bonus |
| Verified good actor (long history, no issues) | Manual trust score boost (rare, for special cases) |

***Note: Trust score override is not implemented and should be a Phase 2 feature.***

### A.8 Admin Audit Log

Every admin action should be logged. Currently `logAudit()` is called in purchase service but not consistently elsewhere. All admin routes should call:

```typescript
await logAudit(entityId, action, adminId, { details });
```

Logged events:
- Task cancelled by admin
- Dispute resolved
- User banned/unbanned
- Deposit confirmed/rejected
- Verification approved/rejected
- Runner application reviewed
- Trust score manually adjusted (future)

---

## Appendix B: Implementation Gap Analysis (Codebase Audit vs. Model)

### B.1 Implemented ✅

| Feature | Where | Status |
|---------|-------|--------|
| Task creation with escrow lock | `task.service.ts:406-428` | ✅ |
| Application: apply | `application.service.ts:35` | ✅ |
| Application: accept → task in_progress + escrow | `application.service.ts:152` | ✅ |
| Application: reject | `application.service.ts:217` | ✅ |
| Application: counter-offer | `application.service.ts:256` | ✅ |
| Application: accept counter | `application.service.ts:308` | ✅ |
| Application: withdraw | `application.service.ts:112` (controller) | ✅ |
| Auto-reject other apps on accept | `application.service.ts:186` | ✅ |
| Task cancel (poster/admin) + escrow refund | `task.service.ts:564-618` | ✅ |
| Task complete (poster confirms) + escrow release | `task.service.ts:622-676` | ✅ |
| Cron: expire open tasks past deadline | `cron.ts:11-41` | ✅ |
| Chat after runner assigned | `task.service.ts:67` | ✅ |
| Reviews (create/get) | `reviews.controller.ts` | ✅ |
| Trust score (Bayesian rating) | `trust.service.ts:121-129` | ✅ |
| Notification system (20+ types) | `notification.service.ts` | ✅ |
| Admin: list all admin routes | `admin.routes.ts` | ✅ |
| Admin: cancel any task + refund | `admin.controller.ts:406-430` | ✅ |
| Admin: dispute management (purchase only) | `purchase.service.ts:639-821` | ✅ |
| Purchase task state machine (14 states) | `purchase.service.ts` | ✅ |
| Task capabilities API | `task.service.ts:41-70` | ✅ |
| GET /auth/me (user + wallet) | `authController.ts:492-545` | ✅ |
| My Tasks page (Posted + Accepted tabs) | `frontend: tasks/page.tsx` | ✅ |
| Status badges: open, in_progress, completed, cancelled, disputed | `frontend: tasks/page.tsx:60-91` | ✅ |
| Manual deposit flow (fund → confirm/reject) | `wallet.controller.ts`, `admin.controller.ts` | ✅ |
| Student ID verification flow | `admin.controller.ts` | ✅ |
| User ban/unban | `admin.controller.ts` | ✅ |
| Runner application review | `admin.controller.ts` | ✅ |
| Withdrawal processing | `admin.controller.ts` | ✅ |

### B.2 MVP Gaps ❌

| # | Feature | Expected State | Current State | Impact |
|---|---------|---------------|---------------|--------|
| 1 | **Runner "Mark as Done" endpoint** | `awaiting_confirmation` state. Runner calls `POST /tasks/:id/done`. Task shows "awaiting confirmation" badge. Poster sees confirm CTA. | No endpoint exists. `getTaskCapabilities` has no `canMarkAsDone`. Only poster can complete. | Runner has no agency to signal completion. Work is complete but runner must wait for poster to independently confirm. |
| 2 | **Runner cancellation from `in_progress`** | Runner can cancel accepted task (with trust penalty). Poster notified. | `cancelTask()` (task.service.ts:564) restricts to `task.poster_id !== userId && userRole !== "admin"`. Runner cannot cancel after acceptance. | If runner abandons task, poster has no way to get a new runner without cancelling themselves (which they shouldn't have to do). |
| 3 | **Auto-confirm timeout** | After runner marks done, if poster doesn't act within N hours, system auto-confirms and releases escrow. | No timer. No auto-confirm logic. | Runner may wait indefinitely for an unresponsive poster to confirm. Escrow stays locked. |
| 4 | **Dispute flow for regular tasks** | Poster or runner can open dispute on any in_progress/completed task. Admin reviews evidence, decides escrow destination. | Dispute exists only for purchase tasks (`purchase.service.ts:639`). Regular tasks have no dispute schema or endpoints. | If a regular task goes wrong, there's no formal resolution path. Only option is admin-cancel (which refunds poster regardless of who was at fault). |
| 5 | **Full trust score formula** | Formula includes: Bayesian rating (40pts) + completion rate (25pts) + response speed (15pts) + acceptance rate (10pts) + verification bonuses (10pts) = 100. | Only Bayesian rating implemented (trust.service.ts:121-129). Other factors queried but not scored. | Trust score is ~40% of what it could be. A user with 0 tasks can have the same score as a user with 50 perfect reviews (since Bayesian prior defaults to 3.5/5). |
| 6 | **Funding/pre-task UX** | "Insufficient balance" inline error. "Fund Wallet" CTA. Draft saved. | Backend returns 400 error. Frontend shows generic error toast. No draft. | Poor UX. Poster fills out entire task form only to be blocked by a late-stage error. |
| 7 | **Mock social-proof data** | Real data from backend or empty state. | HotZones, Leaderboard, Challenges, mockRating, mockStreak, ACTIVITIES_MOCK all hardcoded. | Fabricated social proof undermines trust — the platform's core value prop. |
| 8 | **Go Online toggle frontend wiring** | Toggle initializes from `user.isAvailable`, persists across page loads. | `useState(false)` — always starts offline. Backend `PATCH /users/me/available` works on click but resets on reload. | Toggle is functionally useless — user must re-toggle every page load. |
| 9 | **`isAvailable` in auth/me** | `GET /auth/me` returns `isAvailable`. `AuthUser` type includes it. | Neither backend response nor frontend type includes `isAvailable`. | Root cause of Gap #8. Toggle can never read server state. |
| 10 | **Runner "active" filter on task list** | `GET /tasks/me/assigned` returns only `in_progress` tasks. | Assigned endpoint exists. Frontend "Accepted" tab shows all assigned tasks. | Works for MVP but "Active" and "Completed" should be separate tabs for runners (like poster view has filters). |

### B.3 Priority Order for Implementation

Based on the model document and gap analysis, the build order should be:

**Phase 1 — Trust & Honesty (fastest, highest trust impact)**
1. Remove all mock social-proof data (Gap #7)
2. Wire `isAvailable` through auth/me and toggle initialization (Gaps #8, #9)
3. Add runner "Mark as Done" endpoint + `awaiting_confirmation` state (Gap #1)

**Phase 2 — Fairness & Resolution**
4. Runner cancellation from `in_progress` (Gap #2)
5. Dispute flow for regular tasks (Gap #4)
6. Auto-confirm timeout (Gap #3)

**Phase 3 — Trust Score & UX**
7. Complete trust score formula (Gap #5)
8. Funding/pre-task UX improvement (Gap #6)
9. Runner active/completed tab separation (Gap #10)

---

*End of Relationship Model Document + Admin Dimension + Gap Audit. Ready for Jo's review and approval.*
