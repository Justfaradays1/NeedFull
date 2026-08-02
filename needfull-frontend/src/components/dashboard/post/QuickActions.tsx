"use client";

import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  Users,
  MessageCircle,
  ClipboardList,
} from "lucide-react";

const actions = [
  {
    label: "Post a Task",
    href: "/tasks/create",
    icon: Plus,
    color: "#EAA325",
    bg: "bg-gold",
    textColor: "text-white",
    emphasis: "high",
    desc: "Get help from a NeedRunner",
  },
  {
    label: "Browse Categories",
    href: "/tasks",
    icon: LayoutGrid,
    color: "#2563EB",
    bg: "bg-blue-50",
    textColor: "text-blue-700",
    emphasis: "normal",
    desc: "Explore all task types",
  },
  {
    label: "Messages",
    href: "/chat",
    icon: MessageCircle,
    color: "#EAA325",
    bg: "bg-amber-50",
    textColor: "text-amber-700",
    emphasis: "normal",
    desc: "Chat with NeedRunners",
  },
  {
    label: "Task History",
    href: "/tasks/mine",
    icon: ClipboardList,
    color: "#6B7280",
    bg: "bg-gray-50",
    textColor: "text-gray-700",
    emphasis: "normal",
    desc: "View all your tasks",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        if (action.emphasis === "high") {
          return (
            <Link
              key={action.label}
              href={action.href}
              className="col-span-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-3.5 text-white shadow-md shadow-gold/20 transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{action.label}</p>
                <p className="text-xs text-white/80">{action.desc}</p>
              </div>
            </Link>
          );
        }
        return (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-2.5 rounded-xl border border-card-border ${action.bg} px-3.5 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]`}
          >
            <Icon className="h-4 w-4 shrink-0" style={{ color: action.color }} />
            <span className={`text-xs font-bold ${action.textColor}`}>
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
