import {
  Business,
  BusinessCategory,
  ParentCategory,
  Subcategory,
  User,
  BusinessAuditLog,
} from "@/types";

export interface StorageAdapter {
  init(): Promise<void>;

  // --- Parent Categories ---
  getAllParentCategories(): Promise<ParentCategory[]>;
  getParentCategoryById(id: string): Promise<ParentCategory | null>;
  upsertParentCategory(
    data: Omit<ParentCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<ParentCategory>;
  deleteParentCategory(id: string): Promise<{ success: boolean; error?: string }>;

  // --- Subcategories ---
  getAllSubcategories(parentId?: string): Promise<Subcategory[]>;
  getSubcategoryById(id: string): Promise<Subcategory | null>;
  upsertSubcategory(
    data: Omit<Subcategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Subcategory>;
  deleteSubcategory(id: string): Promise<{ success: boolean; error?: string }>;

  // --- Users / Clients ---
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  upsertUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // --- Businesses ---
  getBusinessBySlug(slug: string): Promise<Business | null>;
  getBusinessesByClient(clientId: string): Promise<Business[]>;
  getAllBusinesses(includeDeleted?: boolean): Promise<Business[]>;
  upsertBusiness(
    business: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string },
    userId?: string,
    userRole?: "admin" | "client"
  ): Promise<Business>;
  deleteBusiness(
    id: string,
    userId?: string,
    userRole?: "admin" | "client"
  ): Promise<boolean>;
  softDeleteBusiness(
    id: string,
    userId?: string,
    userRole?: "admin" | "client"
  ): Promise<boolean>;
  countBusinessesByParentCategory(parentCategoryId: string): Promise<number>;
  countBusinessesBySubcategory(subcategoryId: string): Promise<number>;

  // --- Audit Logs ---
  getAuditLogs(businessId?: string): Promise<BusinessAuditLog[]>;
  addAuditLog(
    log: Omit<BusinessAuditLog, "id" | "timestamp">
  ): Promise<BusinessAuditLog>;

  // --- Legacy Compatibility Methods ---
  getAllCategories(): Promise<BusinessCategory[]>;
  getCategoryById(id: string): Promise<BusinessCategory | null>;
  upsertCategory(
    category: Omit<BusinessCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<BusinessCategory>;
  deleteCategory(id: string): Promise<boolean>;
}
