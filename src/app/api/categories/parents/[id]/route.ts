import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const storage = getStorage();
    const result = await storage.deleteParentCategory(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete parent category" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Parent category deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting parent category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
