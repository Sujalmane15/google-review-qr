import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/auth";

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

    if (!business || business.status === "deleted" || business.isActive === false) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Resolve category services and placeholders
    let services: string[] =
      business.customServices && business.customServices.length > 0
        ? business.customServices
        : [];

    let categoryPlaceholder: Record<string, string> | undefined = undefined;
    let reviewQuestion: string | undefined = business.reviewQuestion;

    // 1. Try resolving from Subcategory
    const targetSubId = business.subcategoryId || business.categoryId;
    if (targetSubId) {
      const sub = await storage.getSubcategoryById(targetSubId);
      if (sub && sub.isActive) {
        if (services.length === 0) {
          services = sub.services;
        }
        if (!reviewQuestion && sub.reviewQuestion) {
          reviewQuestion = sub.reviewQuestion;
        }
        categoryPlaceholder = sub.placeholderText;
      }
    }

    // 2. If still empty, try legacy category
    if (services.length === 0 && business.categoryId) {
      const cat = await storage.getCategoryById(business.categoryId);
      if (cat && cat.isActive) {
        services = cat.services;
        if (!reviewQuestion && cat.reviewQuestion) {
          reviewQuestion = cat.reviewQuestion;
        }
        categoryPlaceholder = cat.placeholderText;
      }
    }

    // Publicly return needed fields
    return NextResponse.json({
      name: business.name,
      slug: business.slug,
      parentCategoryId: business.parentCategoryId,
      parentCategoryName: business.parentCategoryName,
      subcategoryId: business.subcategoryId || business.categoryId,
      subcategoryName: business.subcategoryName || business.categoryName || "General Business",
      categoryName: business.subcategoryName || business.categoryName || "General Business",
      reviewQuestion: reviewQuestion || undefined,
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const storage = getStorage();

    // The param might be an ID or a Slug
    const businesses = await storage.getAllBusinesses(true);
    const target = businesses.find((b) => b.id === slug || b.slug.toLowerCase() === slug.toLowerCase());

    if (!target) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Role-based ownership check
    if (session.role === "client" && target.clientId && target.clientId !== session.userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this business." },
        { status: 403 }
      );
    }

    await storage.softDeleteBusiness(target.id, session.userId, session.role);

    return NextResponse.json({
      success: true,
      message: `Business "${target.name}" has been deleted successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting business";
    console.error("Delete business error:", message);
    return NextResponse.json({ error: message || "Failed to delete business" }, { status: 500 });
  }
}
