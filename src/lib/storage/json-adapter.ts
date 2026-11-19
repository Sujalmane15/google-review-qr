import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import {
  Business,
  BusinessCategory,
  ParentCategory,
  Subcategory,
  User,
  BusinessAuditLog,
} from "@/types";
import { StorageAdapter } from "./adapter";
import {
  INITIAL_PARENT_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_CATEGORIES,
} from "@/lib/categories";

export const SEED_USERS: User[] = [
  {
    id: "user-admin-default",
    email: "admin@rmsolution.com",
    name: "RMSolution Admin",
    role: "admin",
    companyName: "RMSolution Tech",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "client-rmsolution-id",
    email: "client@rmsolution.com",
    name: "RMSolution Tech Client",
    role: "client",
    companyName: "RMSolution Tech",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "client-kartik-id",
    email: "kartik@restaurant.com",
    name: "Kartik Restaurant & Bar Owner",
    role: "client",
    companyName: "Kartik Restaurant & Bar",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_BUSINESSES: Business[] = [
  {
    id: "rmsolution-default-id",
    clientId: "client-rmsolution-id",
    clientName: "RMSolution Tech Client",
    name: "RMSolution Tech",
    slug: "rmsolution-tech",
    parentCategoryId: "pcat-technology",
    parentCategoryName: "IT & Technology Companies",
    subcategoryId: "cat-it-tech",
    subcategoryName: "IT & Technology Companies",
    categoryId: "cat-it-tech",
    categoryName: "IT & Technology Companies",
    googleReviewUrl: "https://g.page/r/CdT-R2IpVtpnEBM/review",
    description: "Website, Mobile App & Enterprise Software Development services.",
    accentColor: "#16a34a",
    customServices: [
      "Web Development",
      "App Development",
      "Mobile App Development",
      "UI/UX Design",
      "Code Quality",
      "Timely Delivery",
      "Customer Support",
    ],
    status: "active",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rmsolution-legacy-id",
    clientId: "client-rmsolution-id",
    clientName: "RMSolution Tech Client",
    name: "RMSolution Tech",
    slug: "rmsolution",
    parentCategoryId: "pcat-technology",
    parentCategoryName: "IT & Technology Companies",
    subcategoryId: "cat-it-tech",
    subcategoryName: "IT & Technology Companies",
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
    status: "active",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kartik-default-id",
    clientId: "client-kartik-id",
    clientName: "Kartik Restaurant & Bar Owner",
    name: "Kartik Restaurant & Bar",
    slug: "kartik-restaurant-bar",
    parentCategoryId: "pcat-hospitality",
    parentCategoryName: "Hospitality & Food Services",
    subcategoryId: "sub-restaurant-bar",
    subcategoryName: "Restaurant & Bar",
    categoryId: "sub-restaurant-bar",
    categoryName: "Restaurant & Bar",
    googleReviewUrl: "https://g.page/r/CZk4sitKj1QqEBM/review",
    description: "Authentic multicuisine dining, warm hospitality, and memorable moments.",
    accentColor: "#16a34a",
    customServices: [
      "Food Quality & Taste",
      "Drinks & Cocktails",
      "Ambience & Music",
      "Quick & Polite Service",
      "Staff Courtesy",
      "Cleanliness & Hygiene",
      "Value for Money",
    ],
    status: "active",
    isActive: true,
    createdAt: "2026-10-16T15:15:11.061Z",
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_BUSINESS = SEED_BUSINESSES[0];

// In-memory fallback maps for serverless runtime
const memoryUsers = new Map<string, User>();
SEED_USERS.forEach((u) => memoryUsers.set(u.id, u));

const memoryParentCategories = new Map<string, ParentCategory>();
INITIAL_PARENT_CATEGORIES.forEach((p) => memoryParentCategories.set(p.id, p));

const memorySubcategories = new Map<string, Subcategory>();
INITIAL_SUBCATEGORIES.forEach((s) => memorySubcategories.set(s.id, s));

const memoryBusinesses = new Map<string, Business>();
SEED_BUSINESSES.forEach((b) => memoryBusinesses.set(b.id, b));

const memoryAuditLogs: BusinessAuditLog[] = [];

export class JsonStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private businessesFilePath: string;
  private parentCatFilePath: string;
  private subCatFilePath: string;
  private usersFilePath: string;
  private auditLogsFilePath: string;
  private isInitialized = false;
  private useMemoryFallback = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.baseDir = path.dirname(customPath);
      this.businessesFilePath = customPath;
    } else if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      this.baseDir = path.join(os.tmpdir(), "rmqr");
      this.businessesFilePath = path.join(this.baseDir, "businesses.json");
    } else {
      this.baseDir = path.join(process.cwd(), "data");
      this.businessesFilePath = path.join(this.baseDir, "businesses.json");
    }

    this.parentCatFilePath = path.join(this.baseDir, "parent_categories.json");
    this.subCatFilePath = path.join(this.baseDir, "subcategories.json");
    this.usersFilePath = path.join(this.baseDir, "users.json");
    this.auditLogsFilePath = path.join(this.baseDir, "audit_logs.json");
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await fs.mkdir(this.baseDir, { recursive: true });

      // Initialize Users
      try {
        await fs.access(this.usersFilePath);
      } catch {
        await this.writeUsersAtomic(SEED_USERS);
      }

      // Initialize Parent Categories
      try {
        await fs.access(this.parentCatFilePath);
      } catch {
        await this.writeParentCategoriesAtomic(INITIAL_PARENT_CATEGORIES);
      }

      // Initialize Subcategories
      try {
        await fs.access(this.subCatFilePath);
      } catch {
        await this.writeSubcategoriesAtomic(INITIAL_SUBCATEGORIES);
      }

      // Initialize Businesses
      try {
        await fs.access(this.businessesFilePath);
      } catch {
        await this.writeBusinessesAtomic(SEED_BUSINESSES);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn("Filesystem not writable, switching to in-memory fallback:", err);
      this.useMemoryFallback = true;
      this.isInitialized = true;
    }
  }

  // ==========================================
  // USERS / CLIENTS
  // ==========================================
  private async readAllUsers(): Promise<User[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memoryUsers.values());
    }
    try {
      const content = await fs.readFile(this.usersFilePath, "utf-8");
      const list = JSON.parse(content) as User[];
      return list.length > 0 ? list : SEED_USERS;
    } catch {
      return Array.from(memoryUsers.values());
    }
  }

  private async writeUsersAtomic(users: User[]): Promise<void> {
    users.forEach((u) => memoryUsers.set(u.id, u));
    if (this.useMemoryFallback) return;
    try {
      await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2), "utf-8");
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.readAllUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.readAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.readAllUsers();
  }

  async upsertUser(
    data: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<User> {
    const users = await this.readAllUsers();
    const now = new Date().toISOString();
    const existingIndex = data.id
      ? users.findIndex((u) => u.id === data.id)
      : users.findIndex((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      const updated: User = {
        ...existing,
        ...data,
        id: existing.id,
        email: data.email.toLowerCase().trim(),
        updatedAt: now,
      };
      users[existingIndex] = updated;
      await this.writeUsersAtomic(users);
      return updated;
    } else {
      const created: User = {
        ...data,
        id: data.id || `user-${crypto.randomUUID()}`,
        email: data.email.toLowerCase().trim(),
        createdAt: now,
        updatedAt: now,
      };
      users.push(created);
      await this.writeUsersAtomic(users);
      return created;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.readAllUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;
    if (this.useMemoryFallback) memoryUsers.delete(id);
    await this.writeUsersAtomic(filtered);
    return true;
  }

  // ==========================================
  // PARENT CATEGORIES
  // ==========================================
  private async readAllParentCategories(): Promise<ParentCategory[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memoryParentCategories.values());
    }
    try {
      const content = await fs.readFile(this.parentCatFilePath, "utf-8");
      const list = JSON.parse(content) as ParentCategory[];
      return list.length > 0 ? list : INITIAL_PARENT_CATEGORIES;
    } catch {
      return Array.from(memoryParentCategories.values());
    }
  }

  private async writeParentCategoriesAtomic(cats: ParentCategory[]): Promise<void> {
    cats.forEach((c) => memoryParentCategories.set(c.id, c));
    if (this.useMemoryFallback) return;
    try {
      await fs.writeFile(this.parentCatFilePath, JSON.stringify(cats, null, 2), "utf-8");
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async getAllParentCategories(): Promise<ParentCategory[]> {
    const list = await this.readAllParentCategories();
    return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getParentCategoryById(id: string): Promise<ParentCategory | null> {
    const list = await this.readAllParentCategories();
    return list.find((c) => c.id === id || c.slug === id) || null;
  }

  async upsertParentCategory(
    data: Omit<ParentCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<ParentCategory> {
    const list = await this.readAllParentCategories();
    const now = new Date().toISOString();
    const cleanSlug = data.slug.toLowerCase().trim();

    const existingIndex = data.id
      ? list.findIndex((c) => c.id === data.id)
      : list.findIndex((c) => c.slug.toLowerCase() === cleanSlug);

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: ParentCategory = {
        ...existing,
        ...data,
        id: existing.id,
        slug: cleanSlug,
        updatedAt: now,
      };
      list[existingIndex] = updated;
      await this.writeParentCategoriesAtomic(list);
      return updated;
    } else {
      const created: ParentCategory = {
        ...data,
        id: data.id || `pcat-${crypto.randomUUID()}`,
        slug: cleanSlug,
        createdAt: now,
        updatedAt: now,
      };
      list.push(created);
      await this.writeParentCategoriesAtomic(list);
      return created;
    }
  }

  async deleteParentCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const bizCount = await this.countBusinessesByParentCategory(id);
    if (bizCount > 0) {
      return {
        success: false,
        error: `Cannot delete parent category: ${bizCount} active business(es) are assigned to it. Please reassign them first.`,
      };
    }

    // Check if subcategories exist under it
    const subcats = await this.getAllSubcategories(id);
    if (subcats.length > 0) {
      return {
        success: false,
        error: `Cannot delete parent category: it contains ${subcats.length} subcategory/subcategories. Please delete or reassign them first.`,
      };
    }

    const list = await this.readAllParentCategories();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return { success: false, error: "Parent category not found." };
    if (this.useMemoryFallback) memoryParentCategories.delete(id);
    await this.writeParentCategoriesAtomic(filtered);
    return { success: true };
  }

  // ==========================================
  // SUBCATEGORIES
  // ==========================================
  private async readAllSubcategories(): Promise<Subcategory[]> {
    await this.init();
    if (this.useMemoryFallback) {
      return Array.from(memorySubcategories.values());
    }
    try {
      const content = await fs.readFile(this.subCatFilePath, "utf-8");
      const list = JSON.parse(content) as Subcategory[];
      return list.length > 0 ? list : INITIAL_SUBCATEGORIES;
    } catch {
      return Array.from(memorySubcategories.values());
    }
  }

  private async writeSubcategoriesAtomic(subcats: Subcategory[]): Promise<void> {
    subcats.forEach((s) => memorySubcategories.set(s.id, s));
    if (this.useMemoryFallback) return;
    try {
      await fs.writeFile(this.subCatFilePath, JSON.stringify(subcats, null, 2), "utf-8");
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async getAllSubcategories(parentId?: string): Promise<Subcategory[]> {
    const list = await this.readAllSubcategories();
    const filtered = parentId ? list.filter((s) => s.parentId === parentId) : list;
    return filtered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const list = await this.readAllSubcategories();
    return list.find((s) => s.id === id || s.slug === id) || null;
  }

  async upsertSubcategory(
    data: Omit<Subcategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Subcategory> {
    const list = await this.readAllSubcategories();
    const now = new Date().toISOString();
    const cleanSlug = data.slug.toLowerCase().trim();

    const existingIndex = data.id
      ? list.findIndex((s) => s.id === data.id)
      : list.findIndex((s) => s.slug.toLowerCase() === cleanSlug);

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: Subcategory = {
        ...existing,
        ...data,
        id: existing.id,
        slug: cleanSlug,
        updatedAt: now,
      };
      list[existingIndex] = updated;
      await this.writeSubcategoriesAtomic(list);
      return updated;
    } else {
      const created: Subcategory = {
        ...data,
        id: data.id || `sub-${crypto.randomUUID()}`,
        slug: cleanSlug,
        createdAt: now,
        updatedAt: now,
      };
      list.push(created);
      await this.writeSubcategoriesAtomic(list);
      return created;
    }
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; error?: string }> {
    const bizCount = await this.countBusinessesBySubcategory(id);
    if (bizCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: ${bizCount} active business(es) are assigned to it. Please reassign them first.`,
      };
    }

    const list = await this.readAllSubcategories();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return { success: false, error: "Subcategory not found." };
    if (this.useMemoryFallback) memorySubcategories.delete(id);
    await this.writeSubcategoriesAtomic(filtered);
    return { success: true };
  }

  // ==========================================
  // BUSINESSES
  // ==========================================
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
      await fs.writeFile(this.businessesFilePath, JSON.stringify(businesses, null, 2), "utf-8");
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const list = await this.readAllBusinesses();
    const cleanSlug = slug.toLowerCase().trim();
    return (
      list.find(
        (b) =>
          b.slug.toLowerCase() === cleanSlug &&
          b.status !== "deleted" &&
          b.isActive !== false
      ) || null
    );
  }

  async getBusinessesByClient(clientId: string): Promise<Business[]> {
    const list = await this.readAllBusinesses();
    return list.filter((b) => b.clientId === clientId && b.status !== "deleted");
  }

  async getAllBusinesses(includeDeleted = false): Promise<Business[]> {
    const list = await this.readAllBusinesses();
    if (includeDeleted) return list;
    return list.filter((b) => b.status !== "deleted");
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string },
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<Business> {
    const list = await this.readAllBusinesses();
    const now = new Date().toISOString();
    const cleanSlug = data.slug.toLowerCase().trim();

    const existingIndex = data.id
      ? list.findIndex((b) => b.id === data.id)
      : list.findIndex((b) => b.slug.toLowerCase() === cleanSlug);

    let result: Business;
    let action: "create" | "update" = "create";

    if (existingIndex >= 0) {
      action = "update";
      const existing = list[existingIndex];

      // Ownership enforcement
      if (userRole === "client" && existing.clientId && existing.clientId !== userId) {
        throw new Error("Unauthorized: You do not have permission to modify this business.");
      }

      const updated: Business = {
        ...existing,
        ...data,
        id: existing.id,
        slug: cleanSlug,
        status: data.status || existing.status || "active",
        isActive: data.isActive !== undefined ? data.isActive : true,
        updatedAt: now,
      };
      list[existingIndex] = updated;
      result = updated;
    } else {
      action = "create";
      const created: Business = {
        ...data,
        id: data.id || crypto.randomUUID(),
        clientId: data.clientId || userId,
        slug: cleanSlug,
        status: data.status || "active",
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      };
      list.push(created);
      result = created;
    }

    await this.writeBusinessesAtomic(list);

    // Record audit log
    await this.addAuditLog({
      businessId: result.id,
      businessName: result.name,
      userId,
      userRole,
      action,
      details: {
        name: result.name,
        slug: result.slug,
        parentCategoryId: result.parentCategoryId,
        subcategoryId: result.subcategoryId,
      },
    });

    return result;
  }

  async softDeleteBusiness(
    id: string,
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<boolean> {
    const list = await this.readAllBusinesses();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) return false;

    const existing = list[index];
    if (userRole === "client" && existing.clientId && existing.clientId !== userId) {
      throw new Error("Unauthorized: You do not have permission to delete this business.");
    }

    existing.status = "deleted";
    existing.isActive = false;
    existing.updatedAt = new Date().toISOString();

    await this.writeBusinessesAtomic(list);

    await this.addAuditLog({
      businessId: existing.id,
      businessName: existing.name,
      userId,
      userRole,
      action: "delete",
      details: { name: existing.name, slug: existing.slug },
    });

    return true;
  }

  async deleteBusiness(
    id: string,
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<boolean> {
    return this.softDeleteBusiness(id, userId, userRole);
  }

  async countBusinessesByParentCategory(parentCategoryId: string): Promise<number> {
    const list = await this.readAllBusinesses();
    return list.filter(
      (b) =>
        b.parentCategoryId === parentCategoryId &&
        b.status !== "deleted" &&
        b.isActive !== false
    ).length;
  }

  async countBusinessesBySubcategory(subcategoryId: string): Promise<number> {
    const list = await this.readAllBusinesses();
    return list.filter(
      (b) =>
        (b.subcategoryId === subcategoryId || b.categoryId === subcategoryId) &&
        b.status !== "deleted" &&
        b.isActive !== false
    ).length;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(businessId?: string): Promise<BusinessAuditLog[]> {
    await this.init();
    let logs: BusinessAuditLog[] = [];
    if (this.useMemoryFallback) {
      logs = memoryAuditLogs;
    } else {
      try {
        const content = await fs.readFile(this.auditLogsFilePath, "utf-8");
        logs = JSON.parse(content) as BusinessAuditLog[];
      } catch {
        logs = memoryAuditLogs;
      }
    }
    const filtered = businessId ? logs.filter((l) => l.businessId === businessId) : logs;
    return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async addAuditLog(
    log: Omit<BusinessAuditLog, "id" | "timestamp">
  ): Promise<BusinessAuditLog> {
    const fullLog: BusinessAuditLog = {
      ...log,
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };

    memoryAuditLogs.push(fullLog);
    if (!this.useMemoryFallback) {
      try {
        let logs: BusinessAuditLog[] = [];
        try {
          const content = await fs.readFile(this.auditLogsFilePath, "utf-8");
          logs = JSON.parse(content);
        } catch {
          logs = [];
        }
        logs.push(fullLog);
        await fs.writeFile(this.auditLogsFilePath, JSON.stringify(logs, null, 2), "utf-8");
      } catch {
        this.useMemoryFallback = true;
      }
    }

    return fullLog;
  }

  // ==========================================
  // LEGACY BACKWARDS COMPATIBILITY
  // ==========================================
  async getAllCategories(): Promise<BusinessCategory[]> {
    const subcats = await this.readAllSubcategories();
    return subcats.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      isActive: s.isActive,
      services: s.services,
      placeholderText: s.placeholderText,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async getCategoryById(id: string): Promise<BusinessCategory | null> {
    const sub = await this.getSubcategoryById(id);
    if (sub) {
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        isActive: sub.isActive,
        services: sub.services,
        placeholderText: sub.placeholderText,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    }
    // Also check parent categories
    const parent = await this.getParentCategoryById(id);
    if (parent) {
      return {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        isActive: parent.isActive,
        services: [],
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      };
    }
    return null;
  }

  async upsertCategory(
    data: Omit<BusinessCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<BusinessCategory> {
    const sub = await this.upsertSubcategory({
      id: data.id,
      parentId: "pcat-other",
      name: data.name,
      slug: data.slug,
      description: data.description,
      services: data.services,
      placeholderText: data.placeholderText,
      isActive: data.isActive,
    });
    return {
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description,
      isActive: sub.isActive,
      services: sub.services,
      placeholderText: sub.placeholderText,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  async deleteCategory(id: string): Promise<boolean> {
    const res = await this.deleteSubcategory(id);
    return res.success;
  }
}
