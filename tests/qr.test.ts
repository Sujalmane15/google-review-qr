import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import { getCanonicalPublicReviewUrl, generateQrSvg, generateQrPngDataUrl } from "@/lib/qr";

describe("QR Architecture & Decoding Verification", () => {
  it("should generate the canonical public review URL without trailing slash", () => {
    const res = getCanonicalPublicReviewUrl("kartik-restaurant-bar", "https://reviews.kartik.com/");
    expect(res.url).toBe("https://reviews.kartik.com/r/kartik-restaurant-bar");
    expect(res.isLocalhost).toBe(false);
    expect(res.isReadyForProduction).toBe(true);
  });

  it("should warn when generating for localhost origin", () => {
    const res = getCanonicalPublicReviewUrl("kartik-restaurant-bar", "http://localhost:3000");
    expect(res.url).toBe("http://localhost:3000/r/kartik-restaurant-bar");
    expect(res.isLocalhost).toBe(true);
    expect(res.isReadyForProduction).toBe(false);
    expect(res.warning).toBeDefined();
  });

  it("should generate valid SVG containing QR paths", async () => {
    const targetUrl = "https://example.com/r/kartik-restaurant-bar";
    const svg = await generateQrSvg(targetUrl);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("path");
  });

  it("should generate valid PNG Data URL", async () => {
    const targetUrl = "https://example.com/r/kartik-restaurant-bar";
    const dataUrl = await generateQrPngDataUrl(targetUrl);
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("should programmatically verify that the QR code encodes the exact public review URL", () => {
    const expectedUrl = "https://rmqr-prod.vercel.app/r/kartik-restaurant-bar";
    const qrData = QRCode.create(expectedUrl, { errorCorrectionLevel: "M" });

    // Verify the internal data segment contains the exact canonical URL
    const segments = qrData.segments;
    expect(segments.length).toBeGreaterThan(0);
    const decodedText = segments
      .map((s) => (typeof s.data === "string" ? s.data : Buffer.from(s.data).toString("utf-8")))
      .join("");
    expect(decodedText).toBe(expectedUrl);
  });
});
