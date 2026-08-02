"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { BudgetInput } from "./BudgetInput";
import { SuggestedBudgets } from "./SuggestedBudgets";
import { BudgetSlider } from "./BudgetSlider";
import { DeadlineSelector } from "./DeadlineSelector";
import { LocationCard } from "./LocationCard";
import { RouteSummary } from "./RouteSummary";
import { PaymentSummaryCard } from "./PaymentSummaryCard";
import { getCategoryBudgetConfig, formatNaira } from "./budgetConfig";

interface LocationState {
  label: string;
  lat: number | null;
  lng: number | null;
}

type DeadlineOption = "today" | "tomorrow" | "custom";

interface DeadlineValue {
  option: DeadlineOption;
  customDate?: string;
}

export interface BudgetStepData {
  budgetNaira: number;
  deadline: string | undefined;
  isUrgent: boolean;
  taskLocation: LocationState;
  completionLocation: LocationState;
}

interface BudgetStepProps {
  categoryName: string;
  onContinue: (data: BudgetStepData) => void;
  initialBudget?: number;
  initialTaskLocation?: LocationState;
  initialCompletionLocation?: LocationState;
  initialDeadline?: DeadlineValue;
  isPosting?: boolean;
}

export function BudgetStep({
  categoryName,
  onContinue,
  initialBudget = 0,
  initialTaskLocation,
  initialCompletionLocation,
  initialDeadline,
  isPosting,
}: BudgetStepProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const walletBalanceKobo = user?.wallet?.balanceKobo ?? 0;

  const config = useMemo(() => getCategoryBudgetConfig(categoryName), [categoryName]);

  // Budget state
  const [budgetNaira, setBudgetNaira] = useState(initialBudget);

  // Deadline state
  const [deadline, setDeadline] = useState<DeadlineValue>(
    initialDeadline ?? { option: "today" },
  );

  // Location state
  const [taskLoc, setTaskLoc] = useState<LocationState>(
    initialTaskLocation ?? { label: "", lat: null, lng: null },
  );
  const [completionLoc, setCompletionLoc] = useState<LocationState>(
    initialCompletionLocation ?? { label: "", lat: null, lng: null },
  );

  // GPS state
  const [locatingTask, setLocatingTask] = useState(false);
  const [locatingCompletion, setLocatingCompletion] = useState(false);
  const [geoErrorTask, setGeoErrorTask] = useState<string | null>(null);
  const [geoErrorCompletion, setGeoErrorCompletion] = useState<string | null>(null);

  const [sameLocation, setSameLocation] = useState(false);

  // Fee calculation
  const fee = Math.floor(budgetNaira * 10 / 100);
  const totalNaira = budgetNaira + fee;
  const balanceNaira = walletBalanceKobo / 100;
  const hasEnough = totalNaira === 0 || balanceNaira >= totalNaira;

  // Validation
  const canContinue =
    budgetNaira >= config.min &&
    (deadline.option !== "custom" || (deadline.customDate && deadline.customDate.length > 0)) &&
    hasEnough;

  function detectLocation(
    type: "task" | "completion",
  ) {
    if (!navigator.geolocation) {
      if (type === "task") setGeoErrorTask("GPS not supported");
      else setGeoErrorCompletion("GPS not supported");
      return;
    }
    if (type === "task") {
      setLocatingTask(true);
      setGeoErrorTask(null);
    } else {
      setLocatingCompletion(true);
      setGeoErrorCompletion(null);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (type === "task") {
          setTaskLoc((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
          setLocatingTask(false);
        } else {
          setCompletionLoc((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
          setLocatingCompletion(false);
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Location permission denied. Enable GPS and try again."
            : "Could not detect location. Try again.";
        if (type === "task") {
          setGeoErrorTask(msg);
          setLocatingTask(false);
        } else {
          setGeoErrorCompletion(msg);
          setLocatingCompletion(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleSameLocationToggle() {
    if (sameLocation) {
      setCompletionLoc({ label: "", lat: null, lng: null });
      setSameLocation(false);
    } else {
      setCompletionLoc({ ...taskLoc });
      setSameLocation(true);
    }
  }

  function handleContinue() {
    const deadlineISO =
      deadline.option === "today"
        ? new Date().toISOString()
        : deadline.option === "tomorrow"
          ? new Date(Date.now() + 86400000).toISOString()
          : deadline.customDate
            ? new Date(deadline.customDate).toISOString()
            : undefined;

    onContinue({
      budgetNaira,
      deadline: deadlineISO,
      isUrgent: false,
      taskLocation: taskLoc,
      completionLocation: completionLoc,
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Budget Input — large & prominent */}
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-900">
          How much are you offering?
        </label>
        <BudgetInput value={budgetNaira} onChange={setBudgetNaira} />
      </div>

      {/* 2. Smart Suggested Budgets */}
      {budgetNaira < config.max && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Quick picks</p>
          <SuggestedBudgets
            suggestions={config.suggestions}
            selected={budgetNaira}
            onSelect={setBudgetNaira}
          />
        </div>
      )}

      {/* 3. Budget Slider */}
      <BudgetSlider
        value={budgetNaira}
        config={config}
        onChange={setBudgetNaira}
      />

      {/* 4. Deadline */}
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-900">
          When do you need it done?
        </label>
        <DeadlineSelector value={deadline} onChange={setDeadline} />
      </div>

      {/* 5. Location (only for physical categories) */}
      {config.needsDualLocation && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            Where?
          </label>

          <LocationCard
            type="task"
            label="Task Location"
            value={taskLoc.label}
            onChange={(v) => {
              setTaskLoc((prev) => ({ ...prev, label: v }));
              if (sameLocation) {
                setCompletionLoc((prev) => ({ ...prev, label: v }));
              }
            }}
            lat={taskLoc.lat}
            lng={taskLoc.lng}
            onDetect={() => detectLocation("task")}
            locating={locatingTask}
            geoError={geoErrorTask}
          />

          {/* Same as Task Location */}
          {config.needsDualLocation && taskLoc.label && (
            <button
              type="button"
              onClick={handleSameLocationToggle}
              className={`tap-target flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                sameLocation
                  ? "border-brand bg-brand/10 text-brand-text"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <CheckIcon checked={sameLocation} />
              Same as Task Location
            </button>
          )}

          {!sameLocation && (
            <LocationCard
              type="completion"
              label="Completion Location"
              value={completionLoc.label}
              onChange={(v) =>
                setCompletionLoc((prev) => ({ ...prev, label: v }))
              }
              lat={completionLoc.lat}
              lng={completionLoc.lng}
              onDetect={() => detectLocation("completion")}
              locating={locatingCompletion}
              geoError={geoErrorCompletion}
              placeholder="e.g. Faculty of Science, FUOYE"
            />
          )}

          {/* Route Summary */}
          {taskLoc.label && completionLoc.label && !sameLocation ? (
            <RouteSummary
              taskLocation={taskLoc.label}
              completionLocation={completionLoc.label}
            />
          ) : taskLoc.label && sameLocation ? (
            <RouteSummary
              taskLocation={taskLoc.label}
              completionLocation={`${taskLoc.label} (same)`}
            />
          ) : null}
        </div>
      )}

      {/* 6. Payment Summary */}
      <PaymentSummaryCard
        budgetNaira={budgetNaira}
        walletBalanceKobo={walletBalanceKobo}
      />

      {/* 7. Continue Button */}
      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-white via-white to-transparent px-4 pb-4 pt-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isPosting}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-base font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
        >
          {isPosting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              Continue — {formatNaira(totalNaira)}
            </>
          )}
        </button>
        {!hasEnough && budgetNaira > 0 && (
          <button
            type="button"
            onClick={() => router.push("/wallet/fund")}
            className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand bg-white py-3 text-sm font-bold text-brand hover:bg-brand/5"
          >
            Fund Wallet
          </button>
        )}
      </div>
    </div>
  );
}

const CheckIcon = ({ checked }: { checked: boolean }) => (
  <div
    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
      checked
        ? "border-brand bg-brand text-white"
        : "border-gray-300"
    }`}
  >
    {checked && (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
);

