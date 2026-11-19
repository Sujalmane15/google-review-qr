import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkLoginRateLimit, setAuthCookie, setAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateCheck = checkLoginRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const password = body.password ? String(body.password) : "";

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const storage = getStorage();

    // 1. If email is provided, check user credentials
    if (email) {
      const user = await storage.getUserByEmail(email);

      // If user is admin or email starts with admin
      if (email.startsWith("admin@") || user?.role === "admin") {
        const isAdminPass = await verifyAdminPassword(password);
        if (isAdminPass) {
          const response = NextResponse.json({
            success: true,
            role: "admin",
            user: {
              id: user?.id || "user-admin-default",
              email: email,
              name: user?.name || "RMSolution Admin",
              role: "admin",
            },
          });
          return await setAuthCookie(response, {
            userId: user?.id || "user-admin-default",
            email: email,
            name: user?.name || "RMSolution Admin",
            role: "admin",
          });
        }
      }

      // Check standard client credentials
      if (user) {
        let isValid = false;
        if (user.passwordHash) {
          isValid = await bcrypt.compare(password, user.passwordHash);
        } else {
          // Pre-seeded test accounts can accept any non-empty password or match email
          isValid = password.length >= 6;
        }

        if (isValid) {
          const response = NextResponse.json({
            success: true,
            role: user.role,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
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
        }
      }

      return NextResponse.json(
        { error: "Invalid email or password", remainingAttempts: rateCheck.remainingAttempts },
        { status: 401 }
      );
    }

    // 2. Pure password provided (legacy admin login)
    const isAdminValid = await verifyAdminPassword(password);
    if (!isAdminValid) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
          remainingAttempts: rateCheck.remainingAttempts,
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: "admin",
      message: "Logged in successfully as Administrator",
    });
    return await setAdminSessionCookie(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    console.error("Login route error:", message);
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}
