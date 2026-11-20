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
    expect(rmsolution?.parentCategoryName).toBe("Information Technology");
    expect(rmsolution?.subcategoryName).toBe("IT Company");
    expect(rmsolution?.isPlatformProvider).toBe(true);
    expect(rmsolution?.reviewQuestion).toBe("What did you appreciate about our IT & technology delivery?");
    
    // Confirm services do NOT contain Food or Restaurant items
    expect(rmsolution?.customServices).toContain("Web Development");
    expect(rmsolution?.customServices).toContain("App Development");
    expect(rmsolution?.customServices).toContain("Technical Expertise");
    expect(rmsolution?.customServices).toContain("Code Quality");
    expect(rmsolution?.customServices).not.toContain("Food");
    expect(rmsolution?.customServices).not.toContain("Food Quality & Taste");
    expect(rmsolution?.customServices).not.toContain("Drinks & Cocktails");
    expect(rmsolution?.customServices).not.toContain("Ambience");
  });

  it("Scenario 1 & 5: Universal parent categories list must contain 13 universal categories and NOT have Hospitality as default #1", async () => {
    const parents = await adapter.getAllParentCategories();
    expect(parents.length).toBeGreaterThanOrEqual(13);
    
    // Verify Information Technology is the first display priority, not Hospitality
    expect(parents[0].name).toBe("Information Technology");
    
    // Verify Hospitality exists without '& Food Services'
    const hospitality = parents.find((p) => p.slug === "hospitality");
    expect(hospitality).toBeDefined();
    expect(hospitality?.name).toBe("Hospitality");
    expect(hospitality?.name).not.toContain("Food Services");
  });

  it("Scenario 2: Hotel profile has hotel-specific questions and tags, no food defaults", async () => {
    const hotelSub = await adapter.getSubcategoryById("cat-hotel-hospitality");
    expect(hotelSub).not.toBeNull();
    expect(hotelSub?.reviewQuestion).toBe("What did you appreciate about your stay?");
    expect(hotelSub?.services).toContain("Room Cleanliness");
    expect(hotelSub?.services).toContain("Staff Behaviour");
    expect(hotelSub?.services).toContain("Hospitality");
    expect(hotelSub?.services).toContain("Facilities");
    expect(hotelSub?.services).not.toContain("Food Quality & Taste");
    expect(hotelSub?.services).not.toContain("Drinks & Cocktails");
  });

  it("Scenario 3: Hospital profile has healthcare-specific questions and tags", async () => {
    const hospitalSub = await adapter.getSubcategoryById("cat-hospital-healthcare");
    expect(hospitalSub).not.toBeNull();
    expect(hospitalSub?.reviewQuestion).toBe("What stood out during your healthcare appointment or visit?");
    expect(hospitalSub?.services).toContain("Doctor Consultation");
    expect(hospitalSub?.services).toContain("Nursing Care");
    expect(hospitalSub?.services).toContain("Cleanliness & Hygiene");
    expect(hospitalSub?.services).toContain("Staff Behaviour");
    expect(hospitalSub?.services).not.toContain("Web Development");
    expect(hospitalSub?.services).not.toContain("Food Quality & Taste");
  });

  it("Scenario 4: IT Company profile has tech-specific questions and tags", async () => {
    const itSub = await adapter.getSubcategoryById("cat-it-tech");
    expect(itSub).not.toBeNull();
    expect(itSub?.reviewQuestion).toBe("What did you appreciate about our IT & technology delivery?");
    expect(itSub?.services).toContain("Technical Expertise");
    expect(itSub?.services).toContain("Code Quality");
    expect(itSub?.services).toContain("Communication");
    expect(itSub?.services).toContain("Project Delivery");
    expect(itSub?.services).not.toContain("Food Quality & Taste");
  });

  it("Scenario 5: Supermarket profile has retail-specific questions and tags", async () => {
    const superSub = await adapter.getSubcategoryById("cat-supermarket-retail");
    expect(superSub).not.toBeNull();
    expect(superSub?.reviewQuestion).toBe("What did you like most about shopping with us?");
    expect(superSub?.services).toContain("Product Availability");
    expect(superSub?.services).toContain("Pricing");
    expect(superSub?.services).toContain("Staff Behaviour");
    expect(superSub?.services).toContain("Store Cleanliness");
    expect(superSub?.services).not.toContain("Doctor Consultation");
    expect(superSub?.services).not.toContain("Drinks & Cocktails");
  });

  it("Scenario 6: Restaurant profile retains dining questions and tags when explicitly chosen", async () => {
    const restSub = await adapter.getSubcategoryById("sub-restaurant-bar");
    expect(restSub).not.toBeNull();
    expect(restSub?.reviewQuestion).toBe("What did you enjoy most about your dining experience?");
    expect(restSub?.services).toContain("Food Quality & Taste");
    expect(restSub?.services).toContain("Drinks & Cocktails");
    expect(restSub?.services).toContain("Ambience & Music");

    // Kartik Restaurant & Bar seed
    const kartik = await adapter.getBusinessBySlug("kartik-restaurant-bar");
    expect(kartik).not.toBeNull();
    expect(kartik?.name).toBe("Kartik Restaurant & Bar");
    expect(kartik?.customServices).toContain("Food Quality & Taste");
    expect(kartik?.customServices).toContain("Drinks & Cocktails");
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
