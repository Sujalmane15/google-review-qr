export type SupportedLanguage = "en" | "mr" | "hi";

export interface Business {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
  description?: string;
  accentColor?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExperienceTag = "food" | "service" | "ambience" | "staff" | "value";

export interface ReviewSuggestionRequest {
  businessName: string;
  rating: number; // 1 to 5
  selectedTags: ExperienceTag[];
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
