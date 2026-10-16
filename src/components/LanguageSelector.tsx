"use client";

import React from "react";
import { SupportedLanguage } from "@/types";

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  accentColor?: string;
}

const languages: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

export function LanguageSelector({
  currentLanguage,
  onChange,
  accentColor = "#16a34a",
}: LanguageSelectorProps) {
  return (
    <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner border border-slate-200">
      {languages.map((lang) => {
        const isActive = currentLanguage === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            style={{
              color: isActive ? accentColor : undefined,
            }}
          >
            {lang.native}
          </button>
        );
      })}
    </div>
  );
}
