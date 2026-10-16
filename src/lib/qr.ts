import QRCode from "qrcode";
import { validatePublicAppUrl } from "./validations";

export interface QrUrlResult {
  url: string;
  isLocalhost: boolean;
  warning?: string;
  isReadyForProduction: boolean;
}

/**
 * Derives the canonical public customer review URL for a given business slug.
 * Strictest protection against localhost and invalid origins.
 */
export function getCanonicalPublicReviewUrl(slug: string, baseUrl?: string): QrUrlResult {
  const cleanSlug = slug.trim().toLowerCase();
  const validation = validatePublicAppUrl(baseUrl);

  if (!validation.isValid) {
    // Development fallback origin or warning
    const fallbackOrigin = baseUrl || "http://localhost:3000";
    return {
      url: `${fallbackOrigin.replace(/\/+$/, "")}/r/${cleanSlug}`,
      isLocalhost: true,
      warning:
        validation.error ||
        "Public QR generation requires a deployed public URL. Currently using a local origin.",
      isReadyForProduction: false,
    };
  }

  const publicUrl = `${validation.normalizedUrl}/r/${cleanSlug}`;

  return {
    url: publicUrl,
    isLocalhost: validation.isLocalhost,
    warning: validation.isLocalhost
      ? "Public QR generation requires a deployed public URL. Running on localhost/local network."
      : undefined,
    isReadyForProduction: !validation.isLocalhost && validation.isValid,
  };
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

/**
 * Generates a PNG Data URL representation of the QR code.
 */
export async function generateQrPngDataUrl(text: string, width = 512): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
