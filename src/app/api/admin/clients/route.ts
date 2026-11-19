import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
    }

    const storage = getStorage();
    const users = await storage.getAllUsers();
    const allBusinesses = await storage.getAllBusinesses(false);

    const clientsWithCount = users.map((u) => {
      const bizCount = allBusinesses.filter((b) => b.clientId === u.id).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyName: u.companyName,
        phone: u.phone,
        businessCount: bizCount,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json(clientsWithCount);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching clients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
