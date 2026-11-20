import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { BusinessInputSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = getStorage();

  // If client, only return businesses belonging to this client
  if (session.role === "client") {
    const clientBusinesses = await storage.getBusinessesByClient(session.userId);
    return NextResponse.json(clientBusinesses);
  }

  // Admin gets all active businesses
  const businesses = await storage.getAllBusinesses();
  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = BusinessInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid business input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const existing = await storage.getBusinessBySlug(validation.data.slug);

    if (existing && body.id && existing.id !== body.id) {
      return NextResponse.json(
        { error: "A business with this slug already exists." },
        { status: 409 }
      );
    } else if (existing && !body.id) {
      return NextResponse.json(
        { error: "A business with this slug already exists. Please choose a unique slug." },
        { status: 409 }
      );
    }

    // Resolve Category Names
    let parentCategoryName = validation.data.parentCategoryName;
    if (validation.data.parentCategoryId && !parentCategoryName) {
      const parent = await storage.getParentCategoryById(validation.data.parentCategoryId);
      if (parent) parentCategoryName = parent.name;
    }

    let subcategoryName = validation.data.subcategoryName;
    if (validation.data.subcategoryId && !subcategoryName) {
      const sub = await storage.getSubcategoryById(validation.data.subcategoryId);
      if (sub) subcategoryName = sub.name;
    }

    // Determine client owner
    const clientId =
      session.role === "client"
        ? session.userId
        : validation.data.clientId || session.userId;

    const saved = await storage.upsertBusiness(
      {
        id: body.id,
        clientId,
        clientName: session.role === "client" ? session.name : validation.data.clientName,
        name: validation.data.name,
        slug: validation.data.slug,
        parentCategoryId: validation.data.parentCategoryId || undefined,
        parentCategoryName,
        subcategoryId: validation.data.subcategoryId || undefined,
        subcategoryName,
        reviewQuestion: validation.data.reviewQuestion || undefined,
        categoryId: validation.data.subcategoryId || validation.data.categoryId || undefined,
        categoryName: subcategoryName || validation.data.categoryName || undefined,
        googleReviewUrl: validation.data.googleReviewUrl,
        logoUrl: validation.data.logoUrl || undefined,
        description: validation.data.description || undefined,
        accentColor: validation.data.accentColor || "#16a34a",
        customServices: validation.data.customServices || [],
        status: validation.data.status || "active",
        isActive: validation.data.isActive ?? true,
        isPlatformProvider: validation.data.isPlatformProvider ?? false,
        contactEmail: validation.data.contactEmail || undefined,
        contactPhone: validation.data.contactPhone || undefined,
        address: validation.data.address || undefined,
      },
      session.userId,
      session.role
    );

    return NextResponse.json(saved, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving business";
    console.error("Save business error:", message);
    return NextResponse.json({ error: message || "Failed to save business profile" }, { status: 500 });
  }
}
