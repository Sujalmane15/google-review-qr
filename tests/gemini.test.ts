import { describe, it, expect } from "vitest";
import { generateReviewSuggestionsWithGemini } from "@/lib/gemini";
import { ReviewSuggestionRequest } from "@/types";

describe("Gemini AI Review Suggestions & Fallbacks", () => {
  it("should generate 3 suggestions in English using fallback when key is not set", async () => {
    const req: ReviewSuggestionRequest = {
      businessName: "Kartik Restaurant & Bar",
      rating: 5,
      selectedTags: ["food", "service"],
      optionalCustomerText: "Special thanks for fast service.",
      language: "en",
    };

    const res = await generateReviewSuggestionsWithGemini(req);
    expect(res.suggestions).toHaveLength(3);
    expect(res.isFallback).toBe(true);

    // Check each suggestion is non-empty and references either the business or the selected tags
    res.suggestions.forEach((sug) => {
      expect(sug.length).toBeGreaterThan(15);
      const containsRelevantContext =
        sug.includes("Kartik Restaurant & Bar") ||
        sug.includes("food") ||
        sug.includes("service");
      expect(containsRelevantContext).toBe(true);
    });
  });

  it("should generate 3 suggestions in Marathi (मराठी) without error", async () => {
    const req: ReviewSuggestionRequest = {
      businessName: "Kartik Restaurant & Bar",
      rating: 5,
      selectedTags: ["food"],
      language: "mr",
    };

    const res = await generateReviewSuggestionsWithGemini(req);
    expect(res.suggestions).toHaveLength(3);
    // Should contain Marathi characters
    const hasMarathi = res.suggestions.some((s) => /[\u0900-\u097F]/.test(s));
    expect(hasMarathi).toBe(true);
  });

  it("should generate 3 suggestions in Hindi (हिन्दी) without error", async () => {
    const req: ReviewSuggestionRequest = {
      businessName: "Kartik Restaurant & Bar",
      rating: 4,
      selectedTags: ["ambience"],
      language: "hi",
    };

    const res = await generateReviewSuggestionsWithGemini(req);
    expect(res.suggestions).toHaveLength(3);
    const hasHindi = res.suggestions.some((s) => /[\u0900-\u097F]/.test(s));
    expect(hasHindi).toBe(true);
  });

  it("should reflect honest negative feedback for 1 or 2 stars without gating", async () => {
    const req: ReviewSuggestionRequest = {
      businessName: "Kartik Restaurant & Bar",
      rating: 1,
      selectedTags: ["service"],
      language: "en",
    };

    const res = await generateReviewSuggestionsWithGemini(req);
    expect(res.suggestions).toHaveLength(3);
    // The tone must not be artificially positive
    const negativeToneDetected = res.suggestions.some(
      (s) => s.toLowerCase().includes("disappointing") || s.toLowerCase().includes("improvement") || s.toLowerCase().includes("not satisfied")
    );
    expect(negativeToneDetected).toBe(true);
  });

  it("should not hallucinate unselected tags", async () => {
    const req: ReviewSuggestionRequest = {
      businessName: "Kartik Restaurant & Bar",
      rating: 5,
      selectedTags: ["food"], // Ambience was NOT selected
      language: "en",
    };

    const res = await generateReviewSuggestionsWithGemini(req);
    // Neither suggestion in fallback should mention unselected tags like ambience or staff
    res.suggestions.forEach((sug) => {
      expect(sug.toLowerCase()).not.toContain("ambience");
      expect(sug.toLowerCase()).not.toContain("staff");
    });
  });
});
