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

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Publicly return needed fields
    return NextResponse.json({
      name: business.name,
      slug: business.slug,
      googleReviewUrl: business.googleReviewUrl,
      logoUrl: business.logoUrl,
      description: business.description,
      accentColor: business.accentColor || "#16a34a",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching business";
    console.error("Fetch business error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
