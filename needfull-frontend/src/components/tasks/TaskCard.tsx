// WHAT: Shared, premium Task Card for the entire discovery surface
// WHY: One card render for dashboard featured rows, /hustle marketplace, and
//      related tasks — consistent branding and trust signals everywhere.
// RULES: Pre-apply privacy — show the general location label (Block D Hostel etc.)
//        and distance, NEVER exact room/phone/GPS. Apply never submits here; the
//        whole card links to the detail page where the sticky Apply CTA lives.

"use client";

import Link from "next/link";
import {
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  ArrowUpRight,
  Wifi,
  Briefcase,
} from "lucide-react";
import { type TaskItem, type WorkMode } from "@/types/task";
import { formatCurrency, timeAgo, formatDistance } from "@/lib/format";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Avatar } from "@/components/ui/avatar";

interface TaskCardProps {
  task: TaskItem;
  featured?: boolean;
}

function WorkModeBadge({ mode, locationLabel }: { mode: WorkMode | null | undefined; locationLabel?: string | null }) {
  if (mode === "remote") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">
        <Wifi className="h-2.5 w-2.5" />
        REMOTE
      </span>
    );
  }
  // On-site tasks must always show a general location — never an exact room/GPS
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-light/70 px-2 py-0.5 text-[9px] font-bold text-brand-text">
      <MapPin className="h-2.5 w-2.5" />
      {locationLabel ? "ON-SITE" : "ON-SITE · ASK"}
    </span>
  );
}

export default function TaskCard({ task, featured = false }: TaskCardProps) {
  const distance = formatDistance(task.distance);
  const due = task.deadline ? formatDeadline(task.deadline) : null;

  return (
    <Link
      href={`/feed/${task.id}`}
      className={`tap-target block rounded-2xl border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
        featured ? "border-gold/40 ring-1 ring-gold/20" : "border-card-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges: category, work mode, urgent, new */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {task.category?.name && (
              <>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: getCategoryColor(task.category.name) }}
                >
                  <CategoryIcon name={getCategoryIcon(task.category.name)} className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
                  style={{ backgroundColor: getCategoryColor(task.category.name) }}
                >
                  {getCategoryDisplayName(task.category.name)}
                </span>
              </>
            )}
            <WorkModeBadge mode={task.workMode} locationLabel={task.locationLabel} />
            {task.isUrgent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                URGENT
              </span>
            )}
            {isNew(task.createdAt) && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700">
                NEW
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {task.title}
          </h3>

          {task.description ? (
            <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
              {task.description}
            </p>
          ) : null}

          {/* Location + time + applicants */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
              <MapPin className="h-3 w-3" />
              {task.locationLabel || "Location on request"}
              {distance ? ` · ${distance}` : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(task.createdAt)}
            </span>
            {typeof task.applicationCount === "number" && task.applicationCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {task.applicationCount} applied
              </span>
            )}
            {due && (
              <span className="inline-flex items-center gap-1 text-red-600">
                <Clock className="h-3 w-3" />
                {due}
              </span>
            )}
          </div>

          {/* Poster trust */}
          <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-2.5">
            <Avatar src={task.poster?.avatarUrl} name={task.poster?.fullName} size="xs" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-gray-700">
              {task.poster?.fullName || "Poster"}
            </span>
            {task.poster?.isVerifiedStudent && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            )}
            {typeof task.poster?.trustScore === "number" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500">
                <Star className="h-3 w-3 fill-gold text-gold" />
                Trust {task.poster.trustScore}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-display text-lg font-black text-gold">
            {formatCurrency(task.budget.kobo)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-gold/20">
            View &amp;&nbsp;Apply <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDeadline(dateStr: string): string | null {
  const ms = new Date(dateStr).getTime() - Date.now();
  if (ms <= 0) return "Due now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Due in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `Due in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Due in ${days}d`;
  return null;
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}