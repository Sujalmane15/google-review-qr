import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { Business, BusinessCategory } from "@/types";
import { StorageAdapter } from "./adapter";
import { INITIAL_CATEGORIES } from "@/lib/categories";

/**
 * DEFAULT SEED BUSINESSES
 * RMSolution Tech is pre-seeded with IT & Technology Company category.
 */
export const SEED_BUSINESSES: Business[] = [
  {
    id: "rmsolution-default-id",
    name: "RMSolution Tech",
    slug: "rmsolution-tech",
    categoryId: "cat-it-tech",
    categoryName: "IT & Technology Companies",
    googleReviewUrl: "https://g.page/r/CdT-R2IpVtpnEBM/review",
    description: "Website, Mobile App & Enterprise Software Development services.",
    accentColor: "#16a34a",
    customServices: [
      "Web Development",
      "App Development",
      "UI/UX Design",
      "Code Quality",
      "Timely Delivery",
      "Customer Support",
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rmsolution-legacy-id",
    name: "rmsolution",
    slug: "rmsolution",
    categoryId: "cat-it-tech",
    categoryName: "IT & Technology Companies",
    googleReviewUrl: "https://g.page/r/CdT-R2IpVtpnEBM/review",
    description: "Website, App & Software Development services.",
    accentColor: "#16a34a",
    customServices: [
      "Web Development",
      "App Development",
      "UI/UX Design",
      "Code Quality",
      "Timely Delivery",
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_BUSINESS = SEED_BUSINESSES[0];

// In-memory fallback maps for serverless runtime
const memoryBusinesses = new Map<string, Business>();
SEED_BUSINESSES.forEach((b) => memoryBusinesses.set(b.id, b));

const memoryCategories = new Map<string, BusinessCategory>();
INITIAL_CATEGORIES.forEach((c) => memoryCategories.set(c.id, c));

export class JsonStorageAdapter implements StorageAdapter {
  private businessesFilePath: string;
  private categoriesFilePath: string;
  private isInitialized = false;
  private useMemoryFallback = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.businessesFilePath = customPath;
      this.categoriesFilePath = path.join(path.dirname(customPath), "categories.json");
    } else if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      this.businessesFilePath = path.join(os.tmpdir(), "rmqr", "businesses.json");
      this.categoriesFilePath = path.join(os.tmpdir(), "rmqr", "categories.json");
    } else {
      this.businessesFilePath = path.join(process.cwd(), "data", "businesses.json");
      this.categoriesFilePath = path.join(process.cwd(), "data", "categories.json");
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const dir = path.dirname(this.businessesFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Initialize businesses
      try {
        await fs.access(this.businessesFilePath);
      } catch {
        await this.writeBusinessesAtomic(SEED_BUSINESSES);
      }

      // Initialize categories
      try {
        await fs.access(this.categoriesFilePath);
      } catch {
        await this.writeCategoriesAtomic(INITIAL_CATEGORIES);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn("Filesystem not writable, switching to in-memory fallback:", err);
      this.useMemoryFallback = true;
      this.isInitialized = true;
    }
  }

  // --- Categories CRUD ---
  private async readAllCategories(): Promise<BusinessCategory[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memoryCategories.values());
    }
    try {
      const content = await fs.readFile(this.categoriesFilePath, "utf-8");
      const list = JSON.parse(content) as BusinessCategory[];
      return list.length > 0 ? list : INITIAL_CATEGORIES;
    } catch {
      return Array.from(memoryCategories.values());
    }
  }

  private async writeCategoriesAtomic(categories: BusinessCategory[]): Promise<void> {
    categories.forEach((c) => memoryCategories.set(c.id, c));
    if (this.useMemoryFallback) return;

    try {
      const dir = path.dirname(this.categoriesFilePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.categoriesFilePath, JSON.stringify(categories, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed category disk write, using memory fallback:", err);
      this.useMemoryFallback = true;
    }
  }

  async getAllCategories(): Promise<BusinessCategory[]> {
    return this.readAllCategories();
  }

  async getCategoryById(id: string): Promise<BusinessCategory | null> {
    const list = await this.readAllCategories();
    return list.find((c) => c.id === id || c.slug === id) || null;
  }

  async upsertCategory(
    data: Omit<BusinessCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<BusinessCategory> {
    const list = await this.readAllCategories();
    const now = new Date().toISOString();

    const existingIndex = data.id
      ? list.findIndex((c) => c.id === data.id)
      : list.findIndex((c) => c.slug.toLowerCase() === data.slug.toLowerCase());

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: BusinessCategory = {
        ...existing,
        ...data,
        id: existing.id,
        slug: data.slug.toLowerCase().trim(),
        updatedAt: now,
      };
      list[existingIndex] = updated;
      await this.writeCategoriesAtomic(list);
      return updated;
    } else {
      const created: BusinessCategory = {
        ...data,
        id: data.id || `cat-${crypto.randomUUID()}`,
        slug: data.slug.toLowerCase().trim(),
        createdAt: now,
        updatedAt: now,
      };
      list.push(created);
      await this.writeCategoriesAtomic(list);
      return created;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    const list = await this.readAllCategories();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;
    if (this.useMemoryFallback) memoryCategories.delete(id);
    await this.writeCategoriesAtomic(filtered);
    return true;
  }

  // --- Businesses CRUD ---
  private async readAllBusinesses(): Promise<Business[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memoryBusinesses.values());
    }
    try {
      const content = await fs.readFile(this.businessesFilePath, "utf-8");
      const list = JSON.parse(content) as Business[];
      return list.length > 0 ? list : SEED_BUSINESSES;
    } catch {
      return Array.from(memoryBusinesses.values());
    }
  }

  private async writeBusinessesAtomic(businesses: Business[]): Promise<void> {
    businesses.forEach((b) => memoryBusinesses.set(b.id, b));
    if (this.useMemoryFallback) return;

    try {
      const dir = path.dirname(this.businessesFilePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.businessesFilePath, JSON.stringify(businesses, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed business disk write, using memory fallback:", err);
      this.useMemoryFallback = true;
    }
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const list = await this.readAllBusinesses();
    const cleanSlug = slug.toLowerCase().trim();
    return list.find((b) => b.slug.toLowerCase() === cleanSlug) || null;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return this.readAllBusinesses();
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business> {
    const list = await this.readAllBusinesses();
    const now = new Date().toISOString();

    const existingIndex = data.id
      ? list.findIndex((b) => b.id === data.id)
      : list.findIndex((b) => b.slug.toLowerCase() === data.slug.toLowerCase());

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: Business = {
        ...existing,
        ...data,
        id: existing.id,
        slug: data.slug.toLowerCase().trim(),
        updatedAt: now,
      };
      list[existingIndex] = updated;
      await this.writeBusinessesAtomic(list);
      return updated;
    } else {
      const created: Business = {
        ...data,
        id: data.id || crypto.randomUUID(),
        slug: data.slug.toLowerCase().trim(),
        createdAt: now,
        updatedAt: now,
      };
      list.push(created);
      await this.writeBusinessesAtomic(list);
      return created;
    }
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const list = await this.readAllBusinesses();
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length === list.length) return false;
    if (this.useMemoryFallback) memoryBusinesses.delete(id);
    await this.writeBusinessesAtomic(filtered);
    return true;
  }
}
