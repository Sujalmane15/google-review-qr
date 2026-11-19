export type SupportedLanguage = "en" | "mr" | "hi";

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  services: string[]; // e.g., ["Web Development", "App Development", "UI/UX Design", "Code Quality", "Timely Delivery"]
  placeholderText?: Record<SupportedLanguage, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  categoryId?: string; // Foreign key to BusinessCategory
  categoryName?: string;
  googleReviewUrl: string;
  logoUrl?: string;
  description?: string;
  accentColor?: string;
  customServices?: string[]; // Business-specific services overriding or extending category
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSuggestionRequest {
  businessName: string;
  categoryName?: string;
  rating: number; // 1 to 5
  selectedTags: string[];
  optionalCustomerText?: string;
  language: SupportedLanguage;
}

export interface ReviewSuggestionResponse {
  suggestions: string[];
  isFallback: boolean;
  message?: string;
}

export interface AdminSession {
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}
