"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, Shield, Mail, User, Building, UserPlus, CheckCircle2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"admin" | "client_login" | "client_register">("admin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (authMode === "client_register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            companyName,
            phone,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed");
          setLoading(false);
          return;
        }

        setSuccess("Account registered successfully! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
        return;
      }

      // Login (Admin password or Client email/password)
      const payload =
        authMode === "admin"
          ? { password }
          : { email, password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          {authMode === "client_register" ? (
            <UserPlus className="w-6 h-6 text-emerald-400" />
          ) : authMode === "admin" ? (
            <Shield className="w-6 h-6 text-emerald-400" />
          ) : (
            <User className="w-6 h-6 text-emerald-400" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          {authMode === "admin"
            ? "RMSolution Admin Portal"
            : authMode === "client_login"
            ? "Client Portal Login"
            : "Register Client Account"}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm text-center mb-5">
          {authMode === "admin"
            ? "Manage all multi-industry business categories, clients and profiles."
            : authMode === "client_login"
            ? "Sign in to manage your business profile, categories and QR reviews."
            : "Create an account to publish your business QR reviews."}
        </p>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("admin");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              authMode === "admin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Admin Master
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("client_login");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              authMode === "client_login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Client Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("client_register");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              authMode === "client_register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            New Client
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "client_register" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name / Owner Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kartik Patil"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Business / Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Kartik Restaurant & Bar"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </>
          )}

          {authMode !== "admin" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Client Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full px-4 py-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              {authMode === "admin" ? "Admin Master Password *" : "Password *"}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 shadow-md"
          >
            {loading
              ? "Processing..."
              : authMode === "client_register"
              ? "Register Account"
              : authMode === "admin"
              ? "Sign In as Admin"
              : "Sign In as Client"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          {authMode === "admin" ? (
            <span>
              Admin access grants control over all universal business categories & all client profiles.
            </span>
          ) : (
            <span>
              Clients only see and manage businesses registered under their account.
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
