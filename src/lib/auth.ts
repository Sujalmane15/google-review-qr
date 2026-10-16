import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "rmqr_admin_session";
const SESSION_EXPIRY = "7d"; // 7 days

// In-memory rate limiting map for login attempts: IP -> { count, resetTime }
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_SESSION_SECRET must be securely set in production environment variables.");
    }
    return new TextEncoder().encode("default-dev-secret-key-change-in-production-123456");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifies the provided admin password.
 * In production, ADMIN_PASSWORD must be configured and cannot be default 'admin123'.
 */
export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";

  // Strict check: 'admin123' is strictly forbidden in production
  if (isProduction && inputPassword === "admin123") {
    return false;
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || configuredPassword.trim() === "") {
    if (isProduction) {
      throw new Error("ADMIN_PASSWORD must be set in production environment variables.");
    }
    // Local dev fallback default
    return inputPassword === "admin123";
  }

  if (isProduction && configuredPassword === "admin123") {
    // Prevent insecure default password in production
    return false;
  }

  // Check if configured password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$\d+\$/.test(configuredPassword)) {
    return bcrypt.compare(inputPassword, configuredPassword);
  }

  // Direct string comparison if plain text in dev
  return inputPassword === configuredPassword;
}

/**
 * Creates a signed JWT admin session token.
 */
export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verifies a JWT admin session token.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Checks if the current request has a valid admin session cookie.
 * Supports checking NextRequest directly or falling back to next/headers cookies().
 */
export async function isAuthenticated(req?: NextRequest): Promise<boolean> {
  if (req) {
    const reqToken = req.cookies.get(COOKIE_NAME)?.value;
    if (reqToken) {
      return verifyAdminToken(reqToken);
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyAdminToken(token);
  } catch {
    // When running in test environments without Next.js request scope
    return false;
  }
}

/**
 * Sets the admin session cookie in a NextResponse.
 */
export async function setAdminSessionCookie(response: NextResponse): Promise<NextResponse> {
  const token = await createAdminToken();
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return response;
}

/**
 * Clears the admin session cookie in a NextResponse.
 */
export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

/**
 * Simple IP-based rate limiting helper for login route.
 * Max 5 attempts per 15 minutes.
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const record = loginAttempts.get(ip);
  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  record.count += 1;
  return { allowed: true, remainingAttempts: maxAttempts - record.count };
}
