"use client";

import React from "react";
import { ExperienceTag } from "@/types";
import { ValidTags } from "@/lib/validations";

interface TagSelectorProps {
  selectedTags: ExperienceTag[];
  onChange: (tags: ExperienceTag[]) => void;
  tagLabels: Record<ExperienceTag, string>;
  accentColor?: string;
}

export function TagSelector({
  selectedTags,
  onChange,
  tagLabels,
  accentColor = "#16a34a",
}: TagSelectorProps) {
  const toggleTag = (tag: ExperienceTag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {ValidTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95 border ${
              isSelected
                ? "text-white shadow-md"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            style={{
              backgroundColor: isSelected ? accentColor : undefined,
              borderColor: isSelected ? accentColor : undefined,
            }}
          >
            {isSelected ? "✓ " : "+ "}
            {tagLabels[tag] || tag}
          </button>
        );
      })}
    </div>
  );
}
