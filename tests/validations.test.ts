import { describe, it, expect } from "vitest";
import {
  GoogleReviewUrlSchema,
  BusinessInputSchema,
  ReviewSuggestionSchema,
  validatePublicAppUrl,
} from "@/lib/validations";

describe("Validations & Security", () => {
  describe("GoogleReviewUrlSchema", () => {
    it("should accept valid HTTPS Google review URLs", () => {
      const validUrls = [
        "https://g.page/r/example-id/review",
        "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
        "https://maps.google.com/?cid=1234567890",
      ];
      validUrls.forEach((url) => {
        const result = GoogleReviewUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid URLs or malicious schemes", () => {
      const invalidUrls = [
        "javascript:alert(1)",
        "not-a-url",
        "ftp://example.com/review",
        "",
      ];
      invalidUrls.forEach((url) => {
        const result = GoogleReviewUrlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("BusinessInputSchema", () => {
    it("should accept valid business configurations", () => {
      const valid = {
        name: "Kartik Restaurant & Bar",
        slug: "kartik-restaurant-bar",
        googleReviewUrl: "https://g.page/r/example-id/review",
        description: "Great authentic cuisine and friendly service.",
        accentColor: "#16a34a",
      };
      const result = BusinessInputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid slugs with spaces, uppercase, or special characters", () => {
      const invalidSlugs = ["Kartik Restaurant", "kartik_restaurant", "slug!", "-leading", "trailing-"];
      invalidSlugs.forEach((slug) => {
        const result = BusinessInputSchema.safeParse({
          name: "Test",
          slug,
          googleReviewUrl: "https://g.page/r/test/review",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("ReviewSuggestionSchema", () => {
    it("should accept valid customer review inputs", () => {
      const valid = {
        businessName: "Kartik Restaurant & Bar",
        rating: 5,
        selectedTags: ["food", "service"],
        optionalCustomerText: "Loved the paneer tikka!",
        language: "en",
      };
      const result = ReviewSuggestionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject ratings outside 1-5 range", () => {
      [0, 6, -1, 10].forEach((rating) => {
        const result = ReviewSuggestionSchema.safeParse({
          businessName: "Kartik Restaurant & Bar",
          rating,
          selectedTags: ["food"],
        });
        expect(result.success).toBe(false);
      });
    });

    it("should enforce text length limit of 500 characters", () => {
      const longText = "a".repeat(501);
      const result = ReviewSuggestionSchema.safeParse({
        businessName: "Kartik Restaurant & Bar",
        rating: 5,
        selectedTags: ["food"],
        optionalCustomerText: longText,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validatePublicAppUrl & QR URL Safety", () => {
    it("should identify localhost and loopback addresses", () => {
      const localUrls = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.100:3000",
      ];
      localUrls.forEach((url) => {
        const res = validatePublicAppUrl(url);
        expect(res.isLocalhost).toBe(true);
      });
    });

    it("should normalize trailing slashes on public domains", () => {
      const res = validatePublicAppUrl("https://my-rmqr-app.vercel.app///");
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe("https://my-rmqr-app.vercel.app");
      expect(res.isLocalhost).toBe(false);
    });
  });
});
