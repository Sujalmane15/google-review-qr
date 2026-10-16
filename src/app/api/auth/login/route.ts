import { NextRequest, NextResponse } from "next/server";
import { AdminLoginSchema } from "@/lib/validations";
import { checkLoginRateLimit, setAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";

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
    const validation = AdminLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const isValid = await verifyAdminPassword(validation.data.password);

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
          remainingAttempts: rateCheck.remainingAttempts,
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, message: "Logged in successfully" });
    return await setAdminSessionCookie(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    console.error("Login route error:", message);
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}
