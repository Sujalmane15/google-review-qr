"use client";

import React from "react";
import { Check } from "lucide-react";

interface SuggestionCardProps {
  index: number;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
  accentColor?: string;
}

export function SuggestionCard({
  index,
  text,
  isSelected,
  onSelect,
  accentColor = "#16a34a",
}: SuggestionCardProps) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
        isSelected
          ? "border-2 bg-slate-50/80 shadow-md ring-2 ring-offset-1"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
      style={{
        borderColor: isSelected ? accentColor : undefined,
        // Using accentColor for ring if selected
        ...(isSelected ? { "--tw-ring-color": accentColor } as React.CSSProperties : {}),
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Option {index + 1}
        </span>
        {isSelected && (
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full text-white"
            style={{ backgroundColor: accentColor }}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        )}
      </div>
      <p className="text-slate-800 text-sm sm:text-base leading-relaxed break-words">
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}
