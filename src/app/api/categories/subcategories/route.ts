import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { SubcategoryInputSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || undefined;

    const storage = getStorage();
    const subcategories = await storage.getAllSubcategories(parentId);
    return NextResponse.json(subcategories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching subcategories";
    console.error("Fetch subcategories error:", message);
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
    const validation = SubcategoryInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid subcategory data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const saved = await storage.upsertSubcategory(validation.data);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving subcategory";
    console.error("Save subcategory error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
