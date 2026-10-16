import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Business } from "@/types";
import { StorageAdapter } from "./adapter";

/**
 * DEFAULT SEED DATA
 * Pre-populates "Kartik Restaurant & Bar" for instant testing.
 */
export const SEED_BUSINESS: Business = {
  id: "kartik-default-id",
  name: "Kartik Restaurant & Bar",
  slug: "kartik-restaurant-bar",
  googleReviewUrl: "https://g.page/r/example-kartik-restaurant/review",
  description: "Authentic multicuisine dining, warm hospitality, and memorable moments.",
  accentColor: "#16a34a",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Local JSON Storage Adapter (Development & Demo Only).
 * Implements atomic writes via temp file replacement to prevent corrupt reads.
 * NOTE: For Vercel production deployment, configure DATABASE_URL to use PostgreSQL.
 */
export class JsonStorageAdapter implements StorageAdapter {
  private filePath: string;
  private isInitialized = false;

  constructor(customPath?: string) {
    this.filePath = customPath || path.join(process.cwd(), "data", "businesses.json");
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      try {
        await fs.access(this.filePath);
      } catch {
        // File does not exist, initialize with seed business
        await this.writeAtomic([SEED_BUSINESS]);
      }
      this.isInitialized = true;
    } catch (err) {
      console.error("Failed to initialize JsonStorageAdapter:", err);
      throw err;
    }
  }

  private async readAll(): Promise<Business[]> {
    await this.init();
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content) as Business[];
    } catch {
      return [SEED_BUSINESS];
    }
  }

  private async writeAtomic(businesses: Business[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tempFile = `${this.filePath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(businesses, null, 2), "utf-8");
    await fs.rename(tempFile, this.filePath);
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const list = await this.readAll();
    const cleanSlug = slug.toLowerCase().trim();
    return list.find((b) => b.slug.toLowerCase() === cleanSlug) || null;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return this.readAll();
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business> {
    const list = await this.readAll();
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
      await this.writeAtomic(list);
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
      await this.writeAtomic(list);
      return created;
    }
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const list = await this.readAll();
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length === list.length) {
      return false;
    }
    await this.writeAtomic(filtered);
    return true;
  }
}
