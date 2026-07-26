"use client";

import { CheckCircle2, Circle, Loader2, Clock } from "lucide-react";

interface WorkflowStep {
  key: string;
  label: string;
  status: "done" | "current" | "pending";
  timestamp?: string;
}

const WORKFLOW_STEPS = [
  { key: "pending_payment", label: "Payment Pending" },
  { key: "funded", label: "Payment Secured" },
  { key: "accepted", label: "Accepted" },
  { key: "at_store", label: "Travelling to Store" },
  { key: "shopping", label: "Shopping" },
  { key: "receipt_uploaded", label: "Receipt Uploaded" },
  { key: "needs_budget_approval", label: "Budget Approval" },
  { key: "heading_to_delivery", label: "Heading to Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Payment Released" },
];

const STATUS_ORDER: Record<string, number> = {};
WORKFLOW_STEPS.forEach((s, i) => { STATUS_ORDER[s.key] = i; });

function getWorkflowSteps(currentStatus: string, timestamps?: Record<string, string>): WorkflowStep[] {
  const currentIdx = STATUS_ORDER[currentStatus] ?? -1;
  return WORKFLOW_STEPS.map((step, i) => ({
    ...step,
    status: i < currentIdx ? "done" : i === currentIdx ? "current" : "pending",
    timestamp: timestamps?.[step.key],
  }));
}

export default function PurchaseWorkflowTimeline({
  status,
  timestamps,
  compact = false,
}: {
  status: string;
  timestamps?: Record<string, string>;
  compact?: boolean;
}) {
  const steps = getWorkflowSteps(status, timestamps);

  if (compact) {
    const currentIdx = steps.findIndex((s) => s.status === "current");
    const current = steps[currentIdx >= 0 ? currentIdx : 0];
    const doneCount = steps.filter((s) => s.status === "done").length;
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          {steps.slice(0, Math.max(currentIdx + 1, 1)).map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 w-1.5 rounded-full ${
                s.status === "done" || s.status === "current" ? "bg-brand" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="font-medium text-gray-700">
          Step {doneCount + 1} of {WORKFLOW_STEPS.length}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{current?.label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            {step.status === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-brand" />
            ) : step.status === "current" ? (
              <div className="flex h-5 w-5 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
              </div>
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            {i < steps.length - 1 && (
              <div
                className={`mt-0.5 w-0.5 flex-1 ${
                  step.status === "done" ? "bg-brand" : "bg-gray-200"
                }`}
                style={{ minHeight: "16px" }}
              />
            )}
          </div>
          <div className={`pb-4 ${step.status === "pending" ? "opacity-40" : ""}`}>
            <p
              className={`text-sm font-medium ${
                step.status === "current"
                  ? "text-gold"
                  : step.status === "done"
                    ? "text-gray-900"
                    : "text-gray-400"
              }`}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-400">
                {new Date(step.timestamp).toLocaleString("en-NG")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { WORKFLOW_STEPS, STATUS_ORDER };
