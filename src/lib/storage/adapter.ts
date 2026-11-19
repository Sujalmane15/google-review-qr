import { Business, BusinessCategory } from "@/types";

export interface StorageAdapter {
  init(): Promise<void>;
  
  // Businesses
  getBusinessBySlug(slug: string): Promise<Business | null>;
  getAllBusinesses(): Promise<Business[]>;
  upsertBusiness(
    business: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;

  // Business Categories
  getAllCategories(): Promise<BusinessCategory[]>;
  getCategoryById(id: string): Promise<BusinessCategory | null>;
  upsertCategory(
    category: Omit<BusinessCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<BusinessCategory>;
  deleteCategory(id: string): Promise<boolean>;
}
