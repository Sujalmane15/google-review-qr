/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, use } from "react";
import {
  Sparkles,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ExperienceTag, SupportedLanguage } from "@/types";
import { translations } from "@/lib/i18n";
import { StarRating } from "@/components/StarRating";
import { TagSelector } from "@/components/TagSelector";
import { SuggestionCard } from "@/components/SuggestionCard";
import { LanguageSelector } from "@/components/LanguageSelector";

interface BusinessProfile {
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
  description?: string;
  accentColor?: string;
}

export default function CustomerReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Review Form State
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<ExperienceTag[]>([]);
  const [customerText, setCustomerText] = useState<string>("");

  // AI Generation State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [finalReviewText, setFinalReviewText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const t = translations[language] || translations.en;

  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await fetch(`/api/businesses/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setBusiness(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadBusiness();
  }, [slug]);

  const handleGenerate = async () => {
    if (!business) return;
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/review-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: business.name,
          rating,
          selectedTags,
          optionalCustomerText: customerText,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || t.rateLimitError);
        setIsGenerating(false);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setSelectedSuggestionIndex(0);
        setFinalReviewText(data.suggestions[0]);
      }
    } catch {
      setErrorMessage(t.rateLimitError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestionIndex(index);
    setFinalReviewText(suggestions[index]);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 5000);
      return true;
    } catch (err) {
      console.warn("Clipboard access denied:", err);
      // Fallback using textarea element if permitted
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 5000);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleCopyOnly = async () => {
    const textToCopy = finalReviewText || customerText;
    if (textToCopy) {
      await copyToClipboard(textToCopy);
    }
  };

  const handleContinueToGoogle = async () => {
    if (!business) return;

    const textToCopy = finalReviewText || customerText;
    if (textToCopy) {
      await copyToClipboard(textToCopy);
    }

    // Direct opening of configured Google Review destination
    window.open(business.googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mr-3" />
        Loading...
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Business Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">
            The review page for &ldquo;{slug}&rdquo; could not be located.
          </p>
        </div>
      </div>
    );
  }

  const accentColor = business.accentColor || "#16a34a";

  return (
    <main className="min-h-screen bg-slate-50/70 flex flex-col items-center p-4 sm:p-6 pb-20">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Top Header / Language Switcher */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {t.title}
          </span>
          <LanguageSelector
            currentLanguage={language}
            onChange={(l) => {
              setLanguage(l);
              // Clear previous suggestions if switching language
              if (suggestions.length > 0) {
                setSuggestions([]);
                setSelectedSuggestionIndex(null);
                setFinalReviewText("");
              }
            }}
            accentColor={accentColor}
          />
        </div>

        <div className="p-6">
          {/* Business Hero */}
          <div className="flex flex-col items-center text-center mb-6">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-sm border border-slate-100"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mb-3 shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {business.name}
            </h1>
            {business.description && (
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{business.description}</p>
            )}
          </div>

          {/* Interactive Star Rating */}
          <div className="mb-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              {t.howWasExperience}
            </h2>
            <StarRating
              rating={rating}
              onChange={setRating}
              starsLabel={t.starsLabel}
            />
          </div>

          {/* Experience Tags */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 text-center mb-2.5">
              {t.whatDidYouLike}
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              tagLabels={t.tags}
              accentColor={accentColor}
            />
          </div>

          {/* Optional Thoughts Input */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.anythingToMention}
            </label>
            <textarea
              rows={2}
              value={customerText}
              onChange={(e) => setCustomerText(e.target.value)}
              placeholder={t.placeholderText}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              maxLength={500}
            />
          </div>

          {/* AI Generation Trigger */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
            style={{ backgroundColor: accentColor }}
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? t.generating : t.generateButton}
          </button>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Suggestions List (Option 1, 2, 3) */}
          {suggestions.length > 0 && (
            <div className="mb-6 space-y-2.5 animate-fadeIn">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {t.selectSuggestion}
              </label>
              {suggestions.map((sug, idx) => (
                <SuggestionCard
                  key={idx}
                  index={idx}
                  text={sug}
                  isSelected={selectedSuggestionIndex === idx}
                  onSelect={() => handleSelectSuggestion(idx)}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}

          {/* Editable Review Box */}
          {(suggestions.length > 0 || customerText.length > 0) && (
            <div className="mb-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t.selectedReview}
                </label>
                <span className="text-[11px] text-slate-400">
                  {t.helperText}
                </span>
              </div>
              <textarea
                rows={3}
                value={finalReviewText || customerText}
                onChange={(e) => setFinalReviewText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition leading-relaxed"
              />
            </div>
          )}

          {/* Clipboard Notification Toast */}
          {copiedToast && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.reviewCopiedToast}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleContinueToGoogle}
              className="w-full py-4 px-4 bg-slate-900 text-white font-bold text-sm sm:text-base rounded-2xl hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              <span>{t.continueToGoogle}</span>
              <ExternalLink className="w-4 h-4 text-slate-300" />
            </button>

            {(finalReviewText || customerText) && (
              <button
                type="button"
                onClick={handleCopyOnly}
                className="w-full py-2.5 px-3 bg-white text-slate-700 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {t.copyReview}
              </button>
            )}
          </div>

          {/* Disclaimer & Policy Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400 leading-normal">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-300" />
            <span>{t.aiDisclaimer}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
