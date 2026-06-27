NeedFull — Project Context Brief

Read this file at the start of every development session.

What NeedFull Is

NeedFull is a campus economy platform for Nigerian university students.

THE ONE PROBLEM WE SOLVE:
"A student needs help with a campus task right now. Another student
wants to earn money. Neither trusts the other enough to hand over cash.
NeedFull is the trusted middleman."

Company Positioning

NeedFull is a COMPANY — not a campus-specific product.
We are currently live at FUOYE (Federal University Oye-Ekiti) as our
pilot campus. We will expand to other Nigerian universities in 2026.

FUOYE is our starting point. It is NOT our identity.
The brand, code, and copy must work for any Nigerian university campus.

User Roles


Seeker  → posts a task, funds wallet, pays via escrow
Agent   → applies to tasks, completes them, earns money
Any user can be both Seeker and Agent simultaneously
Admin   → confirms manual deposits, bans bad users


Tech Stack (do not change)

Backend:   Node.js + Express.js + TypeScript
Frontend:  Next.js 14 + React + TypeScript + Tailwind CSS
Database:  PostgreSQL on Supabase
Realtime:  Socket.io
Payments:  Manual bank transfer (free, primary method)
Paystack (card payment, secondary)
Images:    Cloudinary
Hosting:   Backend → Render · Frontend → Vercel

Money Rules (NEVER break these)


All amounts stored in KOBO (integers). Never naira floats.
Every wallet operation uses SELECT FOR UPDATE (row locking)
Every wallet change has a matching wallet_transactions log entry
Escrow is a SEPARATE column — never mixed with spendable balance
Idempotency keys on all deposit endpoints (prevents double-crediting)
wallet.service.ts is the ONLY file allowed to modify wallet balances


Brand

Primary green:  #1A6B4A
Accent gold:    #EAA325  (CTAs, urgent badges, key interactions ONLY)
Tagline:        "Your campus. Your hustle. Real money."
Mobile-first.   Optimised for 3G and low-end Android devices.

MVP Scope (build ONLY these)

✅ Register, login, email verification
✅ User profile (name, bio, school, department, hostel, avatar)
✅ Post a task (title, description, budget, category, location)
✅ Task feed and discovery (browse, filter, sort)
✅ Apply to a task, accept or reject applications
✅ Escrow lock when application accepted
✅ Real-time chat via Socket.io
✅ Confirm task complete → escrow releases to Agent
✅ Star rating after completion
✅ Wallet with balance display
✅ Manual bank transfer (free funding)
✅ Admin: confirm/reject manual deposits, ban users
✅ In-app notifications
✅ My Tasks page
✅ Basic public profile page
✅ Availability toggle

NOT in MVP (do not build)

❌ Virtual accounts (Monnify)
❌ Card payments (Paystack)
❌ NIN verification
❌ Complex trust score algorithms
❌ Smart matching / push notifications
❌ Loyalty credits or referral system
❌ Explore / coming soon pages
❌ PWA / offline support
❌ Cron jobs
❌ Full admin dashboard (10+ pages)
