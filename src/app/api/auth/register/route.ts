import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ClientRegisterSchema } from "@/lib/validations";
import { setAuthCookie } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ClientRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid registration data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, phone } = validation.data;
    const storage = getStorage();

    // Check if user already exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await storage.upsertUser({
      name,
      email,
      passwordHash,
      role: "client",
      companyName: companyName || name,
      phone,
    });

    const response = NextResponse.json({
      success: true,
      message: "Client account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });

    return await setAuthCookie(response, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration error";
    console.error("Client registration error:", message);
    return NextResponse.json({ error: "Server registration error" }, { status: 500 });
  }
}
