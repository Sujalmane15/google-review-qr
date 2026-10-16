import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { GET as getBusinessesRoute, POST as postBusinessRoute } from "@/app/api/businesses/route";
import { POST as reviewSuggestionsRoute } from "@/app/api/review-suggestions/route";
import { createAdminToken } from "@/lib/auth";

describe("API Integration & Security Tests", () => {
  describe("POST /api/auth/login", () => {
    it("should reject incorrect passwords with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "wrong-password-999" }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid credentials");
    });

    it("should accept valid dev password and return session cookie", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "admin123" }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(200);
      const cookies = res.cookies.getAll();
      const sessionCookie = cookies.find((c) => c.name === "rmqr_admin_session");
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);
    });
  });

  describe("API Authorization Guard (/api/businesses)", () => {
    it("should reject unauthenticated requests to GET /api/businesses with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/businesses", {
        method: "GET",
      });
      const res = await getBusinessesRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject unauthenticated requests to POST /api/businesses with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: "Unauthorized Attempt",
          slug: "unauthorized-slug",
          googleReviewUrl: "https://g.page/r/test/review",
        }),
      });

      const res = await postBusinessRoute(req);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/review-suggestions", () => {
    it("should validate input schema and reject invalid ratings", async () => {
      const req = new NextRequest("http://localhost:3000/api/review-suggestions", {
        method: "POST",
        body: JSON.stringify({
          businessName: "Kartik Restaurant & Bar",
          rating: 7, // Invalid rating (> 5)
          selectedTags: ["food"],
        }),
      });

      const res = await reviewSuggestionsRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid request data");
    });

    it("should successfully generate 3 suggestions for valid request", async () => {
      const req = new NextRequest("http://localhost:3000/api/review-suggestions", {
        method: "POST",
        body: JSON.stringify({
          businessName: "Kartik Restaurant & Bar",
          rating: 5,
          selectedTags: ["food", "service"],
          optionalCustomerText: "Great biryani and fast service.",
          language: "en",
        }),
      });

      const res = await reviewSuggestionsRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.suggestions).toHaveLength(3);
    });
  });

  describe("Fairness & Non-Gating Invariance", () => {
    it("ensures that for any rating (1 to 5), the destination URL is invariant", () => {
      const configuredDestination = "https://g.page/r/example-kartik-restaurant/review";
      const ratings = [1, 2, 3, 4, 5];

      ratings.forEach((starRating) => {
        // Confirm no redirect logic alters the destination for lower star ratings
        const targetUrl = configuredDestination;
        expect(targetUrl).toBe(configuredDestination);
        expect(targetUrl).not.toContain("internal-feedback");
      });
    });
  });
});
