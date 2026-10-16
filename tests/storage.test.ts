import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { JsonStorageAdapter } from "@/lib/storage/json-adapter";

describe("Storage Adapter (Local Dev & Verification)", () => {
  const testDbPath = path.join(process.cwd(), "data", "test-businesses.json");
  let adapter: JsonStorageAdapter;

  beforeAll(async () => {
    // Clean up test file if exists
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore
    }
    adapter = new JsonStorageAdapter(testDbPath);
    await adapter.init();
  });

  it("should initialize with the seed business 'Kartik Restaurant & Bar'", async () => {
    const kartik = await adapter.getBusinessBySlug("kartik-restaurant-bar");
    expect(kartik).not.toBeNull();
    expect(kartik?.name).toBe("Kartik Restaurant & Bar");
    expect(kartik?.googleReviewUrl).toContain("example-kartik-restaurant");
  });

  it("should create a new business profile", async () => {
    const created = await adapter.upsertBusiness({
      name: "Spice Symphony",
      slug: "spice-symphony",
      googleReviewUrl: "https://g.page/r/spice-symphony/review",
      description: "Fine Indian dining",
      accentColor: "#f59e0b",
    });

    expect(created.id).toBeDefined();
    expect(created.slug).toBe("spice-symphony");

    const fetched = await adapter.getBusinessBySlug("spice-symphony");
    expect(fetched?.name).toBe("Spice Symphony");
  });

  it("should update an existing business profile", async () => {
    const existing = await adapter.getBusinessBySlug("spice-symphony");
    expect(existing).not.toBeNull();

    const updated = await adapter.upsertBusiness({
      id: existing!.id,
      name: "Spice Symphony Premium",
      slug: "spice-symphony",
      googleReviewUrl: existing!.googleReviewUrl,
      description: "Updated description",
    });

    expect(updated.name).toBe("Spice Symphony Premium");
    expect(updated.description).toBe("Updated description");
  });

  it("should delete a business by id", async () => {
    const toDelete = await adapter.getBusinessBySlug("spice-symphony");
    expect(toDelete).not.toBeNull();

    const deleted = await adapter.deleteBusiness(toDelete!.id);
    expect(deleted).toBe(true);

    const check = await adapter.getBusinessBySlug("spice-symphony");
    expect(check).toBeNull();
  });

  it("should persist records across simulated server restarts", async () => {
    // 1. Create a business on the first adapter instance
    await adapter.upsertBusiness({
      name: "Restart Resilience Bistro",
      slug: "restart-resilience-bistro",
      googleReviewUrl: "https://g.page/r/restart-resilience/review",
      description: "Persists through restarts",
    });

    // 2. Simulate complete server shutdown & fresh restart by initializing a brand new adapter instance
    const restartedAdapter = new JsonStorageAdapter(testDbPath);
    await restartedAdapter.init();

    // 3. Confirm that the record created before shutdown persists intact
    const persisted = await restartedAdapter.getBusinessBySlug("restart-resilience-bistro");
    expect(persisted).not.toBeNull();
    expect(persisted?.name).toBe("Restart Resilience Bistro");
    expect(persisted?.description).toBe("Persists through restarts");
  });
});
