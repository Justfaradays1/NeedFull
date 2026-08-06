"use client";

// WHAT: Reusable "Available Helper" runner card with quick actions
// WHY:  Posters see who is available right now and can profile/message/invite —
//       discovery only, no payment or booking happens on the card.
// NOTE: Invite is only meaningful for open tasks; the menu loads the poster's
//       open tasks lazily and invites through POST /tasks/:id/invite.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  MapPin,
  MessageCircle,
  Star,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { get, post } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/avatar";
import { HelperOffer, formatDistance } from "./types";

interface OpenTask {
  id: string;
  title: string;
  budget: { naira: number };
}

export function HelperCard({ offer, wide = false }: { offer: HelperOffer; wide?: boolean }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openTasks, setOpenTasks] = useState<OpenTask[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const distance = formatDistance(offer.distance);
  const rating = offer.runner?.averageRating;
  const until = offer.availableUntil
    ? `until ${new Date(offer.availableUntil).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
      })}`
    : null;

  const startChat = async () => {
    try {
      const res = await post<{ success: boolean; data: { id: string } }>(
        "/chat/conversations",
        { otherUserId: offer.runnerId },
      );
      if (res.success) router.push("/chat");
    } catch {
      toast.error("Couldn't open chat — try again");
    }
  };

  const openInvite = async () => {
    setInviteOpen(true);
    if (openTasks !== null || loadingTasks) return;
    setLoadingTasks(true);
    try {
      const res = await get<{ success: boolean; data: any[] }>(
        "/tasks/me/posted",
      );
      const tasks = (res.success ? res.data : []).filter(
        (t) => t.status === "open",
      );
      setOpenTasks(tasks);
    } catch {
      setOpenTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const sendInvite = async (task: OpenTask) => {
    setSendingTo(task.id);
    try {
      const res = await post<{ success: boolean; message: string }>(
        `/tasks/${task.id}/invite`,
        { runnerId: offer.runnerId },
      );
      if (res.success) {
        toast.success(`Invite sent for "${task.title}"`);
        setInviteOpen(false);
      } else {
        toast.error(res.message || "Couldn't send invite");
      }
    } catch {
      toast.error("Couldn't send invite — try again");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div
      className={
        wide
          ? "flex w-full shrink-0 snap-start flex-col rounded-2xl border border-card-border bg-surface p-3 shadow-sm transition-shadow hover:shadow-md"
          : "flex w-64 shrink-0 snap-start flex-col rounded-2xl border border-card-border bg-surface p-3 shadow-sm transition-shadow hover:shadow-md sm:w-72"
      }
    >
      <div className="flex items-start gap-2.5">
        <Link href={`/profile/${offer.runnerId}`} className="shrink-0">
          <Avatar
            src={offer.runner?.avatarUrl}
            name={offer.runner?.fullName}
            size="md"
            border
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${offer.runnerId}`}
            className="flex items-center gap-1"
          >
            <p className="truncate text-sm font-bold text-gray-900">
              {offer.runner?.fullName}
            </p>
            {offer.runner?.isVerifiedStudent && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            )}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-brand-text">
            <span>{offer.category?.icon}</span>
            <span className="truncate">
              Available for {offer.category?.name || "Help"}
            </span>
          </p>
        </div>
        {offer.isOnlineToday && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            ONLINE
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
        {rating !== null && rating !== undefined && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-gray-600">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {Number(rating).toFixed(1)}
          </span>
        )}
        {typeof offer.runner?.tasksCompleted === "number" && (
          <span className="inline-flex items-center gap-0.5">
            <UserRound className="h-3 w-3" />
            {offer.runner.tasksCompleted} done
          </span>
        )}
        {typeof offer.runner?.trustScore === "number" && (
          <span className="inline-flex items-center gap-0.5">
            <BadgeCheck className="h-3 w-3" />
            Trust {offer.runner.trustScore}
          </span>
        )}
      </div>

      {offer.note && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
          {offer.note}
        </p>
      )}

      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-400">
        {distance && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-gray-600">
            <MapPin className="h-3 w-3" />
            {distance}
          </span>
        )}
        <span className="inline-flex items-center gap-0.5">
          <MapPin className="h-3 w-3" />
          {offer.maxTravelKm}km travel
        </span>
        {until && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {until}
          </span>
        )}
      </p>

      <div className="mt-auto flex items-center gap-1.5 pt-3">
        <Link
          href={`/profile/${offer.runnerId}`}
          className="tap-target flex-1 rounded-lg border border-card-border py-1.5 text-center text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Profile
        </Link>
        <button
          onClick={startChat}
          className="tap-target flex items-center justify-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
          title="Send a message"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={openInvite}
          className="tap-target flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Invite
        </button>
      </div>

      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-card-border bg-surface shadow-lifted"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  Invite {offer.runner?.fullName?.split(" ")[0]} to a task
                </p>
                <p className="truncate text-[10px] text-gray-500">
                  {offer.category?.icon} Available for {offer.category?.name} —
                  they still apply and you still pick
                </p>
              </div>
              <button
                onClick={() => setInviteOpen(false)}
                className="tap-target ml-2 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {loadingTasks ? (
              <p className="px-4 py-4 text-center text-xs text-gray-400">
                Loading your open tasks…
              </p>
            ) : openTasks && openTasks.length > 0 ? (
              <div className="max-h-72 overflow-y-auto p-2">
                {openTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => sendInvite(task)}
                    disabled={sendingTo === task.id}
                    className="tap-target flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="min-w-0 truncate text-xs font-semibold text-gray-800">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-brand-text">
                      ₦{task.budget.naira.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-500">
                  You have no open tasks to invite to yet.
                </p>
                <Link
                  href="/tasks/create"
                  onClick={() => setInviteOpen(false)}
                  className="tap-target mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-on-brand transition-opacity hover:opacity-90"
                >
                  Post a Task
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}