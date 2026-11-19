import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { ParentCategoryInputSchema } from "@/lib/validations";

export async function GET() {
  try {
    const storage = getStorage();
    const categories = await storage.getAllParentCategories();
    return NextResponse.json(categories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching parent categories";
    console.error("Fetch parent categories error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const validation = ParentCategoryInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const saved = await storage.upsertParentCategory(validation.data);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving parent category";
    console.error("Save parent category error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
