"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MessageCircle,
  Mail,
  Bug,
  FileQuestion,
  Send,
} from "lucide-react";

interface SupportPanelProps {
  onClose: () => void;
}

const LINKS = [
  { href: "/faq", icon: FileQuestion, label: "Frequently Asked Questions" },
  { href: "/contact", icon: Mail, label: "Contact Support" },
  { href: "#", icon: MessageCircle, label: "Chat with Support", note: "Coming soon" },
  { href: "mailto:support@needfull.app", icon: Send, label: "Email Support" },
  { href: "#", icon: Bug, label: "Report a Problem" },
];

export function SupportPanel({ onClose }: SupportPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleClick = (href: string) => {
    if (href !== "#") onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-lifted animate-[slide-up_0.2s_ease-out]"
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
              <Search className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">How can we help?</p>
              <p className="text-xs text-gray-500">Choose an option below</p>
            </div>
          </div>
        </div>
        <div className="p-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const isDisabled = link.href === "#";

            if (isDisabled) {
              return (
                <div
                  key={link.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm opacity-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-700">{link.label}</span>
                  {link.note && (
                    <span className="ml-auto text-[10px] font-semibold text-gray-400">{link.note}</span>
                  )}
                </div>
              );
            }

            const isExternal = link.href.startsWith("mailto:");
            if (isExternal) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => onClose()}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-700">{link.label}</span>
                </a>
              );
            }

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => onClose()}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-gray-700">{link.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-center text-[11px] text-gray-400">
            Response time: usually within a few hours
          </p>
        </div>
      </div>
    </>
  );
}
