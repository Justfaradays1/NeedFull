'use client';

import { ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { TaskStatusBadge } from '@/components/ui/task-status-badge';

interface TaskInfo {
  id: string;
  title: string;
  status: string;
  budget: { kobo: number; naira: number };
  isUrgent: boolean;
}

interface PinnedTaskBarProps {
  task: TaskInfo;
  onViewTask: () => void;
}

export function PinnedTaskBar({ task, onViewTask }: PinnedTaskBarProps) {
  return (
    <div className="border-b border-border-default bg-surface px-4 py-2.5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-text" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
            {task.isUrgent && (
              <span className="shrink-0 rounded bg-error-bg px-1.5 py-0.5 text-[10px] font-bold text-error-text">
                URGENT
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <span className="text-[11px] text-gray-500">₦{task.budget.naira.toLocaleString()}</span>
            {task.status === 'in_progress' && (
              <span className="flex items-center gap-1 text-[11px] text-warning-text">
                <Clock className="h-3 w-3" />
                Escrow
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onViewTask}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-text transition-colors hover:bg-brand-light/30"
        >
          <span className="hidden sm:inline">View</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
