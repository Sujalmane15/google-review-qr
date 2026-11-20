"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Business, ParentCategory } from "@/types";

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bizRes, catRes] = await Promise.all([
          fetch("/api/businesses"),
          fetch("/api/categories/parents"),
        ]);
        if (bizRes.ok && catRes.ok) {
          const biz = await bizRes.json();
          const parents = await catRes.json();
          setBusinesses(biz);
          setParentCategories(parents);
        }
      } catch (err) {
        console.error("Failed to load directory:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesCategory =
      selectedCategory === "all" ||
      b.parentCategoryId === selectedCategory ||
      b.subcategoryId === selectedCategory ||
      b.categoryId === selectedCategory ||
      b.parentCategoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
      b.categoryName?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.parentCategoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subcategoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                RMSolution Platform
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-2 font-medium">
                Universal Multi-Industry
              </span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            Admin Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 py-12 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Universal Google Review & Business Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
            Industry-tailored review assistants with custom service tags for IT Companies, Healthcare, Hospitality, Retail, Construction, and more.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name or service..."
              className="w-full px-4 py-3 pl-11 bg-white border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Industries
            </button>
            {parentCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedCategory === c.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Listing */}
      <section className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Verified Businesses ({filteredBusinesses.length})
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category Filtered
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading directory...
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBusinesses.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: b.accentColor || "#16a34a" }}
                      >
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {b.name}
                        </h3>
                        <span className="text-xs font-medium text-emerald-600">
                          {b.categoryName || "Universal Business"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {b.description && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                      {b.description}
                    </p>
                  )}

                  {/* Industry Tags */}
                  {b.customServices && b.customServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {b.customServices.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[11px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/r/${b.slug}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Open Review Assistant
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">No businesses found in this category.</p>
            <p className="text-xs text-slate-400">
              Create a new business profile in the Admin Dashboard to list it here.
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict Industry Isolation & Zero Review Gating Compliance</span>
        </div>
        <p>© 2026 RMSolution Multi-Industry Platform</p>
      </footer>
    </main>
  );
}
