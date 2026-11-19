import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || undefined;

    const storage = getStorage();
    const logs = await storage.getAuditLogs(businessId);
    return NextResponse.json(logs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
