// WHAT: Shared task domain types — mirrored from the backend API payloads
// WHY: Task shapes were duplicated across 8+ files with drifted fields. A single
//      source keeps cards, detail pages, and the applicants flow consistent.

export interface TaskBudget {
  kobo: number;
  naira: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon?: string | null;
}

export interface TaskPoster {
  id: string;
  fullName: string;
  trustScore?: number;
  avatarUrl?: string | null;
  profilePictureUrl?: string | null;
  isVerifiedStudent?: boolean;
}

export type WorkMode = "on_site" | "remote";

// WHAT: Shape of a task in a list/marketplace card (subset of the detail payload)
// NOTE: Most display fields are optional — different surfaces (dashboard vs
//       marketplace vs related tasks) return slightly different payloads.
export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  budget: TaskBudget;
  status: string;
  isUrgent: boolean;
  createdAt: string;
  deadline?: string | null;
  locationLabel?: string | null;
  distance?: number | null;
  workMode?: WorkMode | null;
  runnerPhase?: string | null;
  applicationCount?: number;
  category?: TaskCategory | null;
  poster?: TaskPoster;
}

// WHAT: Authoritative per-task permission flags computed server-side
export interface TaskCapabilities {
  canEdit: boolean;
  canCancel: boolean;
  canViewApplications: boolean;
  canHireApplicant: boolean;
  canApply: boolean;
  canWithdrawApplication: boolean;
  canConfirmCompletion: boolean;
  canChat: boolean;
  canRate: boolean;
  canMarkAsDone: boolean;
  canStartWork: boolean;
  canSeeExactLocation: boolean;
}

// WHAT: Budget-proposal in a task detail payload (mirrors backend API)
export interface TaskProposal {
  id: string;
  proposerId: string;
  originalBudget: TaskBudget;
  proposedAmount: TaskBudget;
  difference: TaskBudget;
  reason?: string | null;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
  expiresAt?: string | null;
  acceptedYear?: string | null;
}

// WHAT: Detailed task payload returned by GET /tasks/:id
export interface TaskDetail extends TaskItem {
  posterId: string;
  description: string;
  imageUrl: string | null;
  agreedAmount: TaskBudget | null;
  escrowAmount: TaskBudget;
  additionalFundingRequired: TaskBudget;
  acceptedProposal?: {
    id: string;
    proposedAmount: TaskBudget;
    difference: TaskBudget;
    status: string;
    acceptedYear?: string | null;
  } | null;
  runner?: {
    id: string;
    fullName: string;
    profilePictureUrl?: string | null;
  } | null;
  myApplication?: {
    id: string;
    status: string;
    proposedAmount: TaskBudget | null;
    proposal?: {
      id: string;
      proposedAmount: TaskBudget;
      difference: TaskBudget;
      status: string;
    } | null;
  } | null;
  posterFull: {
    id: string;
    fullName: string;
    trustScore: number;
    avatarUrl?: string | null;
    profilePictureUrl?: string | null;
    isVerifiedStudent?: boolean;
    school?: string | null;
    department?: string | null;
    level?: string | null;
    memberSince?: string | null;
    averageRating?: number | null;
    tasksCompleted?: number;
    tasksPosted?: number;
  };
  capabilities?: TaskCapabilities;
}

// WHAT: Standard notification payload type (mirrors backend)
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  taskId?: string | null;
  conversationId?: string | null;
  actorId?: string | null;
  isRead: boolean;
  createdAt: string;
}