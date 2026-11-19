import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { CategoryInputSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const storage = getStorage();
    const categories = await storage.getAllCategories();
    
    // For non-admin, filter only active categories
    const authed = await isAuthenticated(req);
    if (!authed) {
      return NextResponse.json(categories.filter((c) => c.isActive));
    }

    return NextResponse.json(categories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching categories";
    console.error("Categories GET error:", message);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated(req);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = CategoryInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const saved = await storage.upsertCategory({
      id: body.id,
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description || undefined,
      icon: validation.data.icon || undefined,
      isActive: validation.data.isActive ?? true,
      services: validation.data.services,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving category";
    console.error("Save category error:", message);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}
