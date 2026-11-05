# SkinSafe Production Deployment Guide
**Next.js (Vercel) + FastAPI / RDKit (Render) + Supabase Google OAuth**

This guide provides step-by-step instructions for deploying SkinSafe to live cloud hosting for university project demonstrations.

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Client Browser              │
└──────────────┬──────────────────┘
               │
       ┌───────┴───────────────────────┐
       ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Frontend (Vercel)         │   │ Backend API (Render)      │
│ Next.js 14 App Router     │   │ FastAPI + RDKit (Py 3.12) │
│ Tailwind CSS              │   │ Potts–Guy Permeability    │
│ Supabase Browser Client   │   │ Gemini AI Assistant Proxy │
└──────────────┬────────────┘   └─────────────┬─────────────┘
               │                              │
               ▼                              ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Supabase Auth (OAuth)     │   │ Google Gemini API         │
│ Google Sign-In Provider   │   │ gemini-2.5-flash          │
└───────────────────────────┘   └───────────────────────────┘
```

---

## Step 1: Deploy Backend to Render

### 1. Create a New Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your Git repository containing SkinSafe.
4. Configure the service settings:
   - **Name**: `skinsafe-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`

5. Expand **Advanced**:
   - **Health Check Path**: `/api/v1/health`

### 2. Configure Backend Environment Variables in Render
Under **Environment Variables** in the Render service settings, add:

| Key | Value | Purpose |
|---|---|---|
| `PYTHON_VERSION` | `3.12.8` | Ensures Render installs Python 3.12 with pre-compiled RDKit wheels |
| `ENVIRONMENT` | `production` | Sets application mode to production |
| `CORS_ORIGINS` | `http://localhost:3000` | Local dev origin (you will add your Vercel URL here once created) |
| `CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` | Auto-allows any Vercel production and preview deployment |
| `GEMINI_API_KEY` | `AIzaSy...` *(your secret key)* | Google AI Studio API key (kept strictly private on server) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Fast, low-latency chemistry explanation model |

6. Click **Deploy Web Service**.
7. Once deployed, Render will provide a public URL:
   `https://skinsafe-backend.onrender.com` (Save this for Step 2).

> [!NOTE]
> **Render Free Tier Spin-Down**: Free instances on Render spin down after 15 minutes of inactivity. The first request after a sleep period may take 30–50 seconds while the container initializes. SkinSafe's frontend handles this gracefully with dynamic connection indicators.

---

## Step 2: Deploy Frontend to Vercel

### 1. Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New…** → **Project**.
3. Import your Git repository.
4. In the configuration screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 2. Configure Frontend Environment Variables in Vercel
Under **Environment Variables**, add the following 3 public keys:

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://skinsafe-backend.onrender.com` | Your live Render backend URL from Step 1 (NO trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wuzkbgjwrbwwvkyyxjem.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZQvQ5gJT_HUzTevMOnBCzQ_fTwsg8jc` | Your Supabase Anonymous / Publishable Key |

> [!CAUTION]
> **Never** add `GEMINI_API_KEY` in Vercel. All AI requests must route securely through the backend `/api/v1/assistant/chat` endpoint.

5. Click **Deploy**.
6. When deployment finishes, Vercel gives you your live URL:
   `https://skinsafe.vercel.app` (or similar).

---

## Step 3: Configure Supabase & Google Cloud OAuth

To allow users to sign in with Google on your live production URL:

### 1. Update Supabase Auth URL Configuration
1. Open your [Supabase Dashboard](https://app.supabase.com/) → Select your project (`wuzkbgjwrbwwvkyyxjem`).
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL**:
   `https://skinsafe.vercel.app` (your production Vercel domain).
4. Under **Redirect URLs**, click **Add URL** and add:
   - `https://skinsafe.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (preserves local development)
   - `https://*.vercel.app/auth/callback` (optional: covers Vercel preview URLs)
5. Click **Save**.

### 2. Google Cloud Console Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Select your OAuth 2.0 Client ID for SkinSafe.
3. Under **Authorized JavaScript origins**, add:
   - `https://skinsafe.vercel.app`
   - `http://localhost:3000`
4. Under **Authorized redirect URIs**, verify that the Supabase OAuth callback URL is present:
   - `https://wuzkbgjwrbwwvkyyxjem.supabase.co/auth/v1/callback`
5. Click **Save**.

---

## Step 4: Sync Production CORS on Render

Now that your frontend has its permanent Vercel domain:
1. Open your [Render Dashboard](https://dashboard.render.com/) → `skinsafe-backend`.
2. Go to **Environment**.
3. Update `CORS_ORIGINS`:
   ```env
   https://skinsafe.vercel.app,http://localhost:3000
   ```
4. Render will automatically redeploy the backend with the new allowed origin.

---

## Step 5: Post-Deployment Verification Checklist

Run through these checks on your live website:

| Test Item | Steps to Verify | Expected Result |
|---|---|---|
| **1. Backend Health** | Visit `https://skinsafe-backend.onrender.com/api/v1/health` | Returns `{"status":"ok","engine_ready":true,"rdkit_version":"..."}` |
| **2. Navbar Status** | Open `https://skinsafe.vercel.app` | Status indicator turns green: **"RDKit Ready"** |
| **3. Default Molecule** | Page load | Niacinamide loads automatically with 2D chemical structure, formula `C6H6N2O`, MW `122.12`, TPSA `55.98 Å²` |
| **4. Potts–Guy Permeability** | Inspect Skin Permeability Card | Primary unit is `cm/h` (`4.60e-4 cm/h`); secondary unit is `cm/s` (`1.28e-7 cm/s = cm/h ÷ 3600`) |
| **5. Custom SMILES** | Submit Salicylic Acid: `Oc1ccccc1C(=O)O` | Calculates properties in real-time, displays updated 2D SVG |
| **6. Comparison Lab** | Click **Comparison Lab** tab → Compare Niacinamide vs Salicylic Acid | Side-by-side comparison displays with delta indicators and permeability bar chart |
| **7. Google Login** | Click **"Sign in with Google"** in Navbar | Redirects to Google consent screen → redirects back to `/auth/callback` → lands on home with profile avatar and email displayed |
| **8. Session Persistence** | Refresh the page while logged in | Remains logged in; user name and avatar persist |
| **9. Google Logout** | Click user profile menu → Click **"Sign out"** | Signs out cleanly, returns to "Sign in with Google" |
| **10. AI Assistant (Context)** | Open bottom-right AI Assistant → Ask: *"Why does Salicylic Acid have higher predicted Kp than Niacinamide?"* | Responds using actual calculated properties, explaining logP/MW and Potts–Guy prediction |
| **11. AI Domain Guard** | In AI Assistant, ask: *"Who won the super bowl?"* or *"Write a python script to scrape twitter"* | Programmatically declines: explains it is specialized exclusively in cosmetic chemistry |

