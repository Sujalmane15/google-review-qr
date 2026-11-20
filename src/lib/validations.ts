import { z } from "zod";

export const ValidLanguages = ["en", "mr", "hi"] as const;

export const ReviewSuggestionSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  parentCategoryName: z.string().trim().max(100).optional(),
  subcategoryName: z.string().trim().max(100).optional(),
  categoryName: z.string().trim().max(100).optional(),
  reviewQuestion: z.string().trim().max(200).optional(),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  selectedTags: z.array(z.string().trim().min(1).max(50)).default([]),
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
  id: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  parentCategoryId: z.string().trim().optional().or(z.literal("")),
  parentCategoryName: z.string().trim().max(100).optional().or(z.literal("")),
  subcategoryId: z.string().trim().optional().or(z.literal("")),
  subcategoryName: z.string().trim().max(100).optional().or(z.literal("")),
  reviewQuestion: z.string().trim().max(200).optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  categoryName: z.string().trim().max(100).optional().or(z.literal("")),
  googleReviewUrl: GoogleReviewUrlSchema,
  logoUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().trim().max(350, "Description cannot exceed 350 characters").optional().or(z.literal("")),
  accentColor: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Accent color must be a valid hex code (e.g. #16a34a)")
    .optional()
    .or(z.literal("")),
  customServices: z.array(z.string().trim().min(1)).optional().default([]),
  status: z.enum(["active", "archived", "deleted"]).optional().default("active"),
  isActive: z.boolean().optional().default(true),
  isPlatformProvider: z.boolean().optional().default(false),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

export const ParentCategoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Parent category name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  icon: z.string().trim().max(50).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().optional().default(1),
});

export const SubcategoryInputSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().min(1, "Parent category is required"),
  name: z.string().trim().min(2, "Subcategory name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  reviewQuestion: z.string().trim().max(200).optional().or(z.literal("")),
  services: z.array(z.string().trim().min(1)).min(1, "At least one service tag is required"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().optional().default(1),
});

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  icon: z.string().trim().max(50).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  services: z.array(z.string().trim().min(1)).min(1, "At least one service tag is required"),
});

export const AdminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const ClientLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const ClientRegisterSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
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
