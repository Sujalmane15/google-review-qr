import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AuthSession, UserRole } from "@/types";

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
    return false;
  }

  // Check if configured password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$\d+\$/.test(configuredPassword)) {
    return bcrypt.compare(inputPassword, configuredPassword);
  }

  return inputPassword === configuredPassword;
}

/**
 * Creates a signed JWT token for any session (admin or client).
 */
export async function createAuthToken(session: {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verifies a JWT token and returns the parsed AuthSession or null.
 */
export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.role) return null;

    return {
      userId: (payload.userId as string) || "user-admin-default",
      email: (payload.email as string) || (payload.role === "admin" ? "admin@rmsolution.com" : ""),
      name: (payload.name as string) || (payload.role === "admin" ? "RMSolution Admin" : "Client User"),
      role: (payload.role as UserRole) || "admin",
      issuedAt: payload.iat || Math.floor(Date.now() / 1000),
      expiresAt: payload.exp || Math.floor(Date.now() / 1000) + 7 * 86400,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a signed JWT admin session token (legacy compatibility).
 */
export async function createAdminToken(): Promise<string> {
  return createAuthToken({
    userId: "user-admin-default",
    email: "admin@rmsolution.com",
    name: "RMSolution Admin",
    role: "admin",
  });
}

/**
 * Verifies a JWT admin session token (legacy compatibility).
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  const session = await verifyAuthToken(token);
  return session !== null && session.role === "admin";
}

/**
 * Gets the current session from NextRequest or cookie store.
 */
export async function getSession(req?: NextRequest): Promise<AuthSession | null> {
  if (req) {
    const reqToken = req.cookies.get(COOKIE_NAME)?.value;
    if (reqToken) {
      return verifyAuthToken(reqToken);
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

/**
 * Checks if the current request is authenticated.
 */
export async function isAuthenticated(req?: NextRequest): Promise<boolean> {
  const session = await getSession(req);
  return session !== null;
}

/**
 * Checks if current session has admin privileges.
 */
export async function isAdmin(req?: NextRequest): Promise<boolean> {
  const session = await getSession(req);
  return session !== null && session.role === "admin";
}

/**
 * Sets the session cookie in a NextResponse.
 */
export async function setAuthCookie(
  response: NextResponse,
  session: { userId: string; email: string; name: string; role: UserRole }
): Promise<NextResponse> {
  const token = await createAuthToken(session);
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
 * Sets the admin session cookie in a NextResponse (legacy compatibility).
 */
export async function setAdminSessionCookie(response: NextResponse): Promise<NextResponse> {
  return setAuthCookie(response, {
    userId: "user-admin-default",
    email: "admin@rmsolution.com",
    name: "RMSolution Admin",
    role: "admin",
  });
}

/**
 * Clears the session cookie in a NextResponse.
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
