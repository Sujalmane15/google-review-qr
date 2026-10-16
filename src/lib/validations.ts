import { z } from "zod";

export const ValidTags = ["food", "service", "ambience", "staff", "value"] as const;
export const ValidLanguages = ["en", "mr", "hi"] as const;

export const ReviewSuggestionSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  selectedTags: z.array(z.enum(ValidTags)).default([]),
  optionalCustomerText: z.string().trim().max(500, "Text must not exceed 500 characters").optional().default(""),
  language: z.enum(ValidLanguages).default("en"),
});

// Stricter URL validation for Google Review URLs
export const GoogleReviewUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === "https:" ||
          (process.env.NODE_ENV !== "production" && parsed.protocol === "http:")
        );
      } catch {
        return false;
      }
    },
    { message: "Review URL must be a valid HTTPS URL" }
  );

export const BusinessInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  googleReviewUrl: GoogleReviewUrlSchema,
  logoUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().trim().max(280, "Description cannot exceed 280 characters").optional().or(z.literal("")),
  accentColor: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Accent color must be a valid hex code (e.g. #16a34a)")
    .optional()
    .or(z.literal("")),
});

export const AdminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

/**
 * Validates whether an origin/URL is permitted for generating public QR codes.
 * Disallows localhost, 127.0.0.1, private IPs, and non-HTTPS in production.
 */
export function validatePublicAppUrl(appUrl?: string): {
  isValid: boolean;
  normalizedUrl: string;
  isLocalhost: boolean;
  error?: string;
} {
  const urlToTest = appUrl || process.env.NEXT_PUBLIC_APP_URL || "";

  if (!urlToTest) {
    return {
      isValid: false,
      normalizedUrl: "",
      isLocalhost: false,
      error: "NEXT_PUBLIC_APP_URL is not configured.",
    };
  }

  try {
    const parsed = new URL(urlToTest);
    const hostname = parsed.hostname.toLowerCase();

    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.");

    // Remove trailing slash
    const normalizedUrl = `${parsed.protocol}//${parsed.host}`;

    if (process.env.NODE_ENV === "production") {
      if (parsed.protocol !== "https:") {
        return {
          isValid: false,
          normalizedUrl,
          isLocalhost,
          error: "Public QR codes must use HTTPS in production.",
        };
      }
      if (isLocalhost) {
        return {
          isValid: false,
          normalizedUrl,
          isLocalhost: true,
          error: "Localhost or private IP is not allowed for production QR generation.",
        };
      }
    }

    return {
      isValid: true,
      normalizedUrl,
      isLocalhost,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: "",
      isLocalhost: false,
      error: "Invalid application URL format.",
    };
  }
}
