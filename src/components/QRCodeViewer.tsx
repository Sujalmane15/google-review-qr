/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Download, Copy, Check, ExternalLink, AlertTriangle, ShieldCheck } from "lucide-react";
import { generateQrPngDataUrl, generateQrSvg } from "@/lib/qr";

interface QRCodeViewerProps {
  businessName: string;
  slug: string;
  publicUrl: string;
  isLocalhost: boolean;
  warning?: string;
  isReadyForProduction: boolean;
}

export function QRCodeViewer({
  businessName,
  slug,
  publicUrl,
  isLocalhost,
  warning,
  isReadyForProduction,
}: QRCodeViewerProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadQr() {
      try {
        setLoading(true);
        const [svg, png] = await Promise.all([
          generateQrSvg(publicUrl),
          generateQrPngDataUrl(publicUrl, 600),
        ]);
        if (isMounted) {
          setSvgContent(svg);
          setPngDataUrl(png);
          setLoading(false);
        }
      } catch (err) {
        console.error("QR Generation error:", err);
        if (isMounted) setLoading(false);
      }
    }

    if (publicUrl) {
      loadQr();
    }

    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `${slug}-google-review-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-google-review-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-slate-900 text-lg">Public Review QR</h3>
        {isReadyForProduction ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Production Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Dev Mode
          </span>
        )}
      </div>

      {/* Warning Alert if Localhost */}
      {(isLocalhost || warning) && (
        <div className="w-full mb-4 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Public URL Notice</p>
            <p className="leading-relaxed">
              {warning ||
                "Public QR generation requires a deployed public HTTPS URL. Do not print local QR codes for real customers."}
            </p>
          </div>
        </div>
      )}

      {/* QR Code Container */}
      <div className="relative p-4 bg-white border border-slate-200 rounded-xl shadow-inner mb-4 flex items-center justify-center min-w-[220px] min-h-[220px]">
        {loading ? (
          <div className="w-48 h-48 flex items-center justify-center text-sm text-slate-400 animate-pulse">
            Generating QR...
          </div>
        ) : pngDataUrl ? (
          <img
            src={pngDataUrl}
            alt={`QR code for ${businessName}`}
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-xs text-red-500">
            QR Error
          </div>
        )}
      </div>

      {/* URL Display & Copy */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4 flex items-center justify-between gap-2 text-left">
        <span className="text-xs font-mono text-slate-600 truncate select-all">{publicUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-700"
          title="Copy URL"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={!pngDataUrl}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          PNG
        </button>
        <button
          type="button"
          onClick={handleDownloadSvg}
          disabled={!svgContent}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-200 border border-slate-200 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          SVG
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 border border-emerald-200 transition active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview
        </a>
      </div>
    </div>
  );
}
