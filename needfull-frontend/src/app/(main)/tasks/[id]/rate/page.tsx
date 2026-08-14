// WHAT: Rate & Review page — both participants rate each other after payment
// WHY: Star rating + optional review + quick tags. Feeds POST /reviews and the
//      trust system. Reviews are permanent reputation for both sides.
// FUTURE: Add anonymous review option, review update, per-role rating breakdown.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient from "@/lib/apiClient";
import { TaskDetailSkeleton } from "@/components/ui/skeletons/TaskDetailSkeleton";
import { Avatar } from "@/components/ui/avatar";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { useCelebration } from "@/hooks/useCelebration";

interface TaskDetailData {
  id: string;
  posterId: string;
  title: string;
  status: string;
  runner: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  } | null;
  poster: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  };
  capabilities?: { canRate: boolean };
}

const STAR_LABELS = [
  "",
  "Terrible",
  "Poor",
  "Okay",
  "Good",
  "Excellent!",
];

const QUICK_TAGS = [
  { emoji: "⚡", label: "Fast" },
  { emoji: "✓", label: "Reliable" },
  { emoji: "💬", label: "Communicative" },
  { emoji: "🤲", label: "Careful" },
  { emoji: "😊", label: "Friendly" },
];

export default function TaskRatePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const celebration = useCelebration();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const res = await apiClient.get(`/tasks/${taskId}`);
        const data = res.data?.data ?? null;
        setTask(data);
        if (!data?.capabilities?.canRate) {
          setDenied(true);
          return;
        }
        // WHAT: Already rated? The current user's review exists for this task
        const revRes = await apiClient.get(`/reviews/task/${taskId}`);
        const reviews = revRes.data?.data ?? [];
        if (reviews.some((r: any) => r.reviewer?.id === user.id)) {
          setAlreadyRated(true);
        }
      } catch {
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, taskId, user]);

  if (!isAuthenticated) return null;
  if (loading) return <TaskDetailSkeleton />;

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
        <Link
          href="/tasks"
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </Link>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <AlertCircle className="mb-2 h-10 w-10 text-foreground-muted" />
        <h2 className="text-lg font-semibold text-gray-900">
          Nothing to rate yet
        </h2>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          Ratings open once the task is completed and payment is released.
        </p>
        <button
          onClick={() => router.push("/tasks")}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </button>
      </div>
    );
  }

  if (alreadyRated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <CheckCircle2 className="mb-2 h-10 w-10 text-success-text" />
        <h2 className="text-lg font-semibold text-gray-900">
          You&apos;ve already rated this task
        </h2>
        <button
          onClick={() => router.push("/tasks")}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </button>
      </div>
    );
  }

  const isPoster = user?.id === task.posterId;
  const reviewee = isPoster ? task.runner : task.poster;
  const peerName = reviewee?.fullName?.split(" ")[0] ?? "your partner";

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Tap a star to rate first");
      return;
    }
    const tagsText =
      tags.length > 0
        ? tags.map((t) => QUICK_TAGS.find((q) => q.label === t)?.emoji + " " + t).join(" · ")
        : "";
    const fullComment = comment.trim()
      ? tagsText
        ? `${comment.trim()}\n\n${tagsText}`
        : comment.trim()
      : tagsText;

    setSubmitting(true);
    try {
      await apiClient.post("/reviews", {
        taskId,
        revieweeId: reviewee?.id,
        rating,
        comment: fullComment || null,
      });
      celebration.showForAction("poster", "task_completed", {
        title: "Thanks for your review!",
        description: `Your review helps ${peerName} build a trusted reputation on NeedFull.`,
        primaryLabel: "Back to My Tasks",
        primaryHref: "/tasks",
        secondaryLabel: "View Profile",
        secondaryHref: `/profile/${reviewee?.id}`,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Rate {peerName}</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="text-center">
          <Avatar
            src={reviewee?.profilePictureUrl}
            name={reviewee?.fullName}
            size="xl"
            border
            className="mx-auto"
          />
          <h2 className="mt-3 font-display text-lg font-bold text-gray-900">
            {reviewee?.fullName}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            How did {peerName} do on &ldquo;{task.title}&rdquo;?
          </p>
        </div>

        {/* Star rating */}
        <div className="mt-6 rounded-2xl border border-card-border bg-surface p-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="tap-target p-1 transition-transform hover:scale-110 active:scale-95"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-9 w-9 ${
                    (hoverRating || rating) >= n
                      ? "fill-gold text-gold"
                      : "fill-transparent text-foreground-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-gold-dark">
            {rating ? STAR_LABELS[rating] : "Tap to rate"}
          </p>
        </div>

        {/* Review text */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Write a review (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell others about your experience with ${peerName}…`}
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border-default p-3 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        {/* Quick tags */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-gray-600">Quick tags:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => toggleTag(t.label)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tags.includes(t.label)
                    ? "border-gold bg-gold-light text-gold-dark"
                    : "border-border-default bg-surface text-gray-600"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand shadow-sm active:scale-[0.97] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4 fill-gold" />
            )}
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
          <button
            onClick={() => router.push("/tasks")}
            disabled={submitting}
            className="w-full rounded-xl border border-border-default py-3 text-sm font-semibold text-gray-600 active:scale-[0.97] disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>

      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </div>
  );
}