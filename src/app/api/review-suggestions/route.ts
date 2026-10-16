import { NextRequest, NextResponse } from "next/server";
import { ReviewSuggestionSchema } from "@/lib/validations";
import { generateReviewSuggestionsWithGemini } from "@/lib/gemini";

// Rate limiting in-memory map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 20; // 20 requests per minute per IP

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = ReviewSuggestionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await generateReviewSuggestionsWithGemini(validation.data);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    // Avoid logging or returning secrets or internal error stacks
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("API error in review-suggestions:", message);

    return NextResponse.json(
      {
        error: "Unable to process review suggestions. Please try again or write your review manually.",
      },
      { status: 500 }
    );
  }
}
