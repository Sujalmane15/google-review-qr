"use client";

import React from "react";

interface TagSelectorProps {
  tags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  accentColor?: string;
}

export function TagSelector({
  tags,
  selectedTags,
  onChange,
  accentColor = "#16a34a",
}: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 border ${
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
            {tag}
          </button>
        );
      })}
    </div>
  );
}
