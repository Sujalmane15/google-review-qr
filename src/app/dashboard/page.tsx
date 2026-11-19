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
  FolderTree,
  Trash2,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import { Business, BusinessCategory } from "@/types";
import { QRCodeViewer } from "@/components/QRCodeViewer";
import { getCanonicalPublicReviewUrl } from "@/lib/qr";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"businesses" | "categories">("businesses");

  // Businesses State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessSuccess, setBusinessSuccess] = useState<string | null>(null);
  const [savingBusiness, setSavingBusiness] = useState(false);

  // Business Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#16a34a");
  const [customServices, setCustomServices] = useState("");
  const [isBusinessActive, setIsBusinessActive] = useState(true);

  // Category Form State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catServices, setCatServices] = useState("");
  const [catIsActive, setCatIsActive] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [bizRes, catRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/categories"),
      ]);

      if (bizRes.status === 401 || catRes.status === 401) {
        router.push("/login");
        return;
      }

      if (bizRes.ok && catRes.ok) {
        const bizData: Business[] = await bizRes.json();
        const catData: BusinessCategory[] = await catRes.json();
        setBusinesses(bizData);
        setCategories(catData);

        if (bizData.length > 0 && !selectedBusiness) {
          setSelectedBusiness(bizData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Business Form Handlers ---
  const handleStartNewBusiness = () => {
    setName("");
    setSlug("");
    setCategoryId(categories[0]?.id || "");
    setGoogleReviewUrl("");
    setLogoUrl("");
    setDescription("");
    setAccentColor("#16a34a");
    setCustomServices("");
    setIsBusinessActive(true);
    setIsEditingBusiness(true);
    setBusinessError(null);
    setBusinessSuccess(null);
  };

  const handleStartEditBusiness = (b: Business) => {
    setName(b.name);
    setSlug(b.slug);
    setCategoryId(b.categoryId || "");
    setGoogleReviewUrl(b.googleReviewUrl);
    setLogoUrl(b.logoUrl || "");
    setDescription(b.description || "");
    setAccentColor(b.accentColor || "#16a34a");
    setCustomServices(b.customServices ? b.customServices.join(", ") : "");
    setIsBusinessActive(b.isActive ?? true);
    setIsEditingBusiness(true);
    setBusinessError(null);
    setBusinessSuccess(null);
  };

  const handleSlugify = (val: string) => {
    setName(val);
    if (!selectedBusiness || !isEditingBusiness) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError(null);
    setBusinessSuccess(null);
    setSavingBusiness(true);

    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const parsedServices = customServices
        ? customServices
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        id: isEditingBusiness && selectedBusiness && name === selectedBusiness.name ? selectedBusiness.id : undefined,
        name,
        slug,
        categoryId: categoryId || undefined,
        categoryName: selectedCat ? selectedCat.name : undefined,
        googleReviewUrl,
        logoUrl: logoUrl.trim() || undefined,
        description: description.trim() || undefined,
        accentColor: accentColor.trim() || "#16a34a",
        customServices: parsedServices,
        isActive: isBusinessActive,
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
          if (detailMsgs.length > 0) msg += ` (${detailMsgs.join("; ")})`;
        }
        setBusinessError(msg);
        setSavingBusiness(false);
        return;
      }

      setBusinessSuccess("Business saved successfully!");
      await fetchData();
      setSelectedBusiness(data);
      setIsEditingBusiness(false);
    } catch {
      setBusinessError("Network error while saving.");
    } finally {
      setSavingBusiness(false);
    }
  };

  // --- Category Form Handlers ---
  const handleStartNewCategory = () => {
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatServices("Service 1, Service 2, Service 3");
    setCatIsActive(true);
    setSelectedCategory(null);
    setIsEditingCategory(true);
    setCategoryError(null);
    setCategorySuccess(null);
  };

  const handleStartEditCategory = (c: BusinessCategory) => {
    setSelectedCategory(c);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDescription(c.description || "");
    setCatServices(c.services.join(", "));
    setCatIsActive(c.isActive);
    setIsEditingCategory(true);
    setCategoryError(null);
    setCategorySuccess(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    setCategorySuccess(null);
    setSavingCategory(true);

    try {
      const parsedServices = catServices
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: selectedCategory?.id,
        name: catName,
        slug: catSlug,
        description: catDescription.trim() || undefined,
        isActive: catIsActive,
        services: parsedServices,
      };

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setCategoryError(data.error || "Failed to save category");
        setSavingCategory(false);
        return;
      }

      setCategorySuccess("Category updated successfully! Public review pages now use these services.");
      await fetchData();
      setIsEditingCategory(false);
    } catch {
      setCategoryError("Network error while saving category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading Universal Business Platform...
      </div>
    );
  }

  const appBaseUrl =
    origin && !origin.includes("localhost")
      ? origin
      : process.env.NEXT_PUBLIC_APP_URL || origin || undefined;

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
                RMSolution Universal Platform
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Multi-Industry Google Review QR & AI Suggestion System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("businesses");
                handleStartNewBusiness();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </button>
            <button
              onClick={() => {
                setActiveTab("categories");
                handleStartNewCategory();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200 transition active:scale-95 border border-slate-200"
            >
              <FolderTree className="w-4 h-4 text-emerald-600" />
              Add Category
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

        {/* Tab Selector */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("businesses")}
            className={`py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "businesses"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Businesses ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "categories"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Universal Categories & Services ({categories.length})
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {activeTab === "businesses" ? (
          <>
            {/* Left Sidebar: Business List */}
            <section className="lg:col-span-4 flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Registered Businesses ({businesses.length})
              </h2>

              <div className="flex flex-col gap-2">
                {businesses.map((b) => {
                  const isSelected = selectedBusiness?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBusiness(b);
                        setIsEditingBusiness(false);
                      }}
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
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{b.name}</h3>
                            <p className="text-[11px] text-emerald-600 font-medium">{b.categoryName || "General Business"}</p>
                            <p className="text-[11px] text-slate-400 font-mono">/r/{b.slug}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditBusiness(b);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Right Main Area */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              {isEditingBusiness ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    {selectedBusiness && name === selectedBusiness.name ? "Edit Business" : "Add New Business"}
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Assign your industry category and custom services. No food defaults will appear for IT or non-restaurant businesses.
                  </p>

                  {businessError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{businessError}</span>
                    </div>
                  )}

                  {businessSuccess && (
                    <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{businessSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveBusiness} className="space-y-4">
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
                          placeholder="RMSolution Tech"
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
                          placeholder="rmsolution-tech"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Universal Category Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Business Category / Industry *
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      >
                        <option value="">-- Select Industry --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} {!cat.isActive ? "(Inactive)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Determines the customer experience tags (e.g. IT shows Web/App Development, Hospital shows Healthcare).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Custom Services / Tags (Optional)
                      </label>
                      <input
                        type="text"
                        value={customServices}
                        onChange={(e) => setCustomServices(e.target.value)}
                        placeholder="Web Development, App Development, UI/UX Design, Timely Delivery, Support"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Comma-separated tags to display for this business. Overrides category default if specified.
                      </p>
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
                        placeholder="https://g.page/r/YOUR_ID/review..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
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
                        placeholder="Website, App & Software Development services."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditingBusiness(false)}
                        className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingBusiness}
                        className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
                      >
                        {savingBusiness ? "Saving..." : "Save Business Profile"}
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
                          onClick={() => handleStartEditBusiness(selectedBusiness)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Details
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {selectedBusiness.name}
                      </h3>
                      <p className="text-xs font-medium text-emerald-600 mb-3">
                        {selectedBusiness.categoryName || "Universal Business"}
                      </p>

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
                          <span className="block font-medium text-slate-400 mb-0.5">Custom Services / Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedBusiness.customServices && selectedBusiness.customServices.length > 0 ? (
                              selectedBusiness.customServices.map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">Using category defaults</span>
                            )}
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
              ) : null}
            </section>
          </>
        ) : (
          /* Universal Categories Management Tab */
          <section className="lg:col-span-12 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Universal Business Categories</h2>
                <p className="text-xs text-slate-500">
                  Manage industries, activate/deactivate categories, and customize industry service tags without code changes.
                </p>
              </div>
              <button
                onClick={handleStartNewCategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {isEditingCategory ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  {selectedCategory ? "Edit Category" : "Add New Category"}
                </h3>

                {categoryError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{categoryError}</span>
                  </div>
                )}
                {categorySuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{categorySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => {
                          setCatName(e.target.value);
                          if (!selectedCategory) {
                            setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                          }
                        }}
                        placeholder="e.g. Hotel & Hospitality"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="hotel-hospitality"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Services / Experience Tags (Comma-separated) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={catServices}
                      onChange={(e) => setCatServices(e.target.value)}
                      placeholder="Room Cleanliness, Guest Hospitality, Check-in Experience, Amenities, Staff Helpfulness"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      These tags will automatically appear on customer review pages for businesses in this category.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={catDescription}
                      onChange={(e) => setCatDescription(e.target.value)}
                      placeholder="Resorts, hotels, boutique stays..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="catIsActive"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="catIsActive" className="text-xs font-medium text-slate-700">
                      Active (visible to visitors and available in business selection)
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingCategory(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50"
                    >
                      {savingCategory ? "Saving..." : "Save Category"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                      c.isActive ? "border-slate-200" : "border-slate-200/50 bg-slate-50/50 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {c.isActive ? "Active" : "Deactivated"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditCategory(c)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mb-1">{c.name}</h3>
                      {c.description && (
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{c.description}</p>
                      )}

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                          Service Tags ({c.services.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {c.services.slice(0, 5).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                              {s}
                            </span>
                          ))}
                          {c.services.length > 5 && (
                            <span className="text-[10px] text-slate-400">+{c.services.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
