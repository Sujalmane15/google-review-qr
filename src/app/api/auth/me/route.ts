import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const storage = getStorage();
    const user = await storage.getUserById(session.userId);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: user?.name || session.name,
        role: session.role,
        companyName: user?.companyName,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
