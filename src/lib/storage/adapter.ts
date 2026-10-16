import { Business } from "@/types";

export interface StorageAdapter {
  init(): Promise<void>;
  getBusinessBySlug(slug: string): Promise<Business | null>;
  getAllBusinesses(): Promise<Business[]>;
  upsertBusiness(
    business: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;
}
