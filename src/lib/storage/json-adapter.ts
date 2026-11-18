import fs from "fs/promises";
import path from "path";
import os from "os";
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
 * In-memory fallback map for serverless runtime environments (such as Vercel)
 * where the filesystem is read-only or ephemeral.
 */
const memoryStorage = new Map<string, Business>();
memoryStorage.set(SEED_BUSINESS.id, SEED_BUSINESS);

/**
 * Local JSON Storage Adapter (Development & Demo Only).
 * Implements atomic writes via temp file replacement to prevent corrupt reads.
 * Gracefully falls back to /tmp or in-memory if disk writes are read-only on serverless hosts.
 */
export class JsonStorageAdapter implements StorageAdapter {
  private filePath: string;
  private isInitialized = false;
  private useMemoryFallback = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      // In Vercel serverless functions, only /tmp is writable
      this.filePath = path.join(os.tmpdir(), "rmqr", "businesses.json");
    } else {
      this.filePath = path.join(process.cwd(), "data", "businesses.json");
    }
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
      console.warn("Filesystem not writable, switching to in-memory storage fallback:", err);
      this.useMemoryFallback = true;
      this.isInitialized = true;
    }
  }

  private async readAll(): Promise<Business[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memoryStorage.values());
    }
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const list = JSON.parse(content) as Business[];
      return list.length > 0 ? list : [SEED_BUSINESS];
    } catch {
      return Array.from(memoryStorage.values());
    }
  }

  private async writeAtomic(businesses: Business[]): Promise<void> {
    // Keep in-memory store in sync
    businesses.forEach((b) => memoryStorage.set(b.id, b));

    if (this.useMemoryFallback) return;

    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      const tempFile = `${this.filePath}.${crypto.randomUUID()}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(businesses, null, 2), "utf-8");
      await fs.rename(tempFile, this.filePath);
    } catch (err) {
      console.warn("Failed atomic write to disk, using memory fallback:", err);
      this.useMemoryFallback = true;
    }
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
    if (this.useMemoryFallback) {
      memoryStorage.delete(id);
    }
    await this.writeAtomic(filtered);
    return true;
  }
}
