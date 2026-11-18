"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Plus,
  Edit2,
  ExternalLink,
  LogOut,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Business } from "@/types";
import { QRCodeViewer } from "@/components/QRCodeViewer";
import { getCanonicalPublicReviewUrl } from "@/lib/qr";

export default function DashboardPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#16a34a");

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data: Business[] = await res.json();
        setBusinesses(data);
        if (data.length > 0 && !selectedBusiness) {
          setSelectedBusiness(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectBusiness = (b: Business) => {
    setSelectedBusiness(b);
    setIsEditing(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleStartNew = () => {
    setName("");
    setSlug("");
    setGoogleReviewUrl("");
    setLogoUrl("");
    setDescription("");
    setAccentColor("#16a34a");
    setIsEditing(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleStartEdit = (b: Business) => {
    setName(b.name);
    setSlug(b.slug);
    setGoogleReviewUrl(b.googleReviewUrl);
    setLogoUrl(b.logoUrl || "");
    setDescription(b.description || "");
    setAccentColor(b.accentColor || "#16a34a");
    setIsEditing(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSlugify = (val: string) => {
    setName(val);
    if (!selectedBusiness || !isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSaving(true);

    try {
      const payload = {
        id: isEditing && selectedBusiness && name === selectedBusiness.name ? selectedBusiness.id : undefined,
        name,
        slug,
        googleReviewUrl,
        logoUrl: logoUrl.trim() || undefined,
        description: description.trim() || undefined,
        accentColor: accentColor.trim() || "#16a34a",
      };

      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.error || "Failed to save business";
        if (data.details) {
          const detailMsgs = Object.entries(data.details)
            .filter(([k]) => k !== "_errors")
            .map(([k, v]: [string, any]) => `${k}: ${v._errors?.join(", ")}`)
            .filter(Boolean);
          if (detailMsgs.length > 0) {
            msg += ` (${detailMsgs.join("; ")})`;
          }
        }
        setFormError(msg);
        setSaving(false);
        return;
      }

      setFormSuccess("Business saved successfully!");
      await fetchBusinesses();
      setSelectedBusiness(data);
      setIsEditing(false);
    } catch {
      setFormError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  // Derive QR URL: prefer configured NEXT_PUBLIC_APP_URL, but dynamically fall back to current browser origin if in production/Vercel
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("placeholder")
      ? process.env.NEXT_PUBLIC_APP_URL
      : origin || undefined;

  const qrInfo = selectedBusiness
    ? getCanonicalPublicReviewUrl(selectedBusiness.slug, appBaseUrl)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                RMQR Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Google Review QR & AI Suggestion Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Sidebar: Business List */}
        <section className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Businesses ({businesses.length})
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {businesses.map((b) => {
              const isSelected = selectedBusiness?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBusiness(b)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: b.accentColor || "#16a34a" }}
                      >
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{b.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">/r/{b.slug}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(b);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit Business"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Main Area: QR Display & Form */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Form or QR View */}
          {isEditing ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {selectedBusiness && name === selectedBusiness.name ? "Edit Business" : "Add New Business"}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Configure your Google Review destination and public branding.
              </p>

              {formError && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleSlugify(e.target.value)}
                      placeholder="Kartik Restaurant & Bar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Public URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="kartik-restaurant-bar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Google Review URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/YOUR_ID/review or https://search.google.com/local/writereview..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The real Google Review destination. Never fabricated.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Logo Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Short Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Authentic dining, friendly staff, and great hospitality."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Business Profile"}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedBusiness && qrInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QRCodeViewer
                businessName={selectedBusiness.name}
                slug={selectedBusiness.slug}
                publicUrl={qrInfo.url}
                isLocalhost={qrInfo.isLocalhost}
                warning={qrInfo.warning}
                isReadyForProduction={qrInfo.isReadyForProduction}
              />

              {/* Business Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Profile Details
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(selectedBusiness)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {selectedBusiness.name}
                  </h3>
                  {selectedBusiness.description && (
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                      {selectedBusiness.description}
                    </p>
                  )}

                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div>
                      <span className="block font-medium text-slate-400 mb-0.5">Google Review Destination:</span>
                      <a
                        href={selectedBusiness.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline break-all inline-flex items-center gap-1 font-mono"
                      >
                        {selectedBusiness.googleReviewUrl}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <div>
                      <span className="block font-medium text-slate-400 mb-0.5">Accent Color:</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: selectedBusiness.accentColor || "#16a34a" }}
                        />
                        {selectedBusiness.accentColor || "#16a34a"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <a
                    href={qrInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition active:scale-95"
                  >
                    Open Live Customer Review Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">No Business Selected</h3>
              <p className="text-xs text-slate-400 mb-4">
                Select an existing business from the left or create a new one.
              </p>
              <button
                onClick={handleStartNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                Add Your First Business
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
