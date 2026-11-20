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
  Shield,
  User,
  Users,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Search,
  Globe,
  Tag,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import {
  Business,
  ParentCategory,
  Subcategory,
  User as UserType,
  BusinessAuditLog,
  AuthSession,
} from "@/types";
import { QRCodeViewer } from "@/components/QRCodeViewer";
import { getCanonicalPublicReviewUrl } from "@/lib/qr";

export default function DashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Navigation Tab
  // Admin: "businesses" | "parents" | "subcategories" | "clients" | "audit"
  // Client: "businesses"
  const [activeTab, setActiveTab] = useState<
    "businesses" | "parents" | "subcategories" | "clients" | "audit"
  >("businesses");

  // Core Data
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [clients, setClients] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<BusinessAuditLog[]>([]);

  // Selected Business for Detail / QR View
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");

  // ==========================================
  // CLIENT 7-STEP BUSINESS WIZARD STATE
  // ==========================================
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Wizard fields
  const [bizId, setBizId] = useState<string | undefined>(undefined);
  const [bizName, setBizName] = useState("");
  const [bizSlug, setBizSlug] = useState("");
  const [bizParentId, setBizParentId] = useState("");
  const [bizSubId, setBizSubId] = useState("");
  const [bizReviewQuestion, setBizReviewQuestion] = useState("");
  const [bizDescription, setBizDescription] = useState("");
  const [bizLogoUrl, setBizLogoUrl] = useState("");
  const [bizAccentColor, setBizAccentColor] = useState("#16a34a");
  const [bizGoogleReviewUrl, setBizGoogleReviewUrl] = useState("");
  const [bizContactEmail, setBizContactEmail] = useState("");
  const [bizContactPhone, setBizContactPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizCustomServices, setBizCustomServices] = useState("");
  const [bizIsActive, setBizIsActive] = useState(true);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessSuccess, setBusinessSuccess] = useState<string | null>(null);

  // ==========================================
  // DELETE CONFIRMATION MODAL STATE
  // ==========================================
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState(false);

  // ==========================================
  // ADMIN PARENT CATEGORY FORM STATE
  // ==========================================
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [editParentId, setEditParentId] = useState<string | undefined>(undefined);
  const [parentName, setParentName] = useState("");
  const [parentSlug, setParentSlug] = useState("");
  const [parentIcon, setParentIcon] = useState("Folder");
  const [parentDesc, setParentDesc] = useState("");
  const [parentOrder, setParentOrder] = useState(1);
  const [parentIsActive, setParentIsActive] = useState(true);
  const [parentError, setParentError] = useState<string | null>(null);

  // ==========================================
  // ADMIN SUBCATEGORY FORM STATE
  // ==========================================
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editSubId, setEditSubId] = useState<string | undefined>(undefined);
  const [subParentId, setSubParentId] = useState("");
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subServices, setSubServices] = useState("");
  const [subOrder, setSubOrder] = useState(1);
  const [subIsActive, setSubIsActive] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);

  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch initial session & all data
  const fetchData = async () => {
    try {
      // 1. Check Auth Session
      const meRes = await fetch("/api/auth/me");
      if (meRes.status === 401) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);

      // 2. Fetch Core Data
      const [bizRes, parentRes, subRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/categories/parents"),
        fetch("/api/categories/subcategories"),
      ]);

      if (bizRes.ok) {
        const bizData: Business[] = await bizRes.json();
        setBusinesses(bizData);
        if (bizData.length > 0 && !selectedBusiness) {
          setSelectedBusiness(bizData[0]);
        }
      }

      if (parentRes.ok) {
        const pData: ParentCategory[] = await parentRes.json();
        setParentCategories(pData);
      }

      if (subRes.ok) {
        const sData: Subcategory[] = await subRes.json();
        setSubcategories(sData);
      }

      // If Admin, also load Clients and Audit Logs
      if (meData.user?.role === "admin") {
        const [clientsRes, auditRes] = await Promise.all([
          fetch("/api/admin/clients"),
          fetch("/api/admin/audit-logs"),
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // ==========================================
  // WIZARD HANDLERS
  // ==========================================
  const handleStartNewBusinessWizard = () => {
    setBizId(undefined);
    setBizName("");
    setBizSlug("");
    setBizParentId("");
    setBizSubId("");
    setBizReviewQuestion("");
    setBizDescription("");
    setBizLogoUrl("");
    setBizAccentColor("#16a34a");
    setBizGoogleReviewUrl("");
    setBizContactEmail("");
    setBizContactPhone("");
    setBizAddress("");
    setBizCustomServices("");
    setBizIsActive(true);
    setShowCustomTypeInput(false);
    setCustomTypeName("");
    setIsEditingExisting(false);
    setWizardStep(1);
    setBusinessError(null);
    setBusinessSuccess(null);
    setIsWizardOpen(true);
  };

  const handleStartEditBusiness = (b: Business) => {
    setBizId(b.id);
    setBizName(b.name);
    setBizSlug(b.slug);
    setBizParentId(b.parentCategoryId || "");
    setBizSubId(b.subcategoryId || b.categoryId || "");
    setBizReviewQuestion(b.reviewQuestion || "");
    setBizDescription(b.description || "");
    setBizLogoUrl(b.logoUrl || "");
    setBizAccentColor(b.accentColor || "#16a34a");
    setBizGoogleReviewUrl(b.googleReviewUrl);
    setBizContactEmail(b.contactEmail || "");
    setBizContactPhone(b.contactPhone || "");
    setBizAddress(b.address || "");
    setBizCustomServices(b.customServices ? b.customServices.join(", ") : "");
    setBizIsActive(b.isActive ?? true);
    setShowCustomTypeInput(false);
    setCustomTypeName("");
    setIsEditingExisting(true);
    setWizardStep(1);
    setBusinessError(null);
    setBusinessSuccess(null);
    setIsWizardOpen(true);
  };

  const handleSlugify = (nameVal: string) => {
    setBizName(nameVal);
    if (!isEditingExisting) {
      const generatedSlug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setBizSlug(generatedSlug);
    }
  };

  const handleParentCategoryChange = (parentId: string) => {
    setBizParentId(parentId);
    const matchingSubs = subcategories.filter((s) => s.parentId === parentId);
    if (matchingSubs.length > 0) {
      setBizSubId(matchingSubs[0].id);
      if (matchingSubs[0].reviewQuestion && !bizReviewQuestion) {
        setBizReviewQuestion(matchingSubs[0].reviewQuestion);
      }
    } else {
      setBizSubId("");
    }
  };

  const handleSubcategoryChange = (subId: string) => {
    setBizSubId(subId);
    const sub = subcategories.find((s) => s.id === subId);
    if (sub?.reviewQuestion) {
      setBizReviewQuestion(sub.reviewQuestion);
    }
  };

  const handleCreateCustomType = async () => {
    if (!customTypeName.trim() || !bizParentId) return;
    try {
      const generatedSlug = customTypeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const res = await fetch("/api/categories/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: bizParentId,
          name: customTypeName.trim(),
          slug: generatedSlug,
          services: ["Quality of Service", "Staff Behaviour", "Timely Delivery", "Communication"],
          reviewQuestion: `How was your experience with ${customTypeName.trim()}?`,
          isActive: true,
        }),
      });

      if (res.ok) {
        const created: Subcategory = await res.json();
        setSubcategories((prev) => [...prev, created]);
        setBizSubId(created.id);
        setBizReviewQuestion(created.reviewQuestion || "");
        setShowCustomTypeInput(false);
        setCustomTypeName("");
      } else {
        const tempId = `custom-sub-${Date.now()}`;
        const newSub: Subcategory = {
          id: tempId,
          parentId: bizParentId,
          name: customTypeName.trim(),
          slug: generatedSlug,
          services: ["Service Quality", "Staff Behaviour", "Professionalism"],
          reviewQuestion: `How was your experience with ${customTypeName.trim()}?`,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSubcategories((prev) => [...prev, newSub]);
        setBizSubId(tempId);
        setBizReviewQuestion(newSub.reviewQuestion || "");
        setShowCustomTypeInput(false);
        setCustomTypeName("");
      }
    } catch {
      setShowCustomTypeInput(false);
    }
  };

  const handleSaveBusinessProfile = async () => {
    setBusinessError(null);
    setBusinessSuccess(null);
    setSavingBusiness(true);

    try {
      const selectedParent = parentCategories.find((p) => p.id === bizParentId);
      const selectedSub = subcategories.find((s) => s.id === bizSubId);

      const parsedServices = bizCustomServices
        ? bizCustomServices
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        id: bizId,
        name: bizName.trim(),
        slug: bizSlug.trim(),
        parentCategoryId: bizParentId || undefined,
        parentCategoryName: selectedParent?.name,
        subcategoryId: bizSubId || undefined,
        subcategoryName: selectedSub?.name,
        categoryId: bizSubId || undefined,
        categoryName: selectedSub?.name,
        reviewQuestion: bizReviewQuestion.trim() || undefined,
        googleReviewUrl: bizGoogleReviewUrl.trim(),
        logoUrl: bizLogoUrl.trim() || undefined,
        description: bizDescription.trim() || undefined,
        accentColor: bizAccentColor.trim() || "#16a34a",
        customServices: parsedServices,
        isActive: bizIsActive,
        contactEmail: bizContactEmail.trim() || undefined,
        contactPhone: bizContactPhone.trim() || undefined,
        address: bizAddress.trim() || undefined,
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

      setBusinessSuccess("Business saved and published successfully!");
      await fetchData();
      setSelectedBusiness(data);
      setIsWizardOpen(false);
    } catch {
      setBusinessError("Network error while saving business.");
    } finally {
      setSavingBusiness(false);
    }
  };

  // Delete Business Action
  const confirmDeleteBusiness = (b: Business) => {
    setBusinessToDelete(b);
    setDeleteModalOpen(true);
  };

  const handleExecuteDeleteBusiness = async () => {
    if (!businessToDelete) return;
    setDeletingBusiness(true);
    try {
      const res = await fetch(`/api/businesses/${businessToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete business");
        setDeletingBusiness(false);
        return;
      }

      setDeleteModalOpen(false);
      setBusinessToDelete(null);
      await fetchData();
      if (selectedBusiness?.id === businessToDelete.id) {
        setSelectedBusiness(businesses[0] || null);
      }
    } catch {
      alert("Network error while deleting business");
    } finally {
      setDeletingBusiness(false);
    }
  };

  // ==========================================
  // ADMIN PARENT CATEGORY HANDLERS
  // ==========================================
  const handleOpenNewParentModal = () => {
    setEditParentId(undefined);
    setParentName("");
    setParentSlug("");
    setParentDesc("");
    setParentIcon("Folder");
    setParentOrder(parentCategories.length + 1);
    setParentIsActive(true);
    setParentError(null);
    setIsParentModalOpen(true);
  };

  const handleOpenEditParentModal = (p: ParentCategory) => {
    setEditParentId(p.id);
    setParentName(p.name);
    setParentSlug(p.slug);
    setParentDesc(p.description || "");
    setParentIcon(p.icon || "Folder");
    setParentOrder(p.displayOrder || 1);
    setParentIsActive(p.isActive);
    setParentError(null);
    setIsParentModalOpen(true);
  };

  const handleSaveParentCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentError(null);
    try {
      const res = await fetch("/api/categories/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editParentId,
          name: parentName,
          slug: parentSlug,
          description: parentDesc.trim() || undefined,
          icon: parentIcon,
          displayOrder: Number(parentOrder),
          isActive: parentIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setParentError(data.error || "Failed to save parent category");
        return;
      }

      setIsParentModalOpen(false);
      await fetchData();
    } catch {
      setParentError("Network error while saving parent category.");
    }
  };

  const handleDeleteParentCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this parent category?")) return;
    try {
      const res = await fetch(`/api/categories/parents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete parent category");
        return;
      }
      await fetchData();
    } catch {
      alert("Network error while deleting category");
    }
  };

  // ==========================================
  // ADMIN SUBCATEGORY HANDLERS
  // ==========================================
  const handleOpenNewSubModal = () => {
    setEditSubId(undefined);
    setSubParentId(parentCategories[0]?.id || "");
    setSubName("");
    setSubSlug("");
    setSubDesc("");
    setSubServices("Quality, Service, Support");
    setSubOrder(subcategories.length + 1);
    setSubIsActive(true);
    setSubError(null);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubModal = (s: Subcategory) => {
    setEditSubId(s.id);
    setSubParentId(s.parentId);
    setSubName(s.name);
    setSubSlug(s.slug);
    setSubDesc(s.description || "");
    setSubServices(s.services.join(", "));
    setSubOrder(s.displayOrder || 1);
    setSubIsActive(s.isActive);
    setSubError(null);
    setIsSubModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    try {
      const parsedServices = subServices
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/categories/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editSubId,
          parentId: subParentId,
          name: subName,
          slug: subSlug,
          description: subDesc.trim() || undefined,
          services: parsedServices,
          displayOrder: Number(subOrder),
          isActive: subIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubError(data.error || "Failed to save subcategory");
        return;
      }

      setIsSubModalOpen(false);
      await fetchData();
    } catch {
      setSubError("Network error while saving subcategory.");
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      const res = await fetch(`/api/categories/subcategories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete subcategory");
        return;
      }
      await fetchData();
    } catch {
      alert("Network error while deleting subcategory");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading Universal Business Platform...
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";
  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
    (b.parentCategoryName && b.parentCategoryName.toLowerCase().includes(businessSearchQuery.toLowerCase())) ||
    (b.subcategoryName && b.subcategoryName.toLowerCase().includes(businessSearchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================== */}
      {/* TOP NAVIGATION BAR */}
      {/* ======================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Role Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-none">
                    RMQR Multi-Industry Platform
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isAdmin ? "Admin Master" : "Client Account"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged in as: <span className="font-semibold text-slate-700">{currentUser?.name}</span> ({currentUser?.email})
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartNewBusinessWizard}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Business
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto py-2 border-t border-slate-100 text-xs font-medium">
            <button
              onClick={() => setActiveTab("businesses")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === "businesses"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {isAdmin ? `All Businesses (${businesses.length})` : `My Businesses (${businesses.length})`}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab("parents")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "parents"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  Parent Categories ({parentCategories.length})
                </button>

                <button
                  onClick={() => setActiveTab("subcategories")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "subcategories"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Subcategories ({subcategories.length})
                </button>

                <button
                  onClick={() => setActiveTab("clients")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "clients"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Client Accounts ({clients.length})
                </button>

                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "audit"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Audit Logs ({auditLogs.length})
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTAINER */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================== */}
        {/* TAB 1: BUSINESSES VIEW */}
        {/* ========================================== */}
        {activeTab === "businesses" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Business Directory & Search */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">
                    {isAdmin ? "Universal Business Directory" : "Your Businesses"}
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    {filteredBusinesses.length} total
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={businessSearchQuery}
                    onChange={(e) => setBusinessSearchQuery(e.target.value)}
                    placeholder="Search by name, slug or industry..."
                    className="w-full px-3.5 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Business List */}
              <div className="space-y-2">
                {filteredBusinesses.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                    No businesses found. Click &ldquo;Add Business&rdquo; to create your first profile.
                  </div>
                ) : (
                  filteredBusinesses.map((b) => {
                    const isSelected = selectedBusiness?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBusiness(b)}
                        className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                              style={{ backgroundColor: b.accentColor || "#16a34a" }}
                            >
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                {b.name}
                              </h3>
                              <p className="text-xs font-mono text-slate-500 mt-0.5">
                                /r/{b.slug}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {b.parentCategoryName && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                    {b.parentCategoryName}
                                  </span>
                                )}
                                {b.subcategoryName && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                                    {b.subcategoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleStartEditBusiness(b)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Business"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDeleteBusiness(b)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Business"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Business Detail & QR Hub */}
            <div className="lg:col-span-7">
              {selectedBusiness ? (
                <div className="space-y-6">
                  {/* Public Review QR Viewer */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {selectedBusiness.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assigned to: <strong className="text-slate-700">{selectedBusiness.parentCategoryName || "Hospitality"} &gt; {selectedBusiness.subcategoryName || selectedBusiness.categoryName || "General Business"}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditBusiness(selectedBusiness)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center">
                        {(() => {
                          const qrResult = getCanonicalPublicReviewUrl(selectedBusiness.slug, origin);
                          return (
                            <QRCodeViewer
                              businessName={selectedBusiness.name}
                              slug={selectedBusiness.slug}
                              publicUrl={qrResult.url}
                              isLocalhost={qrResult.isLocalhost}
                              warning={qrResult.warning}
                              isReadyForProduction={qrResult.isReadyForProduction}
                            />
                          );
                        })()}
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                            Public Review URL
                          </span>
                          <a
                            href={`/r/${selectedBusiness.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-mono text-emerald-700 break-all hover:underline"
                          >
                            {getCanonicalPublicReviewUrl(selectedBusiness.slug, origin).url}
                          </a>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                            Google Review Destination
                          </span>
                          <a
                            href={selectedBusiness.googleReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-mono text-slate-700 break-all hover:underline"
                          >
                            {selectedBusiness.googleReviewUrl}
                          </a>
                        </div>

                        {selectedBusiness.description && (
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                              Description
                            </span>
                            <p className="text-slate-700 leading-relaxed">
                              {selectedBusiness.description}
                            </p>
                          </div>
                        )}

                        <div className="pt-2">
                          <a
                            href={`/r/${selectedBusiness.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition shadow-sm text-xs"
                          >
                            <span>Open Live Customer Review Page</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  Select a business on the left to preview QR code and details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: ADMIN PARENT CATEGORIES */}
        {/* ========================================== */}
        {isAdmin && activeTab === "parents" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Universal Parent Categories
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top-level industry sectors (Hospitality, Healthcare, Technology, Retail, Education, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewParentModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" />
                Add Parent Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parentCategories.map((p) => {
                const subCount = subcategories.filter((s) => s.parentId === p.id).length;
                const bizCount = businesses.filter((b) => b.parentCategoryId === p.id).length;

                return (
                  <div
                    key={p.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          Order: {p.displayOrder || 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditParentModal(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParentCategory(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mb-1">{p.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mb-2">slug: {p.slug}</p>
                      {p.description && (
                        <p className="text-xs text-slate-500 mb-3">{p.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>{subCount} Subcategories</span>
                      <span className="font-semibold text-emerald-700">{bizCount} Businesses</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: ADMIN SUBCATEGORIES */}
        {/* ========================================== */}
        {isAdmin && activeTab === "subcategories" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Subcategories &amp; Dynamic Services
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specific business types under each parent industry with assigned review services.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewSubModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" />
                Add Subcategory
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((s) => {
                const parent = parentCategories.find((p) => p.id === s.parentId);
                const bizCount = businesses.filter((b) => b.subcategoryId === s.id || b.categoryId === s.id).length;

                return (
                  <div
                    key={s.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                          {parent?.name || "Unassigned Parent"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubModal(s)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mb-1">{s.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mb-2">slug: {s.slug}</p>
                      {s.description && (
                        <p className="text-xs text-slate-500 mb-2">{s.description}</p>
                      )}

                      {/* Services Pills */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.services.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>{s.services.length} Service tags</span>
                      <span className="font-semibold text-emerald-700">{bizCount} Businesses</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: ADMIN CLIENT ACCOUNTS */}
        {/* ========================================== */}
        {isAdmin && activeTab === "clients" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Registered Client Accounts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clients who manage their own business profiles.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Company / Business</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Active Businesses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.email}</td>
                      <td className="px-4 py-3 text-slate-700">{c.companyName || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {businesses.filter((b) => b.clientId === c.id).length} business(es)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: ADMIN AUDIT LOGS */}
        {/* ========================================== */}
        {isAdmin && activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Business &amp; Category Audit Logs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete history of business profile creations, updates, and deletions.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">User Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.action === "create"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.action === "update"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {log.businessName || log.businessId}
                        </td>
                        <td className="px-4 py-3 uppercase text-slate-600">
                          {log.userRole} ({log.userId})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* CLIENT 7-STEP BUSINESS REGISTRATION / EDIT MODAL */}
      {/* ======================================================== */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditingExisting ? "Edit Business Profile" : "Add New Business (7-Step Wizard)"}
                </h3>
                <p className="text-xs text-slate-500">
                  Step {wizardStep} of 7: {
                    wizardStep === 1 ? "Business Name & Public Slug" :
                    wizardStep === 2 ? "Select Parent Industry" :
                    wizardStep === 3 ? "Select Subcategory & Business Type" :
                    wizardStep === 4 ? "Business Description" :
                    wizardStep === 5 ? "Logo & Brand Accent Color" :
                    wizardStep === 6 ? "Google Review URL & Contact Info" :
                    "Review & Save Profile"
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div
                  key={num}
                  className={`flex-1 h-1.5 rounded-full mx-0.5 transition-all ${
                    num <= wizardStep ? "bg-emerald-600" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>

            {businessError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{businessError}</span>
              </div>
            )}

            {/* STEP 1: BUSINESS NAME & SLUG */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => handleSlugify(e.target.value)}
                    placeholder="e.g. Kartik Restaurant & Bar or RMSolution Tech"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Public Review Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2.5 rounded-l-xl text-slate-500 font-mono text-xs">
                      /r/
                    </span>
                    <input
                      type="text"
                      required
                      value={bizSlug}
                      onChange={(e) => setBizSlug(e.target.value)}
                      placeholder="kartik-restaurant-bar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Customers will scan and visit: <code className="text-slate-600">/r/{bizSlug || "slug"}</code>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: PARENT CATEGORY */}
            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <label className="block font-semibold text-slate-700">
                  Select Parent Industry *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {parentCategories.map((p) => {
                    const isSelected = bizParentId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleParentCategoryChange(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{p.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SUBCATEGORY & BUSINESS TYPE */}
            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Select Specific Business Subcategory *
                  </label>
                  {!showCustomTypeInput && (
                    <button
                      type="button"
                      onClick={() => setShowCustomTypeInput(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Custom Type
                    </button>
                  )}
                </div>

                {showCustomTypeInput && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-semibold text-slate-800 text-xs">
                      Enter New Business Type Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTypeName}
                        onChange={(e) => setCustomTypeName(e.target.value)}
                        placeholder="e.g. Cloud Security Consultancy or Luxury Villa"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomType}
                        disabled={!customTypeName.trim()}
                        className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomTypeInput(false)}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {subcategories
                    .filter((s) => s.parentId === bizParentId)
                    .map((s) => {
                      const isSelected = bizSubId === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSubcategoryChange(s.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold shadow-sm"
                              : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span>{s.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {s.services.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      );
                    })}
                </div>
                {subcategories.filter((s) => s.parentId === bizParentId).length === 0 && !showCustomTypeInput && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                    <p className="mb-2">No predefined subcategories under this industry yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowCustomTypeInput(true)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
                    >
                      + Add Custom Business Type
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: DESCRIPTION, DYNAMIC REVIEW QUESTION & TAGS */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Review Focus Question (Optional)
                  </label>
                  <input
                    type="text"
                    value={bizReviewQuestion}
                    onChange={(e) => setBizReviewQuestion(e.target.value)}
                    placeholder={
                      subcategories.find((s) => s.id === bizSubId)?.reviewQuestion ||
                      "e.g. What did you appreciate about our service?"
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    maxLength={180}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The specific question asked to customers on your public review landing page (e.g. &ldquo;What stood out during your appointment?&rdquo;).
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bizDescription}
                    onChange={(e) => setBizDescription(e.target.value)}
                    placeholder="e.g. Professional enterprise software engineering and cloud infrastructure services."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    maxLength={350}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Displayed prominently on your public review landing page.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Review Tags / Services (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={bizCustomServices}
                    onChange={(e) => setBizCustomServices(e.target.value)}
                    placeholder={
                      subcategories.find((s) => s.id === bizSubId)?.services.slice(0, 4).join(", ") ||
                      "e.g. Technical Expertise, Delivery Speed, Communication (comma-separated)"
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave empty to automatically use default tags from the selected subcategory. No food defaults will appear for non-food businesses.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 5: LOGO & BRAND COLOR */}
            {wizardStep === 5 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={bizLogoUrl}
                    onChange={(e) => setBizLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Brand Accent Color *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bizAccentColor}
                      onChange={(e) => setBizAccentColor(e.target.value)}
                      className="w-12 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bizAccentColor}
                      onChange={(e) => setBizAccentColor(e.target.value)}
                      className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                    />
                    <div
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: bizAccentColor }}
                    >
                      Color Preview
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: GOOGLE REVIEW URL & CONTACT INFO */}
            {wizardStep === 6 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Google Review URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={bizGoogleReviewUrl}
                    onChange={(e) => setBizGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Direct destination link where customers are sent to submit their 5-star Google review.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={bizContactEmail}
                      onChange={(e) => setBizContactEmail(e.target.value)}
                      placeholder="owner@business.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={bizContactPhone}
                      onChange={(e) => setBizContactPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW & SAVE */}
            {wizardStep === 7 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Business:</span>
                    <span className="font-bold text-slate-900">{bizName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Slug:</span>
                    <span className="font-mono text-emerald-700">/r/{bizSlug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Industry:</span>
                    <span className="text-slate-800">
                      {parentCategories.find((p) => p.id === bizParentId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Type:</span>
                    <span className="text-slate-800">
                      {subcategories.find((s) => s.id === bizSubId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Destination:</span>
                    <span className="font-mono text-slate-700 truncate max-w-xs">{bizGoogleReviewUrl}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bizActiveCheck"
                    checked={bizIsActive}
                    onChange={(e) => setBizIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="bizActiveCheck" className="text-slate-700 font-semibold">
                    Publish Business Profile immediately (Active on Public Website)
                  </label>
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 7 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && (!bizName.trim() || !bizSlug.trim())) {
                      setBusinessError("Please enter both business name and public slug.");
                      return;
                    }
                    if (wizardStep === 2 && !bizParentId) {
                      setBusinessError("Please select a parent industry category.");
                      return;
                    }
                    if (wizardStep === 3 && !bizSubId) {
                      setBusinessError("Please select a business subcategory.");
                      return;
                    }
                    if (wizardStep === 6 && !bizGoogleReviewUrl.trim()) {
                      setBusinessError("Please provide your Google Review destination URL.");
                      return;
                    }
                    setBusinessError(null);
                    setWizardStep(wizardStep + 1);
                  }}
                  className="flex items-center gap-1 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-md"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveBusinessProfile}
                  disabled={savingBusiness}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingBusiness ? "Saving..." : "Save & Publish Profile"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteModalOpen && businessToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Delete Business Profile?
            </h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{businessToDelete.name}</strong>?
              This will remove the public review page and QR destination. Historical records remain archived safely.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingBusiness}
                onClick={handleExecuteDeleteBusiness}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                {deletingBusiness ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN PARENT CATEGORY MODAL */}
      {/* ======================================================== */}
      {isParentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editParentId ? "Edit Parent Category" : "Add Parent Category"}
            </h3>

            {parentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {parentError}
              </div>
            )}

            <form onSubmit={handleSaveParentCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => {
                    setParentName(e.target.value);
                    if (!editParentId) {
                      setParentSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                    }
                  }}
                  placeholder="e.g. Hospitality & Food Services"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={parentSlug}
                  onChange={(e) => setParentSlug(e.target.value)}
                  placeholder="hospitality"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={parentDesc}
                  onChange={(e) => setParentDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={parentOrder}
                    onChange={(e) => setParentOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={parentIsActive}
                      onChange={(e) => setParentIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsParentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN SUBCATEGORY MODAL */}
      {/* ======================================================== */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editSubId ? "Edit Subcategory" : "Add Subcategory"}
            </h3>

            {subError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {subError}
              </div>
            )}

            <form onSubmit={handleSaveSubcategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={subParentId}
                  onChange={(e) => setSubParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => {
                    setSubName(e.target.value);
                    if (!editSubId) {
                      setSubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                    }
                  }}
                  placeholder="e.g. Restaurant & Bar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  placeholder="restaurant-bar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Services / Review Tags * (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={subServices}
                  onChange={(e) => setSubServices(e.target.value)}
                  placeholder="Food Quality, Drinks, Ambience, Prompt Service, Friendly Staff"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
