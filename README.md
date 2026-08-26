# Maxcare HR — Proactive Leave Management System

A modern, responsive leave management portal for **Maxcare Pharmacy**. One app, two portals:

- **Employee view** — home dashboard, apply for leave, leave history, team calendar, profile, printable monthly report.
- **Manager view (Pharmacy Manager / Admin)** — manager dashboard, request review & approval, team roster with balance adjustments, leave summary report (CSV export), AI assistant, and policy settings.

> **Data lives in Google Sheets** (a shared, always‑available store) and is synced automatically. The app also keeps a local fallback copy so it works offline/standalone.

---

## ✨ Key Features

- **Real per‑user login** — each staff member and the manager sign in with their own **username + password** (the manager can reset a staff password; staff change their own from their Profile; username is locked).
- **Google Sheets backend** — leave records, balances, holidays and policy are stored in a Google Sheet via an Apps Script web app; all changes push back automatically.
- **Proactive notice‑policy engine** — computes advance‑notice days, flags late applications, and auto‑computes leave duration (manually adjustable).
- **Approval workflow** — approve/reject requests with automatic leave‑balance updates and rejection reasons.
- **Leave types** — Annual, Unpaid, **Emergency (deducts from Annual Leave)**, plus Medical/sick balance.
- **Team calendar** — monthly view with mandatory vs optional company holidays.
- **Printable monthly leave report** — with employee & manager signature lines (print / save as PDF).
- **Balance adjustments, policy settings, CSV export** — responsive on desktop + mobile.
- **Optional** DeepSeek AI assistant and server‑side manager 2FA (works when the Express backend is running; see below).

---

## 🔑 Default Accounts

| Name | Username | Password |
| --- | --- | --- |
| Maxcare Pharmacy (manager) | `Maxcare` | `Maxcare@2026` |
| Lee Xin Mei | `Lee Xin Mei` | `Lee@2026` |
| Nurul Farahin | `Nurul Farahin` | `Nurul@2026` |

> Accounts are stored in the browser (`localStorage`), so a password change is per‑device. For a true shared login across many devices, run the Node backend (see *Deploying*).

---

## ☁️ Live on GitHub Pages

This repo is set up to **auto‑deploy to GitHub Pages** on every push (`.github/workflows/deploy.yml`):

1. The workflow runs `npm run build`.
2. The **Google Sheets `/exec` URL** is injected at build time from the `VITE_SHEETS_API_URL` repository secret (so it isn't hard‑coded in the repo).
3. The built site publishes to `https://<username>.github.io/maxcare-hr/`.

> ⚠️ On the static Pages host there is **no Node backend**, so the **DeepSeek AI chat** and **server‑side manager 2FA** are unavailable (the manager login falls back to a client‑side check). The core leave app works fully and syncs to Google Sheets.

---

## 🚀 Run Locally

**Prerequisites:** [Node.js](https://nodejs.org) (v18+; tested on v24).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure secrets — copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_SHEETS_API_URL` (your Apps Script `/exec` URL) to connect Google Sheets, and the manager / DeepSeek / Resend keys if you want those features.
3. Start both servers (auto‑restart):
   ```bash
   npm run dev:all
   ```
4. Open **http://localhost:3000/**.

| Script | Purpose |
| --- | --- |
| `npm run dev:all` | Backend + frontend together, auto‑restart (concurrently + nodemon) |
| `npm run dev` | Vite dev server on `:3000` |
| `npm run server` / `npm run dev:server` | Express backend on `:3001` |
| `npm run build` | Production build to `dist/` |
| `npm start` | Run the built app + API via Express (single server) |
| `npm run lint` | Type‑check with `tsc --noEmit` |

---

## 🧩 Tech Stack

- React 19 + Vite 6 + TypeScript, Tailwind CSS 4
- Express + Node (optional backend for manager 2FA / AI), Resend (email)
- Google Apps Script (Google Sheets backend); state via React Context + `localStorage`

## 📁 Project Structure

```
apps-script/Code.gs      # Google Sheets backend (Apps Script web app)
server/index.js          # Optional Express: manager 2FA (OTP + email) + serves dist/
.github/workflows/       # GitHub Pages deploy (auto build + publish)
src/
├── components/          # auth, employee, manager, layout
├── context/             # LeaveProvider (all state + actions)
├── data/                # mockData.ts (employees, leave, holidays, policy)
├── lib/                 # date + deepseek helpers
└── types/               # TypeScript models
```

## ✏️ Customising

- **Branding / name** — edit `APP_META` in `src/data/mockData.ts`.
- **Employees, balances, holidays, policy** — edit the `INITIAL_*` exports in `src/data/mockData.ts` (or edit the Google Sheet directly).
- **Accounts** — edit `SEED_USERS` in `src/context/LeaveContext.tsx`; the manager resets staff passwords in the app.
- **Google Sheets URL** — `VITE_SHEETS_API_URL` in `.env` / the GitHub Actions secret.

---

© Maxcare Pharmacy. Built as an internal leave‑management portal.
