import { Pool } from "pg";
import crypto from "crypto";
import { Business } from "@/types";
import { StorageAdapter } from "./adapter";
import { SEED_BUSINESS } from "./json-adapter";

/**
 * PostgreSQL Storage Adapter (Production Ready for Neon, Supabase, Vercel Postgres).
 * Handles automatic schema initialization, parameterized queries, and connection pooling.
 */
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
      CREATE TABLE IF NOT EXISTS businesses (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        google_review_url TEXT NOT NULL,
        logo_url TEXT,
        description TEXT,
        accent_color VARCHAR(16),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
    `;

    await this.pool.query(query);

    // Seed default if table is empty
    const countRes = await this.pool.query("SELECT COUNT(*) FROM businesses");
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await this.upsertBusiness(SEED_BUSINESS);
    }

    this.isInitialized = true;
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, google_review_url as "googleReviewUrl", 
              logo_url as "logoUrl", description, accent_color as "accentColor",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [slug.trim()]
    );

    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  async getAllBusinesses(): Promise<Business[]> {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, name, slug, google_review_url as "googleReviewUrl", 
              logo_url as "logoUrl", description, accent_color as "accentColor",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM businesses 
       ORDER BY updated_at DESC`
    );
    return res.rows.map(this.mapRow);
  }

  async upsertBusiness(
    data: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<Business> {
    await this.init();
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = data.slug.toLowerCase().trim();

    const query = `
      INSERT INTO businesses (id, name, slug, google_review_url, logo_url, description, accent_color, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        google_review_url = EXCLUDED.google_review_url,
        logo_url = EXCLUDED.logo_url,
        description = EXCLUDED.description,
        accent_color = EXCLUDED.accent_color,
        updated_at = EXCLUDED.updated_at
      RETURNING id, name, slug, google_review_url as "googleReviewUrl",
                logo_url as "logoUrl", description, accent_color as "accentColor",
                created_at as "createdAt", updated_at as "updatedAt";
    `;

    const values = [
      id,
      data.name.trim(),
      slug,
      data.googleReviewUrl.trim(),
      data.logoUrl?.trim() || null,
      data.description?.trim() || null,
      data.accentColor?.trim() || null,
      now,
    ];

    const res = await this.pool.query(query, values);
    return this.mapRow(res.rows[0]);
  }

  async deleteBusiness(id: string): Promise<boolean> {
    await this.init();
    const res = await this.pool.query(`DELETE FROM businesses WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapRow(row: Record<string, unknown>): Business {
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      googleReviewUrl: String(row.googleReviewUrl),
      logoUrl: row.logoUrl ? String(row.logoUrl) : undefined,
      description: row.description ? String(row.description) : undefined,
      accentColor: row.accentColor ? String(row.accentColor) : undefined,
      createdAt: new Date(String(row.createdAt)).toISOString(),
      updatedAt: new Date(String(row.updatedAt)).toISOString(),
    };
  }
}
