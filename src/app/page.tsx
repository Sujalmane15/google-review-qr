import Link from "next/link";
import { QrCode, Sparkles, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <QrCode className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          RMQR Review Helper
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
          Clean, mobile-first Google Review QR codes with instant, honest Gemini AI review suggestions for your customers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-md shadow-slate-900/10"
          >
            Owner Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/r/kartik-restaurant-bar"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition active:scale-95 border border-emerald-200"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Live Customer Demo
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4 text-left text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero Gating & Compliance</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>EN, मराठी & हिन्दी Support</span>
          </div>
        </div>
      </div>
    </main>
  );
}
