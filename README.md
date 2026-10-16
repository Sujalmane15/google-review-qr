# RMQR — Google Review QR & AI Review Suggestion Platform

A clean, modern, and minimal web application for local businesses (such as **"Kartik Restaurant & Bar"**) that generates branded, high-resolution QR codes. When scanned by customers, it opens a mobile-first review assistant that helps them craft authentic, natural review drafts using Google Gemini AI, copies their review to the clipboard, and guides them directly to post on Google.

---

## Key Features

- **Branded QR Generator (`/dashboard`):** Generate, customize, and export SVG & PNG QR codes for any business.
- **Strict Public URL Architecture:** Prevents printing localhost or local IPs into production QR codes via origin validation and warning badges.
- **Mobile-First Customer Review Page (`/r/[slug]`):** Fast, clean, touch-friendly page with 1-5 star rating selector, experience tags (Food, Service, Ambience, Staff, Value), and optional text input.
- **Google Compliant & Fair (Zero Gating):** All star ratings (1 to 5) have direct, unobstructed access to the configured Google Review destination.
- **Server-Side Google Gemini AI:** Strict anti-hallucination system prompt ensuring the AI drafts only reference details explicitly selected or typed by the customer.
- **Multilingual Support:** English, Marathi (मराठी), and Hindi (हिन्दी) with native Unicode typography and tone fidelity.
- **Persistent Storage Adapter:** Isolated storage architecture supporting reliable local development storage and plug-and-play PostgreSQL (Neon, Supabase, Vercel Postgres) for production without rewriting business logic.
- **Admin Security:** Protected owner dashboard with signed HTTP-only JWT sessions, bcrypt password hashing, and login rate limiting.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS
- **AI Engine:** Official `@google/genai` SDK
- **Validation:** Zod
- **QR Engine:** `qrcode`
- **Authentication:** `jose` (JWT) + `bcryptjs`
- **Database:** PostgreSQL (`pg`) for production; local atomic JSON adapter for development
- **Testing:** Vitest

---

## Windows Developer Setup

> **Note for Windows Users:** If PowerShell blocks script execution (`npm.ps1 cannot be loaded`), use `npm.cmd` and `npx.cmd` rather than weakening system security policies.

### 1. Install Dependencies
```powershell
npm.cmd install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:
```env
# Server-side Gemini API Key (keep secret, never prefix with NEXT_PUBLIC_)
GEMINI_API_KEY=your_gemini_api_key_here

# Public application domain (Must be HTTPS in production, e.g. https://your-project.vercel.app)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin session signing secret (random string)
ADMIN_SESSION_SECRET=super_secret_session_key_at_least_32_characters_long

# Admin login password (used at /login)
ADMIN_PASSWORD=admin123

# Optional: Production PostgreSQL connection string (Neon / Supabase / Vercel Postgres)
# Leave empty for local development storage
DATABASE_URL=
```

### 3. Run Development Server
```powershell
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Owner Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (Password: `admin123`)
- **Customer Demo:** [http://localhost:3000/r/kartik-restaurant-bar](http://localhost:3000/r/kartik-restaurant-bar)

---

## Verification & Testing Commands

### Run Automated Unit & Integration Tests
```powershell
npm.cmd run test
```
*Executes all 27 unit & integration tests across validations, QR generation & decoding, Gemini prompts, and storage.*

### TypeScript Strict Type Checking
```powershell
npm.cmd run typecheck
```

### ESLint Linting
```powershell
npm.cmd run lint
```

### Production Build
```powershell
npm.cmd run build
```

---

## Production Deployment Checklist (Vercel)

1. **Create a Fresh Vercel Project:**
   - Link your new Git repository (do not reuse old RMQR projects).
2. **Configure Production Environment Variables:**
   - `GEMINI_API_KEY`: Your real Google Gemini API Key.
   - `NEXT_PUBLIC_APP_URL`: Your actual assigned HTTPS domain (e.g., `https://rmqr-app.vercel.app`).
   - `ADMIN_SESSION_SECRET`: A cryptographically random 32+ character string.
   - `ADMIN_PASSWORD`: A strong password for the owner dashboard.
   - `DATABASE_URL`: Your production PostgreSQL database URL (e.g. from Neon or Vercel Postgres).
3. **Verify Public QR Code:**
   - Log into `/dashboard` on your deployed site.
   - Confirm that the production QR displays the **Production Ready** badge and encodes `https://YOUR-APP.vercel.app/r/kartik-restaurant-bar`.
   - Scan with a mobile phone camera to confirm it opens the public review assistant.

---

## Security Limits & Known Considerations

1. **Client-Side Clipboard Permissions:** On some mobile browsers, automatic clipboard write requires a direct user gesture. A prominent fallback button (*"Copy Review"*) is always available.
2. **Local JSON Storage:** In serverless production environments (Vercel), local filesystems are ephemeral. Always set `DATABASE_URL` with PostgreSQL for production persistence.
3. **AI Fallbacks:** If the Gemini API key is missing, expired, or throttled, the application gracefully provides structured, rating-aligned drafts and never blocks the customer from manually reviewing or proceeding to Google.
