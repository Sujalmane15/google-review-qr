export type SupportedLanguage = "en" | "mr" | "hi";

export type UserRole = "admin" | "client";

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  parentId: string; // Foreign key to ParentCategory
  name: string;
  slug: string;
  description?: string;
  services: string[]; // e.g., ["Food Quality", "Drinks & Cocktails", "Ambience", "Service"] or ["Web Dev", "App Dev", "Code Quality"]
  placeholderText?: Record<SupportedLanguage, string>;
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// Backwards-compatible alias for existing callers
export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  services: string[];
  placeholderText?: Record<SupportedLanguage, string>;
  createdAt: string;
  updatedAt: string;
}

export type BusinessStatus = "active" | "archived" | "deleted";

export interface Business {
  id: string;
  clientId?: string; // Foreign key to User (client owner)
  clientName?: string;
  name: string;
  slug: string;
  parentCategoryId?: string; // Foreign key to ParentCategory
  parentCategoryName?: string;
  subcategoryId?: string; // Foreign key to Subcategory
  subcategoryName?: string;
  // Legacy / fallback category fields for backwards compatibility
  categoryId?: string;
  categoryName?: string;
  googleReviewUrl: string;
  logoUrl?: string;
  description?: string;
  accentColor?: string;
  customServices?: string[]; // Business-specific services overriding or extending subcategory
  status?: BusinessStatus;
  isActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessAuditLog {
  id: string;
  businessId: string;
  businessName?: string;
  userId: string;
  userEmail?: string;
  userRole: UserRole;
  action: "create" | "update" | "delete" | "archive" | "restore";
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ReviewSuggestionRequest {
  businessName: string;
  parentCategoryName?: string;
  subcategoryName?: string;
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

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

export interface AdminSession {
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}
