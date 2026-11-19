import { Pool } from "pg";
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
import { SEED_BUSINESSES, SEED_USERS } from "./json-adapter";
import {
  INITIAL_PARENT_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_CATEGORIES,
} from "@/lib/categories";

export class PostgresStorageAdapter implements StorageAdapter {
  private pool: Pool;
  private isInitialized = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(160) UNIQUE NOT NULL,
        password_hash TEXT,
        name VARCHAR(120) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'client',
        company_name VARCHAR(160),
        phone VARCHAR(30),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS parent_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(50),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subcategories (
        id VARCHAR(64) PRIMARY KEY,
        parent_id VARCHAR(64) NOT NULL,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        services JSONB NOT NULL DEFAULT '[]'::jsonb,
        placeholder_text JSONB,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        services JSONB NOT NULL DEFAULT '[]'::jsonb,
        placeholder_text JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64),
        client_name VARCHAR(120),
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        parent_category_id VARCHAR(64),
        parent_category_name VARCHAR(120),
        subcategory_id VARCHAR(64),
        subcategory_name VARCHAR(120),
        category_id VARCHAR(64),
        category_name VARCHAR(120),
        google_review_url TEXT NOT NULL,
        logo_url TEXT,
        description TEXT,
        accent_color VARCHAR(16),
        custom_services JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        contact_email VARCHAR(160),
        contact_phone VARCHAR(30),
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL,
        business_name VARCHAR(120),
        user_id VARCHAR(64) NOT NULL,
        user_email VARCHAR(160),
        user_role VARCHAR(20) NOT NULL,
        action VARCHAR(40) NOT NULL,
        details JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
      CREATE INDEX IF NOT EXISTS idx_businesses_client ON businesses(client_id);
      CREATE INDEX IF NOT EXISTS idx_subcategories_parent ON subcategories(parent_id);
    `;

    await this.pool.query(query);

    // Seed users if empty
    const uCount = await this.pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(uCount.rows[0].count, 10) === 0) {
      for (const u of SEED_USERS) {
        await this.upsertUser(u);
      }
    }

    // Seed parent categories if empty
    const pCount = await this.pool.query("SELECT COUNT(*) FROM parent_categories");
    if (parseInt(pCount.rows[0].count, 10) === 0) {
      for (const p of INITIAL_PARENT_CATEGORIES) {
        await this.upsertParentCategory(p);
      }
    }

    // Seed subcategories if empty
    const sCount = await this.pool.query("SELECT COUNT(*) FROM subcategories");
    if (parseInt(sCount.rows[0].count, 10) === 0) {
      for (const s of INITIAL_SUBCATEGORIES) {
        await this.upsertSubcategory(s);
      }
    }

    // Seed legacy categories if empty
    const catCount = await this.pool.query("SELECT COUNT(*) FROM business_categories");
    if (parseInt(catCount.rows[0].count, 10) === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await this.upsertCategory(cat);
      }
    }

    // Seed businesses if empty
    const bCount = await this.pool.query("SELECT COUNT(*) FROM businesses");
    if (parseInt(bCount.rows[0].count, 10) === 0) {
      for (const b of SEED_BUSINESSES) {
        await this.upsertBusiness(b);
      }
    }

    this.isInitialized = true;
  }

  // ==========================================
  // USERS
  // ==========================================
  async getUserByEmail(email: string): Promise<User | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, email, password_hash as "passwordHash", name, role,
              company_name as "companyName", phone,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async getUserById(id: string): Promise<User | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, email, password_hash as "passwordHash", name, role,
              company_name as "companyName", phone,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async getAllUsers(): Promise<User[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, email, password_hash as "passwordHash", name, role,
              company_name as "companyName", phone,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async upsertUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<User> {
    await this.init();
    const id = user.id || `user-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO users (id, email, password_hash, name, role, company_name, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
        role = EXCLUDED.role,
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone,
        updated_at = EXCLUDED.updated_at
      RETURNING id, email, password_hash as "passwordHash", name, role,
                company_name as "companyName", phone,
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const res = await this.pool.query(query, [
      id,
      user.email.toLowerCase().trim(),
      user.passwordHash || null,
      user.name.trim(),
      user.role || "client",
      user.companyName || null,
      user.phone || null,
      now,
    ]);
    return res.rows[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.init();
    const res = await this.pool.query("DELETE FROM users WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ==========================================
  // PARENT CATEGORIES
  // ==========================================
  async getAllParentCategories(): Promise<ParentCategory[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, icon, description, is_active as "isActive",
              display_order as "displayOrder",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_categories ORDER BY display_order ASC, name ASC`
    );
    return res.rows.map((r) => ({ ...r, isActive: Boolean(r.isActive) }));
  }

  async getParentCategoryById(id: string): Promise<ParentCategory | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, icon, description, is_active as "isActive",
              display_order as "displayOrder",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_categories WHERE id = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return { ...res.rows[0], isActive: Boolean(res.rows[0].isActive) };
  }

  async upsertParentCategory(
    data: Omit<ParentCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<ParentCategory> {
    await this.init();
    const id = data.id || `pcat-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO parent_categories (id, name, slug, icon, description, is_active, display_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = EXCLUDED.updated_at
      RETURNING id, name, slug, icon, description, is_active as "isActive",
                display_order as "displayOrder",
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const res = await this.pool.query(query, [
      id,
      data.name.trim(),
      data.slug.toLowerCase().trim(),
      data.icon || null,
      data.description || null,
      data.isActive ?? true,
      data.displayOrder || 1,
      now,
    ]);
    return { ...res.rows[0], isActive: Boolean(res.rows[0].isActive) };
  }

  async deleteParentCategory(id: string): Promise<{ success: boolean; error?: string }> {
    await this.init();
    const bizCount = await this.countBusinessesByParentCategory(id);
    if (bizCount > 0) {
      return {
        success: false,
        error: `Cannot delete parent category: ${bizCount} active business(es) are assigned to it.`,
      };
    }
    const subcats = await this.getAllSubcategories(id);
    if (subcats.length > 0) {
      return {
        success: false,
        error: `Cannot delete parent category: it contains ${subcats.length} subcategories.`,
      };
    }
    const res = await this.pool.query("DELETE FROM parent_categories WHERE id = $1", [id]);
    return { success: (res.rowCount ?? 0) > 0 };
  }

  // ==========================================
  // SUBCATEGORIES
  // ==========================================
  async getAllSubcategories(parentId?: string): Promise<Subcategory[]> {
    await this.init();
    let query = `
      SELECT id, parent_id as "parentId", name, slug, description,
             services, placeholder_text as "placeholderText", is_active as "isActive",
             display_order as "displayOrder",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM subcategories
    `;
    const params: unknown[] = [];
    if (parentId) {
      query += ` WHERE parent_id = $1`;
      params.push(parentId);
    }
    query += ` ORDER BY display_order ASC, name ASC`;

    const res = await this.pool.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      services: Array.isArray(r.services) ? r.services : JSON.parse(r.services || "[]"),
      isActive: Boolean(r.isActive),
    }));
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, parent_id as "parentId", name, slug, description,
              services, placeholder_text as "placeholderText", is_active as "isActive",
              display_order as "displayOrder",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM subcategories WHERE id = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      services: Array.isArray(r.services) ? r.services : JSON.parse(r.services || "[]"),
      isActive: Boolean(r.isActive),
    };
  }

  async upsertSubcategory(
    data: Omit<Subcategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Subcategory> {
    await this.init();
    const id = data.id || `sub-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO subcategories (id, parent_id, name, slug, description, services, placeholder_text, is_active, display_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      ON CONFLICT (slug) DO UPDATE SET
        parent_id = EXCLUDED.parent_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        services = EXCLUDED.services,
        placeholder_text = EXCLUDED.placeholder_text,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = EXCLUDED.updated_at
      RETURNING id, parent_id as "parentId", name, slug, description,
                services, placeholder_text as "placeholderText", is_active as "isActive",
                display_order as "displayOrder",
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const res = await this.pool.query(query, [
      id,
      data.parentId,
      data.name.trim(),
      data.slug.toLowerCase().trim(),
      data.description || null,
      JSON.stringify(data.services || []),
      JSON.stringify(data.placeholderText || null),
      data.isActive ?? true,
      data.displayOrder || 1,
      now,
    ]);
    const r = res.rows[0];
    return {
      ...r,
      services: Array.isArray(r.services) ? r.services : JSON.parse(r.services || "[]"),
      isActive: Boolean(r.isActive),
    };
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; error?: string }> {
    await this.init();
    const bizCount = await this.countBusinessesBySubcategory(id);
    if (bizCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: ${bizCount} active business(es) are assigned to it.`,
      };
    }
    const res = await this.pool.query("DELETE FROM subcategories WHERE id = $1", [id]);
    return { success: (res.rowCount ?? 0) > 0 };
  }

  // ==========================================
  // BUSINESSES
  // ==========================================
  async getBusinessBySlug(slug: string): Promise<Business | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, client_id as "clientId", client_name as "clientName",
              name, slug, parent_category_id as "parentCategoryId",
              parent_category_name as "parentCategoryName",
              subcategory_id as "subcategoryId", subcategory_name as "subcategoryName",
              category_id as "categoryId", category_name as "categoryName",
              google_review_url as "googleReviewUrl", logo_url as "logoUrl",
              description, accent_color as "accentColor", custom_services as "customServices",
              status, is_active as "isActive", contact_email as "contactEmail",
              contact_phone as "contactPhone", address,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       WHERE LOWER(slug) = LOWER($1) AND status != 'deleted' AND is_active = TRUE LIMIT 1`,
      [slug.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.mapBusinessRow(res.rows[0]);
  }

  async getBusinessesByClient(clientId: string): Promise<Business[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, client_id as "clientId", client_name as "clientName",
              name, slug, parent_category_id as "parentCategoryId",
              parent_category_name as "parentCategoryName",
              subcategory_id as "subcategoryId", subcategory_name as "subcategoryName",
              category_id as "categoryId", category_name as "categoryName",
              google_review_url as "googleReviewUrl", logo_url as "logoUrl",
              description, accent_color as "accentColor", custom_services as "customServices",
              status, is_active as "isActive", contact_email as "contactEmail",
              contact_phone as "contactPhone", address,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       WHERE client_id = $1 AND status != 'deleted'
       ORDER BY updated_at DESC`,
      [clientId]
    );
    return res.rows.map(this.mapBusinessRow);
  }

  async getAllBusinesses(includeDeleted = false): Promise<Business[]> {
    await this.init();
    const filter = includeDeleted ? "" : "WHERE status != 'deleted'";
    const res = await this.pool.query(
      `SELECT id, client_id as "clientId", client_name as "clientName",
              name, slug, parent_category_id as "parentCategoryId",
              parent_category_name as "parentCategoryName",
              subcategory_id as "subcategoryId", subcategory_name as "subcategoryName",
              category_id as "categoryId", category_name as "categoryName",
              google_review_url as "googleReviewUrl", logo_url as "logoUrl",
              description, accent_color as "accentColor", custom_services as "customServices",
              status, is_active as "isActive", contact_email as "contactEmail",
              contact_phone as "contactPhone", address,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       ${filter}
       ORDER BY updated_at DESC`
    );
    return res.rows.map(this.mapBusinessRow);
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string },
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<Business> {
    await this.init();
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = data.slug.toLowerCase().trim();

    // Check ownership if client
    if (userRole === "client" && data.id) {
      const existing = await this.pool.query("SELECT client_id FROM businesses WHERE id = $1", [data.id]);
      if (existing.rows.length > 0 && existing.rows[0].client_id && existing.rows[0].client_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to modify this business.");
      }
    }

    const query = `
      INSERT INTO businesses (
        id, client_id, client_name, name, slug,
        parent_category_id, parent_category_name, subcategory_id, subcategory_name,
        category_id, category_name, google_review_url, logo_url,
        description, accent_color, custom_services, status, is_active,
        contact_email, contact_phone, address, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $22)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        client_id = COALESCE(businesses.client_id, EXCLUDED.client_id),
        client_name = COALESCE(businesses.client_name, EXCLUDED.client_name),
        parent_category_id = EXCLUDED.parent_category_id,
        parent_category_name = EXCLUDED.parent_category_name,
        subcategory_id = EXCLUDED.subcategory_id,
        subcategory_name = EXCLUDED.subcategory_name,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        google_review_url = EXCLUDED.google_review_url,
        logo_url = EXCLUDED.logo_url,
        description = EXCLUDED.description,
        accent_color = EXCLUDED.accent_color,
        custom_services = EXCLUDED.custom_services,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        address = EXCLUDED.address,
        updated_at = EXCLUDED.updated_at
      RETURNING id, client_id as "clientId", client_name as "clientName",
                name, slug, parent_category_id as "parentCategoryId",
                parent_category_name as "parentCategoryName",
                subcategory_id as "subcategoryId", subcategory_name as "subcategoryName",
                category_id as "categoryId", category_name as "categoryName",
                google_review_url as "googleReviewUrl", logo_url as "logoUrl",
                description, accent_color as "accentColor", custom_services as "customServices",
                status, is_active as "isActive", contact_email as "contactEmail",
                contact_phone as "contactPhone", address,
                created_at as "createdAt", updated_at as "updatedAt";
    `;

    const values = [
      id,
      data.clientId || userId,
      data.clientName || null,
      data.name.trim(),
      slug,
      data.parentCategoryId || null,
      data.parentCategoryName || null,
      data.subcategoryId || null,
      data.subcategoryName || null,
      data.categoryId || data.subcategoryId || null,
      data.categoryName || data.subcategoryName || null,
      data.googleReviewUrl.trim(),
      data.logoUrl?.trim() || null,
      data.description?.trim() || null,
      data.accentColor?.trim() || "#16a34a",
      JSON.stringify(data.customServices || []),
      data.status || "active",
      data.isActive ?? true,
      data.contactEmail || null,
      data.contactPhone || null,
      data.address || null,
      now,
    ];

    const res = await this.pool.query(query, values);
    const saved = this.mapBusinessRow(res.rows[0]);

    await this.addAuditLog({
      businessId: saved.id,
      businessName: saved.name,
      userId,
      userRole,
      action: data.id ? "update" : "create",
      details: { name: saved.name, slug: saved.slug },
    });

    return saved;
  }

  async softDeleteBusiness(
    id: string,
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<boolean> {
    await this.init();
    if (userRole === "client") {
      const existing = await this.pool.query("SELECT client_id FROM businesses WHERE id = $1", [id]);
      if (existing.rows.length > 0 && existing.rows[0].client_id && existing.rows[0].client_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to delete this business.");
      }
    }
    const res = await this.pool.query(
      `UPDATE businesses SET status = 'deleted', is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING name`,
      [id]
    );
    if ((res.rowCount ?? 0) > 0) {
      await this.addAuditLog({
        businessId: id,
        businessName: res.rows[0]?.name,
        userId,
        userRole,
        action: "delete",
      });
      return true;
    }
    return false;
  }

  async deleteBusiness(
    id: string,
    userId = "system",
    userRole: "admin" | "client" = "admin"
  ): Promise<boolean> {
    return this.softDeleteBusiness(id, userId, userRole);
  }

  async countBusinessesByParentCategory(parentCategoryId: string): Promise<number> {
    await this.init();
    const res = await this.pool.query(
      `SELECT COUNT(*) FROM businesses WHERE parent_category_id = $1 AND status != 'deleted' AND is_active = TRUE`,
      [parentCategoryId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async countBusinessesBySubcategory(subcategoryId: string): Promise<number> {
    await this.init();
    const res = await this.pool.query(
      `SELECT COUNT(*) FROM businesses WHERE (subcategory_id = $1 OR category_id = $1) AND status != 'deleted' AND is_active = TRUE`,
      [subcategoryId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(businessId?: string): Promise<BusinessAuditLog[]> {
    await this.init();
    let query = `
      SELECT id, business_id as "businessId", business_name as "businessName",
             user_id as "userId", user_email as "userEmail", user_role as "userRole",
             action, details, timestamp
      FROM business_audit_logs
    `;
    const params: unknown[] = [];
    if (businessId) {
      query += ` WHERE business_id = $1`;
      params.push(businessId);
    }
    query += ` ORDER BY timestamp DESC LIMIT 100`;

    const res = await this.pool.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
      timestamp: new Date(String(r.timestamp)).toISOString(),
    }));
  }

  async addAuditLog(
    log: Omit<BusinessAuditLog, "id" | "timestamp">
  ): Promise<BusinessAuditLog> {
    await this.init();
    const id = `audit-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO business_audit_logs (id, business_id, business_name, user_id, user_email, user_role, action, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, business_id as "businessId", business_name as "businessName",
                user_id as "userId", user_email as "userEmail", user_role as "userRole",
                action, details, timestamp;
    `;
    const res = await this.pool.query(query, [
      id,
      log.businessId,
      log.businessName || null,
      log.userId,
      log.userEmail || null,
      log.userRole,
      log.action,
      JSON.stringify(log.details || {}),
      now,
    ]);
    const r = res.rows[0];
    return {
      ...r,
      details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
      timestamp: new Date(String(r.timestamp)).toISOString(),
    };
  }

  // ==========================================
  // LEGACY CATEGORIES
  // ==========================================
  async getAllCategories(): Promise<BusinessCategory[]> {
    const subcats = await this.getAllSubcategories();
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

  private mapBusinessRow(row: Record<string, unknown>): Business {
    return {
      id: String(row.id),
      clientId: row.clientId ? String(row.clientId) : undefined,
      clientName: row.clientName ? String(row.clientName) : undefined,
      name: String(row.name),
      slug: String(row.slug),
      parentCategoryId: row.parentCategoryId ? String(row.parentCategoryId) : undefined,
      parentCategoryName: row.parentCategoryName ? String(row.parentCategoryName) : undefined,
      subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined,
      subcategoryName: row.subcategoryName ? String(row.subcategoryName) : undefined,
      categoryId: row.categoryId ? String(row.categoryId) : undefined,
      categoryName: row.categoryName ? String(row.categoryName) : undefined,
      googleReviewUrl: String(row.googleReviewUrl),
      logoUrl: row.logoUrl ? String(row.logoUrl) : undefined,
      description: row.description ? String(row.description) : undefined,
      accentColor: row.accentColor ? String(row.accentColor) : undefined,
      customServices: Array.isArray(row.customServices)
        ? (row.customServices as string[])
        : JSON.parse(String(row.customServices || "[]")),
      status: (row.status as "active" | "archived" | "deleted") || "active",
      isActive: Boolean(row.isActive ?? true),
      contactEmail: row.contactEmail ? String(row.contactEmail) : undefined,
      contactPhone: row.contactPhone ? String(row.contactPhone) : undefined,
      address: row.address ? String(row.address) : undefined,
      createdAt: new Date(String(row.createdAt)).toISOString(),
      updatedAt: new Date(String(row.updatedAt)).toISOString(),
    };
  }
}
