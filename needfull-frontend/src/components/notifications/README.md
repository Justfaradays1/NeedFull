# Notifications System

## Overview

Complete notification management system for NeedFull users. Fetches, displays, groups, and manages notifications with intuitive UI and real-time state updates.

## Components & Hooks

### useNotifications Hook

Manages all notification state and operations.

```tsx
import { useNotifications } from '@/hooks/useNotifications';

const {
  notifications,           // All notifications flat array
  groupedNotifications,    // Grouped by date: { today, yesterday, older }
  unreadCount,            // Number of unread notifications
  loading,                // Loading state for initial fetch
  error,                  // Error message if any
  page,                   // Current page
  hasMore,                // Whether more pages available
  markAsRead(id),         // Mark single notification as read
  markAllAsRead(),        // Mark all notifications as read
  deleteNotification(id), // Delete notification
  fetchNotifications(page), // Fetch specific page
} = useNotifications();
```

**Types:**

```typescript
interface Notification {
  id: string;
  user_id: string;
  type:
    | "task_assigned"
    | "task_completed"
    | "review_received"
    | "message"
    | "wallet_transaction"
    | "report_filed"
    | "verification_status";
  title: string;
  body: string;
  task_id?: string;
  conversation_id?: string;
  actor_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  older: Notification[];
}
```

---

### NotificationItem Component

Displays a single notification with icon, title, body, time, and actions.

```tsx
import { NotificationItem } from "@/components/notifications";

<NotificationItem
  notification={notif}
  onMarkRead={(id) => handleMarkRead(id)}
  onDelete={(id) => handleDelete(id)}
/>;
```

**Props:**

- `notification: Notification` - Notification to display
- `onMarkRead: (id: string) => void` - Callback when mark read
- `onDelete: (id: string) => void` - Callback when delete

**Features:**

- **Icon**: Colored by notification type
  - Task: Blue
  - Message: Purple
  - Review: Amber
  - Wallet: Green
  - Report: Red
  - Verification: Indigo
- **Title**: Bold if unread
- **Body**: 2-line clamp for preview
- **Time Ago**: "just now", "5m ago", "2h ago", "3d ago"
- **Unread Dot**: Left blue dot if unread
- **Tap**: Navigate to relevant screen or mark read
- **Long Press** (500ms): Show context menu with options
  - Mark as read (if unread)
  - Delete

---

### NotificationsPage

Full page for managing all notifications.

```tsx
import NotificationsPage from "@/app/notifications/page";

// Page automatically handles:
// - Fetching and grouping notifications
// - Displaying grouped by date (Today/Yesterday/Older)
// - Sticky group headers
// - "Mark all read" button (only shows if unread > 0)
// - Empty state with checkmark
// - Loading and error states
```

**Layout:**

```
┌─────────────────────────────┐
│ 🔔 Notifications  ✓ Mark all read │  ← Sticky header
│ 3 unread notifications           │
├─────────────────────────────┤
│ 📅 Today                    │  ← Sticky group header
│ ┌───────────────────────────┤
│ │ 🔵 Task Assigned     ⋯    │  ← Notification item
│ │ "New task..."        1m ago│
│ ├───────────────────────────┤
│ │ 💬 Message           ⋯    │
│ │ "Thanks for..."      5m ago│
│ └───────────────────────────┘
├─────────────────────────────┤
│ 📅 Yesterday                │  ← Group header
│ ┌───────────────────────────┤
│ │ ⭐ Review            ⋯    │
│ │ "5-star review..."   1d ago│
│ └───────────────────────────┘
├─────────────────────────────┤
│ 📅 Older                    │
│ ┌───────────────────────────┤
│ │ 💰 Payment           ⋯    │
│ │ "You received..."    3d ago│
│ └───────────────────────────┘
└─────────────────────────────┘
```

**Empty State:**

```
     ✓ (green checkmark circle)

   You're all caught up!
   No new notifications right now.
   We'll let you know when something important happens.
```

---

## Notification Types & Icons

| Type                  | Icon          | Color  | Use Case                       |
| --------------------- | ------------- | ------ | ------------------------------ |
| `task_assigned`       | CheckCircle2  | Blue   | User assigned to task          |
| `task_completed`      | CheckCircle2  | Green  | Task marked complete           |
| `message`             | MessageCircle | Purple | New chat message               |
| `review_received`     | Star          | Amber  | Received user review           |
| `wallet_transaction`  | Wallet        | Green  | Money received/sent            |
| `report_filed`        | AlertCircle   | Red    | User was reported              |
| `verification_status` | Check         | Indigo | Verification approved/rejected |

---

## Navigation on Tap

- **Has task_id**: Navigate to `/tasks/{taskId}`
- **Has conversation_id**: Navigate to `/chat/{conversationId}`
- **No link**: Just mark as read
- **Auto-marks unread as read** on tap

---

## Context Menu (Long Press)

Available actions via 500ms long press or menu button:

- **Mark as read** (only if unread)
- **Delete** (always available)

---

## Backend Endpoints

| Method | Endpoint                       | Body                 | Response                   |
| ------ | ------------------------------ | -------------------- | -------------------------- |
| GET    | `/notifications`               | `?page=1&perPage=20` | `NotificationListResponse` |
| PUT    | `/notifications/{id}/read`     | —                    | `{ success: true }`        |
| PUT    | `/notifications/mark-all-read` | —                    | `{ success: true }`        |
| DELETE | `/notifications/{id}`          | —                    | `{ success: true }`        |
| GET    | `/notifications/unread-count`  | —                    | `{ count: number }`        |

---

## Features

✅ **Grouping by Date**

- Today, Yesterday, Older (intelligent date bucketing)
- Sticky group headers for reference

✅ **Smart Indicators**

- Unread dot (left side, blue)
- Unread count badge (header)
- "Mark all read" button

✅ **Interactive Actions**

- Tap: Navigate + mark read
- Long press (500ms): Context menu
- Menu button: Always accessible options

✅ **State Management**

- Loading state with skeleton
- Error handling with message
- Empty state with checkmark illustration
- Unread count tracking

✅ **Responsive Design**

- Works mobile → desktop
- Max-width container with borders
- Sticky headers at different z-indices

---

## Usage Example

```tsx
import NotificationsPage from "@/app/notifications/page";
import { useNotifications } from "@/hooks/useNotifications";

// Full page (automatic)
export default function App() {
  return <NotificationsPage />;
}

// Custom usage with hook
export function CustomNotifications() {
  const { groupedNotifications, markAsRead, deleteNotification } =
    useNotifications();

  return (
    <div>
      {groupedNotifications.today.map((notif) => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.body}</p>
          <button onClick={() => markAsRead(notif.id)}>Mark Read</button>
          <button onClick={() => deleteNotification(notif.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## FUTURE Enhancements

- [ ] Socket.io real-time updates
- [ ] Infinite scroll pagination
- [ ] Notification preferences/settings
- [ ] Badge count on app icon
- [ ] Web push notifications
- [ ] Email digest option
- [ ] Notification filter by type
- [ ] Mute notifications for specific users
- [ ] Read-receipt indicators
- [ ] Notification history (search/archive)
- [ ] Snooze notifications
- [ ] Rich notifications with media/buttons

---

## Styling Details

- **Background**: White (#FFFFFF)
- **Hover**: Subtle gray (#F9FAFB)
- **Unread**: Light blue background (#EFF6FF)
- **Borders**: Gray-200 (#E5E7EB)
- **Text**: Gray-900 for primary, Gray-600 for secondary
- **Icons**: Lucide icons, sized to context
- **Transitions**: Smooth on hover/interact

## Performance Notes

- Notifications grouped client-side for instant display
- Pagination support for large notification lists
- Lazy load with infinite scroll (FUTURE)
- Skeleton loading state
- Optimistic updates on actions
