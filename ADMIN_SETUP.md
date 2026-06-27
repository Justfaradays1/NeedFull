# NeedFull Admin Dashboard

## Overview

The admin dashboard is a password-protected portal for platform moderation. It is **already implemented** — both frontend (Next.js) and backend (Express) are fully built with role-based access control.

---

## Accessing the Dashboard

### URL

```
http://localhost:3000/admin
```

You must be **logged in** and your account must have `role = 'admin'` in the database. Non-admin users who try to access `/admin` are redirected to `/feed`.

### What You'll See

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Stat cards, pending-action alerts, quick nav |
| Users | `/admin/users` | Search, filter, ban/unban, expand user details |
| Deposits | `/admin/deposits` | Confirm/reject manual bank transfers |
| Withdrawals | `/admin/withdrawals` | Process pending withdrawals |
| Verifications | `/admin/verifications` | Approve/reject student ID uploads |
| Tasks | `/admin/tasks` | View all tasks, cancel any task |
| Reports | `/admin/reports` | Resolve/dismiss user reports |
| Transactions | `/admin/transactions` | View all wallet transactions |

---

## Promoting a User to Admin

There is **no "Promote to Admin" button** in the UI for security reasons. You must use SQL directly.

### Via Supabase SQL Editor

1. Log in to your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Run the following query (replace the email):

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'you@university.edu.ng'
RETURNING id, email, role;
```

4. The user must **log out and log back in** for the new role to take effect (the role is stored in the JWT token, which is issued at login).

### Via psql (CLI)

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@university.edu.ng';
```

---

## How Route Protection Works

### Backend

All admin API routes are mounted at `/api/admin/*`. They are protected by two middleware layers (defined in `src/middleware/auth.ts`):

1. **`authenticate`** — Verifies the JWT access token from the `Authorization: Bearer <token>` header. Returns 401 if missing/expired.
2. **`requireRole("admin")`** — Checks that the decoded JWT payload contains `role: "admin"`. Returns 403 if not.

This is applied globally in `src/routes/admin.routes.ts`:

```ts
const router = Router();
router.use(authenticate, requireRole("admin"));
```

### Frontend

Each admin page has a client-side guard that runs on mount:

```tsx
useEffect(() => {
  if (!isAuthenticated) { router.push('/login'); return; }
  if (!isAdmin) { router.push('/feed'); return; }
}, [isAuthenticated, isAdmin, router]);
```

Additionally, the parent layout's `AuthGuard` prevents rendering if not authenticated.

**There is no middleware file (`src/middleware.ts`)** — protection is entirely client-side. The backend API remains secure regardless (it checks the JWT on every request).

---

## Step-by-Step: First Admin Login

1. **Start the servers**:

   ```bash
   # Terminal 1 — Backend
   cd needfull-backend
   npm run dev

   # Terminal 2 — Frontend
   cd needfull-frontend
   npm run dev
   ```

2. **Register a normal account** at `/register` or use an existing one.

3. **Promote that account to admin** via Supabase SQL Editor:

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-registered-email@example.com';
   ```

4. **Log out** (click profile → Log Out) and **log back in**. This is required because the JWT token is issued at login and contains the old `"user"` role.

5. **Navigate to** `http://localhost:3000/admin` in your browser.

6. The dashboard should load with stat cards, pending alerts, and navigation tiles.

---

## How the Role System Works

- **Registration** inserts `role = 'user'` in the database.
- **Login** reads the role from the DB and bakes it into the JWT access token.
- **The JWT** is sent with every API request.
- **The `requireRole()` middleware** reads `req.user.role` from the decoded JWT and compares it to the allowed roles.

The TypeScript type `"student" | "admin"` in the middleware is narrower than the actual stored values (`"user"` | `"admin"`). This is intentional: the type system enforces that only `"admin"` passes the guard; `"user"` (the default registration role) correctly fails the check.

---

## Testing

### Test Admin API (curl)

```bash
# 1. Login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# 2. Use the token to hit admin stats
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <access_token>"

# 3. Verify a non-admin user gets 403
# (login with a normal user first, then:)
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <normal_user_token>"
# → 403 Forbidden
```

### Test Pages

| Test | Expected Result |
|---|---|
| Visit `/admin` as non-admin | Redirect to `/feed` |
| Visit `/admin` while logged out | Redirect to `/login` |
| Visit `/admin` as admin | Dashboard loads with real data |
| Confirm a deposit on `/admin/deposits` | Wallet credited, status changes |
| Ban a user on `/admin/users` | User unable to log in |
| Cancel a task on `/admin/tasks` | Task cancelled, escrow refunded |

---

## Limitations & Future Improvements

### Current Gaps

| Issue | Details |
|---|---|
| **No "Add Credit" API** | The "Add Credit" button in `/admin/users` opens a modal but has no backend endpoint wired up. The submit button has no `onClick` handler. A future `/admin/users/:id/credit` endpoint is needed. |
| **No admin sidebar/nav** | Admin pages use the same bottom tab nav as regular pages. There is no admin-specific layout with breadcrumbs, sidebar, or admin nav header. |
| **No admin entry point in UI** | Admin users must type `/admin` manually. There is no "Admin" link in the profile dropdown or settings page. |
| **Theme inconsistencies** | Admin pages use `bg-white`/`border-gray-100` instead of the theme-aware `bg-surface`/`border-card-border` used elsewhere. Cards don't adapt to dark mode. |
| **No server-side middleware** | There is no `src/middleware.ts` file. Route protection is purely client-side (in `useEffect`), which means a brief flash of content before the redirect runs. |
| **No audit log for admin actions** | Admin actions (ban, confirm deposit, etc.) are not logged in a dedicated admin audit trail. |
| **No CSRF protection** | Admin mutation endpoints have no CSRF token. |
| **No bulk actions** | Users, deposits, and tasks cannot be acted on in bulk — each must be handled individually. |
| **No CSV export** | There is no way to export users, transactions, or deposits as CSV. |
| **No admin password reset** | Admin passwords must be reset via the normal password reset flow. |

### Priority Improvements

1. Wire the "Add Credit" API endpoint and frontend handler.
2. Add an admin link to the profile dropdown (visible only when `role === 'admin'`).
3. Create an admin-specific layout with sidebar navigation.
4. Fix theme tokens on admin pages (`bg-white` → `bg-surface`).
