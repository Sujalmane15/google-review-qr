import { Pool } from "pg";
import crypto from "crypto";
import { Business, BusinessCategory } from "@/types";
import { StorageAdapter } from "./adapter";
import { SEED_BUSINESSES } from "./json-adapter";
import { INITIAL_CATEGORIES } from "@/lib/categories";

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
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        category_id VARCHAR(64),
        category_name VARCHAR(120),
        google_review_url TEXT NOT NULL,
        logo_url TEXT,
        description TEXT,
        accent_color VARCHAR(16),
        custom_services JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON business_categories(slug);
    `;

    await this.pool.query(query);

    // Seed categories if empty
    const catCount = await this.pool.query("SELECT COUNT(*) FROM business_categories");
    if (parseInt(catCount.rows[0].count, 10) === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await this.upsertCategory(cat);
      }
    }

    // Seed businesses if empty
    const countRes = await this.pool.query("SELECT COUNT(*) FROM businesses");
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const b of SEED_BUSINESSES) {
        await this.upsertBusiness(b);
      }
    }

    this.isInitialized = true;
  }

  // --- Categories ---
  async getAllCategories(): Promise<BusinessCategory[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, description, icon, is_active as "isActive",
              services, placeholder_text as "placeholderText",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM business_categories ORDER BY name ASC`
    );
    return res.rows.map((r) => ({
      ...r,
      services: Array.isArray(r.services) ? r.services : JSON.parse(r.services || "[]"),
      isActive: Boolean(r.isActive),
    }));
  }

  async getCategoryById(id: string): Promise<BusinessCategory | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, description, icon, is_active as "isActive",
              services, placeholder_text as "placeholderText",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM business_categories WHERE id = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
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

  async upsertCategory(
    data: Omit<BusinessCategory, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<BusinessCategory> {
    await this.init();
    const id = data.id || `cat-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const slug = data.slug.toLowerCase().trim();

    const query = `
      INSERT INTO business_categories (id, name, slug, description, icon, is_active, services, placeholder_text, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        is_active = EXCLUDED.is_active,
        services = EXCLUDED.services,
        placeholder_text = EXCLUDED.placeholder_text,
        updated_at = EXCLUDED.updated_at
      RETURNING id, name, slug, description, icon, is_active as "isActive",
                services, placeholder_text as "placeholderText",
                created_at as "createdAt", updated_at as "updatedAt";
    `;

    const res = await this.pool.query(query, [
      id,
      data.name.trim(),
      slug,
      data.description || null,
      data.icon || null,
      data.isActive ?? true,
      JSON.stringify(data.services || []),
      JSON.stringify(data.placeholderText || null),
      now,
    ]);

    const r = res.rows[0];
    return {
      ...r,
      services: Array.isArray(r.services) ? r.services : JSON.parse(r.services || "[]"),
      isActive: Boolean(r.isActive),
    };
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.init();
    const res = await this.pool.query("DELETE FROM business_categories WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Businesses ---
  async getBusinessBySlug(slug: string): Promise<Business | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, category_id as "categoryId", category_name as "categoryName",
              google_review_url as "googleReviewUrl", logo_url as "logoUrl",
              description, accent_color as "accentColor", custom_services as "customServices",
              is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [slug.trim()]
    );

    if (res.rows.length === 0) return null;
    return this.mapBusinessRow(res.rows[0]);
  }

  async getAllBusinesses(): Promise<Business[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, category_id as "categoryId", category_name as "categoryName",
              google_review_url as "googleReviewUrl", logo_url as "logoUrl",
              description, accent_color as "accentColor", custom_services as "customServices",
              is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       ORDER BY updated_at DESC`
    );
    return res.rows.map(this.mapBusinessRow);
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business> {
    await this.init();
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = data.slug.toLowerCase().trim();

    const query = `
      INSERT INTO businesses (id, name, slug, category_id, category_name, google_review_url, logo_url, description, accent_color, custom_services, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        google_review_url = EXCLUDED.google_review_url,
        logo_url = EXCLUDED.logo_url,
        description = EXCLUDED.description,
        accent_color = EXCLUDED.accent_color,
        custom_services = EXCLUDED.custom_services,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at
      RETURNING id, name, slug, category_id as "categoryId", category_name as "categoryName",
                google_review_url as "googleReviewUrl", logo_url as "logoUrl",
                description, accent_color as "accentColor", custom_services as "customServices",
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt";
    `;

    const values = [
      id,
      data.name.trim(),
      slug,
      data.categoryId || null,
      data.categoryName || null,
      data.googleReviewUrl.trim(),
      data.logoUrl?.trim() || null,
      data.description?.trim() || null,
      data.accentColor?.trim() || null,
      JSON.stringify(data.customServices || []),
      data.isActive ?? true,
      now,
    ];

    const res = await this.pool.query(query, values);
    return this.mapBusinessRow(res.rows[0]);
  }

  async deleteBusiness(id: string): Promise<boolean> {
    await this.init();
    const res = await this.pool.query(`DELETE FROM businesses WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapBusinessRow(row: Record<string, unknown>): Business {
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      categoryId: row.categoryId ? String(row.categoryId) : undefined,
      categoryName: row.categoryName ? String(row.categoryName) : undefined,
      googleReviewUrl: String(row.googleReviewUrl),
      logoUrl: row.logoUrl ? String(row.logoUrl) : undefined,
      description: row.description ? String(row.description) : undefined,
      accentColor: row.accentColor ? String(row.accentColor) : undefined,
      customServices: Array.isArray(row.customServices)
        ? (row.customServices as string[])
        : JSON.parse(String(row.customServices || "[]")),
      isActive: Boolean(row.isActive ?? true),
      createdAt: new Date(String(row.createdAt)).toISOString(),
      updatedAt: new Date(String(row.updatedAt)).toISOString(),
    };
  }
}
