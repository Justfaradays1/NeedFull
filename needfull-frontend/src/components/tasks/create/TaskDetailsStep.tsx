"use client";

import { useState, useMemo } from "react";
import { MapPin, Monitor, Route, Users, X } from "lucide-react";
import { getCategoryConfig, type TaskMode, type CategoryConfig } from "@/lib/categoryConfig";

interface TaskDetailsStepProps {
  categoryName: string;
  initialTitle: string;
  initialDescription: string;
  onContinue: (data: {
    title: string;
    description: string;
    taskMode: TaskMode;
    taskLocation: string;
    completionLocation: string;
    meetingLink?: string;
  }) => void;
}

const TASK_MODE_OPTIONS: {
  value: TaskMode;
  icon: typeof MapPin;
  label: string;
  description: string;
}[] = [
  { value: "onsite", icon: MapPin, label: "On-site", description: "The NeedRunner travels to complete the task" },
  { value: "collection_return", icon: Route, label: "Collection & Return", description: "Collects an item, completes work, returns it" },
  { value: "meetup", icon: Users, label: "Meet-up", description: "Both parties meet at an agreed location" },
  { value: "remote", icon: Monitor, label: "Remote", description: "Completed entirely online" },
];

function getDescriptionQuality(desc: string): {
  level: "empty" | "short" | "medium" | "good";
  color: string;
  label: string;
  icon: string;
} {
  const len = desc.trim().length;
  if (len === 0) return { level: "empty", color: "text-gray-300", label: "Start typing a description", icon: "⚪" };
  if (len < 30) return { level: "short", color: "text-red-500", label: "Too short — NeedRunners may not understand this task", icon: "🔴" };
  if (len < 80) return { level: "medium", color: "text-amber-600", label: "Needs more detail — consider adding deadline or materials provided", icon: "🟡" };
  return { level: "good", color: "text-green-600", label: "Excellent description — very likely to receive quality applicants", icon: "🟢" };
}

export function TaskDetailsStep({
  categoryName,
  initialTitle,
  initialDescription,
  onContinue,
}: TaskDetailsStepProps) {
  const config = useMemo(() => getCategoryConfig(categoryName), [categoryName]);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [taskMode, setTaskMode] = useState<TaskMode>(config.defaultMode);
  const [taskLocation, setTaskLocation] = useState("");
  const [completionLocation, setCompletionLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [showGuidance, setShowGuidance] = useState(true);

  const descQuality = getDescriptionQuality(description);
  const canContinue = title.trim().length >= 5 && description.trim().length >= 10;

  function handleChipClick(chip: string) {
    setDescription((prev) => {
      const suffix = prev.trim() ? "\n• " : "";
      return prev + suffix + chip;
    });
  }

  function handleContinue() {
    if (!canContinue) return;
    onContinue({
      title: title.trim(),
      description: description.trim(),
      taskMode,
      taskLocation: taskLocation.trim(),
      completionLocation: completionLocation.trim(),
      meetingLink: meetingLink.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900">
          Describe your task
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Be specific. Better descriptions attract better NeedRunners and reduce
          misunderstandings.
        </p>
      </div>

      {/* Title */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder={config.titlePlaceholder}
            maxLength={60}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base font-semibold outline-none transition-colors placeholder:text-gray-300 focus:border-brand"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-gray-400">Short and clear. Maximum 60 characters.</p>
          <span className="text-xs tabular-nums text-gray-400">
            {title.length}/60
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value.slice(0, 500));
            if (e.target.value.length > 0) setShowGuidance(false);
          }}
          onFocus={() => setShowGuidance(true)}
          placeholder={config.descriptionPlaceholder}
          rows={5}
          maxLength={500}
          className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-gray-300 focus:border-brand"
        />

        {/* Guidance (shown when empty or on focus) */}
        {showGuidance && !description.trim() && (
          <div className="mt-2 rounded-xl bg-brand-light/20 px-4 py-3">
            <p className="text-xs font-semibold text-brand">Include:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• What should be done</li>
              <li>• Where</li>
              <li>• Any materials provided</li>
              <li>• Preferred completion time</li>
              <li>• Special instructions</li>
            </ul>
          </div>
        )}

        {/* Quality indicator + character count */}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{descQuality.icon}</span>
            <span className={`text-xs ${descQuality.color}`}>
              {descQuality.label}
            </span>
          </div>
          <span className="text-xs tabular-nums text-gray-400">
            {description.length}/500
          </span>
        </div>
      </div>

      {/* Smart Example Chips */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">
          Tap to add to description
        </p>
        <div className="flex flex-wrap gap-2">
          {config.suggestionChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="tap-target rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-brand hover:text-brand hover:bg-brand/5"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Task Mode */}
      <div>
        <label className="mb-3 block text-sm font-bold text-gray-900">
          How should this task be done?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TASK_MODE_OPTIONS.filter((opt) => config.allowedModes.includes(opt.value)).map(
            (opt) => {
              const Icon = opt.icon;
              const isActive = taskMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTaskMode(opt.value)}
                  className={`tap-target flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-4 text-center transition-all ${
                    isActive
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] leading-tight text-gray-400">
                    {opt.description}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Conditional Location Fields Based on Task Mode */}
      {(taskMode === "onsite" || taskMode === "collection_return") && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            {taskMode === "collection_return"
              ? "Collection Location"
              : "Task Location"}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={taskLocation}
              onChange={(e) => setTaskLocation(e.target.value)}
              placeholder={
                taskMode === "collection_return"
                  ? "Where should the item be collected?"
                  : "Where should the NeedRunner go?"
              }
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
      )}

      {taskMode === "collection_return" && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            Return Location
          </label>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={completionLocation}
              onChange={(e) => setCompletionLocation(e.target.value)}
              placeholder="Where should the completed work be returned?"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
      )}

      {taskMode === "meetup" && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            Meeting Location
          </label>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={taskLocation}
              onChange={(e) => setTaskLocation(e.target.value)}
              placeholder="Where should you both meet?"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
      )}

      {taskMode === "remote" && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            Meeting Link or Platform
          </label>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand">
            <Monitor className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. Zoom link, WhatsApp, email, Google Meet"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-white via-white to-transparent px-4 pb-4 pt-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-base font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
        >
          Continue to Budget
        </button>
      </div>
    </div>
  );
}
