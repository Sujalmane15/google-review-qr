import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { BusinessInputSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated(req);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = getStorage();
  const businesses = await storage.getAllBusinesses();
  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated(req);
  if (!authed) {
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

    // If existing and doesn't match current updating ID
    if (existing && body.id && existing.id !== body.id) {
      return NextResponse.json(
        { error: "A business with this slug already exists." },
        { status: 409 }
      );
    } else if (existing && !body.id) {
      // Updating existing by slug or conflicting
      return NextResponse.json(
        { error: "A business with this slug already exists. Please choose a unique slug." },
        { status: 409 }
      );
    }

    const saved = await storage.upsertBusiness({
      id: body.id,
      name: validation.data.name,
      slug: validation.data.slug,
      googleReviewUrl: validation.data.googleReviewUrl,
      logoUrl: validation.data.logoUrl || undefined,
      description: validation.data.description || undefined,
      accentColor: validation.data.accentColor || undefined,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving business";
    console.error("Save business error:", message);
    return NextResponse.json({ error: "Failed to save business profile" }, { status: 500 });
  }
}
