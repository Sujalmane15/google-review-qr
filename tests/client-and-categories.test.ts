import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { JsonStorageAdapter } from "@/lib/storage/json-adapter";

describe("Client Management & Dynamic Category Architecture Tests", () => {
  const testDbPath = path.join(process.cwd(), "data", "test-client-system.json");
  let adapter: JsonStorageAdapter;

  beforeAll(async () => {
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore
    }
    adapter = new JsonStorageAdapter(testDbPath);
    await adapter.init();
  });

  it("Scenario 1: Client can register and add a Hotel business", async () => {
    // 1. Create client user
    const clientUser = await adapter.upsertUser({
      name: "Grand Hotelier",
      email: "hotelier@grandhotel.com",
      role: "client",
      companyName: "Grand Hotel Group",
    });

    expect(clientUser.id).toBeDefined();
    expect(clientUser.role).toBe("client");

    // 2. Add Hotel business
    const hotel = await adapter.upsertBusiness(
      {
        clientId: clientUser.id,
        name: "ABC Grand Hotel",
        slug: "abc-grand-hotel",
        parentCategoryId: "pcat-hospitality",
        parentCategoryName: "Hospitality & Food Services",
        subcategoryId: "cat-hotel-hospitality",
        subcategoryName: "Hotel & Hospitality",
        googleReviewUrl: "https://g.page/r/abc-grand-hotel/review",
        description: "Luxury stay, pristine suites, and panoramic views.",
        customServices: ["Room Cleanliness", "Guest Hospitality", "Amenities & Pool"],
        isActive: true,
      },
      clientUser.id,
      "client"
    );

    expect(hotel.id).toBeDefined();
    expect(hotel.clientId).toBe(clientUser.id);
    expect(hotel.name).toBe("ABC Grand Hotel");
    expect(hotel.subcategoryName).toBe("Hotel & Hospitality");

    // Verify it is retrievable by slug
    const fetched = await adapter.getBusinessBySlug("abc-grand-hotel");
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("ABC Grand Hotel");
  });

  it("Scenario 2: Client can add a Hospital business", async () => {
    const clientUser = await adapter.upsertUser({
      name: "Dr. Sharma",
      email: "director@metrohospital.org",
      role: "client",
      companyName: "Metro Healthcare",
    });

    const hospital = await adapter.upsertBusiness(
      {
        clientId: clientUser.id,
        name: "Metro Multispecialty Hospital",
        slug: "metro-multispecialty-hospital",
        parentCategoryId: "pcat-healthcare",
        parentCategoryName: "Hospital & Healthcare",
        subcategoryId: "cat-hospital-healthcare",
        subcategoryName: "Hospital & Healthcare",
        googleReviewUrl: "https://g.page/r/metro-hospital/review",
        description: "24/7 emergency care, advanced diagnostics, and specialist surgery.",
        customServices: ["Doctor Consultation", "Nursing Care", "Cleanliness & Hygiene"],
        isActive: true,
      },
      clientUser.id,
      "client"
    );

    expect(hospital.name).toBe("Metro Multispecialty Hospital");
    expect(hospital.parentCategoryName).toBe("Hospital & Healthcare");
  });

  it("Scenario 3: Client can add an IT Company business", async () => {
    const clientUser = await adapter.upsertUser({
      name: "Nexus Tech Lead",
      email: "contact@nexuscloud.io",
      role: "client",
      companyName: "Nexus Cloud Technologies",
    });

    const itCompany = await adapter.upsertBusiness(
      {
        clientId: clientUser.id,
        name: "Nexus Cloud Technologies",
        slug: "nexus-cloud-tech",
        parentCategoryId: "pcat-technology",
        parentCategoryName: "IT & Technology Companies",
        subcategoryId: "cat-it-tech",
        subcategoryName: "IT & Technology Companies",
        googleReviewUrl: "https://g.page/r/nexus-cloud/review",
        description: "Enterprise SaaS, cloud migration, and bespoke mobile application development.",
        customServices: ["Web Development", "Mobile App Development", "Code Quality", "On-Time Delivery"],
        isActive: true,
      },
      clientUser.id,
      "client"
    );

    expect(itCompany.name).toBe("Nexus Cloud Technologies");
    expect(itCompany.customServices).not.toContain("Food");
  });

  it("Scenario 4: Client can add Kartik Restaurant & Bar with dining services", async () => {
    const kartikUser = await adapter.upsertUser({
      name: "Kartik Patil",
      email: "kartik@kartikbar.com",
      role: "client",
      companyName: "Kartik Restaurant & Bar",
    });

    const restaurant = await adapter.upsertBusiness(
      {
        clientId: kartikUser.id,
        name: "Kartik Restaurant & Bar",
        slug: "kartik-restaurant-and-bar",
        parentCategoryId: "pcat-hospitality",
        parentCategoryName: "Hospitality & Food Services",
        subcategoryId: "sub-restaurant-bar",
        subcategoryName: "Restaurant & Bar",
        googleReviewUrl: "https://g.page/r/CZk4sitKj1QqEBM/review",
        description: "Authentic multicuisine dining, warm hospitality, and memorable moments.",
        accentColor: "#16a34a",
        customServices: [
          "Food Quality & Taste",
          "Drinks & Cocktails",
          "Ambience & Music",
          "Quick & Polite Service",
          "Staff Courtesy",
        ],
        isActive: true,
      },
      kartikUser.id,
      "client"
    );

    expect(restaurant.name).toBe("Kartik Restaurant & Bar");
    expect(restaurant.customServices).toContain("Drinks & Cocktails");
    expect(restaurant.customServices).toContain("Food Quality & Taste");
  });

  it("Scenario 5: Client can edit their own business details", async () => {
    const business = await adapter.getBusinessBySlug("abc-grand-hotel");
    expect(business).not.toBeNull();

    const updated = await adapter.upsertBusiness(
      {
        id: business!.id,
        name: "ABC Grand Hotel & Suites",
        slug: business!.slug,
        googleReviewUrl: business!.googleReviewUrl,
        description: "Upgraded 5-star suites and rooftop restaurant.",
      },
      business!.clientId,
      "client"
    );

    expect(updated.name).toBe("ABC Grand Hotel & Suites");
    expect(updated.description).toBe("Upgraded 5-star suites and rooftop restaurant.");
  });

  it("Scenario 6: Client CANNOT modify or delete another client's business (Strict Ownership Isolation)", async () => {
    const hotel = await adapter.getBusinessBySlug("abc-grand-hotel");
    expect(hotel).not.toBeNull();

    const attackerId = "client-attacker-999";

    // Attempt unauthorized update
    await expect(
      adapter.upsertBusiness(
        {
          id: hotel!.id,
          name: "Hacked Hotel",
          slug: hotel!.slug,
          googleReviewUrl: hotel!.googleReviewUrl,
        },
        attackerId,
        "client"
      )
    ).rejects.toThrow("Unauthorized");

    // Attempt unauthorized delete
    await expect(
      adapter.softDeleteBusiness(hotel!.id, attackerId, "client")
    ).rejects.toThrow("Unauthorized");
  });

  it("Scenario 7: Client can delete their own business (Soft Delete)", async () => {
    const itCompany = await adapter.getBusinessBySlug("nexus-cloud-tech");
    expect(itCompany).not.toBeNull();

    const deleted = await adapter.softDeleteBusiness(
      itCompany!.id,
      itCompany!.clientId,
      "client"
    );
    expect(deleted).toBe(true);

    // Business is now hidden from public getBusinessBySlug
    const fetched = await adapter.getBusinessBySlug("nexus-cloud-tech");
    expect(fetched).toBeNull();

    // Verify audit log has recorded the deletion
    const logs = await adapter.getAuditLogs(itCompany!.id);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("delete");
  });

  it("Scenario 8: Admin can dynamically add a new Parent Category and Subcategory", async () => {
    // 1. Add Parent Category
    const newParent = await adapter.upsertParentCategory({
      name: "Aerospace & Aviation",
      slug: "aerospace-aviation",
      description: "Flight training, aircraft maintenance, and avionics systems.",
      isActive: true,
      displayOrder: 20,
    });

    expect(newParent.id).toBeDefined();
    expect(newParent.name).toBe("Aerospace & Aviation");

    // 2. Add Subcategory under the new Parent
    const newSub = await adapter.upsertSubcategory({
      parentId: newParent.id,
      name: "Flight Training Academy",
      slug: "flight-training-academy",
      services: ["Flight Simulators", "Experienced Instructors", "Safety Standards", "Modern Aircraft"],
      isActive: true,
      displayOrder: 1,
    });

    expect(newSub.id).toBeDefined();
    expect(newSub.parentId).toBe(newParent.id);

    // Verify subcategory is retrievable by parent ID
    const subs = await adapter.getAllSubcategories(newParent.id);
    expect(subs.length).toBe(1);
    expect(subs[0].name).toBe("Flight Training Academy");
  });

  it("Scenario 9: Cannot delete Parent Category or Subcategory that contains active businesses", async () => {
    // Try to delete Hospitality parent category while Hotel & Restaurant exist
    const deleteParentResult = await adapter.deleteParentCategory("pcat-hospitality");
    expect(deleteParentResult.success).toBe(false);
    expect(deleteParentResult.error).toContain("active business(es) are assigned to it");

    // Try to delete Restaurant & Bar subcategory while Kartik Restaurant is assigned to it
    const deleteSubResult = await adapter.deleteSubcategory("sub-restaurant-bar");
    expect(deleteSubResult.success).toBe(false);
    expect(deleteSubResult.error).toContain("active business(es) are assigned to it");
  });

  it("Scenario 10: Client can create custom business type on the fly without code changes & existing businesses remain intact", async () => {
    // 1. Existing seeded businesses remain intact
    const rmsolution = await adapter.getBusinessBySlug("rmsolution");
    expect(rmsolution).not.toBeNull();
    expect(rmsolution?.name).toBe("RMSolution Tech");

    const kartik = await adapter.getBusinessBySlug("kartik-restaurant-bar");
    expect(kartik).not.toBeNull();
    expect(kartik?.name).toBe("Kartik Restaurant & Bar");

    // 2. Client creates custom subcategory on the fly under "Other Businesses"
    const customSub = await adapter.upsertSubcategory({
      parentId: "pcat-other",
      name: "Boutique Ceramic Studio",
      slug: "boutique-ceramic-studio",
      description: "Handcrafted pottery and ceramic workshops.",
      reviewQuestion: "What did you love about your pottery experience?",
      services: ["Clay Quality", "Kiln Firing", "Instructor Guidance", "Glazing Variety"],
      isActive: true,
    });

    expect(customSub.id).toBeDefined();
    expect(customSub.name).toBe("Boutique Ceramic Studio");
    expect(customSub.reviewQuestion).toBe("What did you love about your pottery experience?");

    // 3. Client creates business under that dynamic type
    const potteryBiz = await adapter.upsertBusiness({
      name: "Earth & Fire Ceramics",
      slug: "earth-and-fire-ceramics",
      parentCategoryId: "pcat-other",
      parentCategoryName: "Other Businesses",
      subcategoryId: customSub.id,
      subcategoryName: "Boutique Ceramic Studio",
      googleReviewUrl: "https://g.page/r/earth-fire/review",
      reviewQuestion: customSub.reviewQuestion,
      customServices: customSub.services,
      isActive: true,
    });

    expect(potteryBiz.name).toBe("Earth & Fire Ceramics");
    expect(potteryBiz.subcategoryName).toBe("Boutique Ceramic Studio");
    expect(potteryBiz.reviewQuestion).toBe("What did you love about your pottery experience?");
    expect(potteryBiz.customServices).toContain("Clay Quality");
  });
});
