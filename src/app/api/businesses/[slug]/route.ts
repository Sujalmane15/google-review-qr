import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const storage = getStorage();
    const business = await storage.getBusinessBySlug(slug);

    if (!business || !business.isActive) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Resolve category services
    let services: string[] = business.customServices && business.customServices.length > 0
      ? business.customServices
      : [];

    let categoryPlaceholder: Record<string, string> | undefined = undefined;

    if (business.categoryId) {
      const category = await storage.getCategoryById(business.categoryId);
      if (category && category.isActive) {
        if (services.length === 0) {
          services = category.services;
        }
        categoryPlaceholder = category.placeholderText;
      }
    }

    // Publicly return needed fields
    return NextResponse.json({
      name: business.name,
      slug: business.slug,
      categoryId: business.categoryId,
      categoryName: business.categoryName || "General Business",
      googleReviewUrl: business.googleReviewUrl,
      logoUrl: business.logoUrl,
      description: business.description,
      accentColor: business.accentColor || "#16a34a",
      services,
      placeholderText: categoryPlaceholder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching business";
    console.error("Fetch business error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
