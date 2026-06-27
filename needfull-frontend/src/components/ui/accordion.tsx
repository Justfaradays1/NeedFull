'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
}

function AccordionItem({ title, children, open, onToggle }: AccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-xl border border-card-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-lifted">
      <button
        type="button"
        onClick={onToggle}
        className="tap-target flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 sm:px-6 sm:py-5"
        aria-expanded={open}
      >
        <span className="font-display text-sm font-bold text-gray-900 sm:text-base">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 sm:h-5 sm:w-5 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? contentRef.current?.scrollHeight ?? 500 : 0 }}
      >
        <div className="border-t border-card-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="text-sm leading-relaxed text-gray-600 sm:text-base">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: { title: string; content: React.ReactNode }[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className = '' }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggle = useCallback((index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultiple) next.clear();
        next.add(index);
      }
      return next;
    });
  }, [allowMultiple]);

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Frequently Asked Questions">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          title={item.title}
          open={openItems.has(i)}
          onToggle={() => toggle(i)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
