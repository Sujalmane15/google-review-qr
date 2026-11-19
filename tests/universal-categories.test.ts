import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { JsonStorageAdapter } from "@/lib/storage/json-adapter";
import { INITIAL_CATEGORIES } from "@/lib/categories";

describe("Universal Business Category & Isolation Tests", () => {
  const testDbPath = path.join(process.cwd(), "data", "test-universal-businesses.json");
  let adapter: JsonStorageAdapter;

  beforeAll(async () => {
    try {
      await fs.unlink(testDbPath);
      await fs.unlink(path.join(process.cwd(), "data", "categories.json"));
    } catch {
      // Ignore
    }
    adapter = new JsonStorageAdapter(testDbPath);
    await adapter.init();
  });

  it("should initialize with IT & Technology Company for RMSolution Tech and NOT food", async () => {
    const rmsolution = await adapter.getBusinessBySlug("rmsolution-tech");
    expect(rmsolution).not.toBeNull();
    expect(rmsolution?.name).toBe("RMSolution Tech");
    expect(rmsolution?.categoryName).toBe("IT & Technology Companies");
    // Confirm services do NOT contain Food
    expect(rmsolution?.customServices).toContain("Web Development");
    expect(rmsolution?.customServices).toContain("App Development");
    expect(rmsolution?.customServices).not.toContain("Food");
    expect(rmsolution?.customServices).not.toContain("Ambience");
  });

  it("should have initial universal categories pre-seeded", async () => {
    const categories = await adapter.getAllCategories();
    expect(categories.length).toBeGreaterThanOrEqual(12);

    const itCat = categories.find((c) => c.slug === "it-tech");
    expect(itCat).toBeDefined();
    expect(itCat?.services).toContain("Web Development");

    const hospitalCat = categories.find((c) => c.slug === "hospital-healthcare");
    expect(hospitalCat).toBeDefined();
    expect(hospitalCat?.services).toContain("Doctor Consultation");

    const hotelCat = categories.find((c) => c.slug === "hotel-hospitality");
    expect(hotelCat).toBeDefined();
    expect(hotelCat?.services).toContain("Room Cleanliness");
  });

  it("should dynamically add a brand new category and persist it", async () => {
    const createdCat = await adapter.upsertCategory({
      name: "Solar & Renewable Energy",
      slug: "solar-renewable",
      description: "Solar panel installers and clean tech.",
      isActive: true,
      services: ["Panel Efficiency", "Installation Speed", "Warranty Support", "Energy Savings"],
    });

    expect(createdCat.id).toBeDefined();
    expect(createdCat.slug).toBe("solar-renewable");

    const fetched = await adapter.getCategoryById(createdCat.id);
    expect(fetched?.name).toBe("Solar & Renewable Energy");
    expect(fetched?.services).toContain("Panel Efficiency");
  });

  it("should isolate services: Hospital category services must never contain IT tags", async () => {
    const hospital = await adapter.getCategoryById("cat-hospital-healthcare");
    expect(hospital?.services).not.toContain("Web Development");
    expect(hospital?.services).not.toContain("Mobile App Development");
  });

  it("should allow deactivating a category", async () => {
    const itCat = await adapter.getCategoryById("cat-it-tech");
    expect(itCat).not.toBeNull();

    const updated = await adapter.upsertCategory({
      ...itCat!,
      isActive: false,
    });
    expect(updated.isActive).toBe(false);

    const recheck = await adapter.getCategoryById("cat-it-tech");
    expect(recheck?.isActive).toBe(false);
  });
});
