# Maxcare HR — Proactive Leave Management System

A modern, responsive leave management portal built for **Maxcare Pharmacy**. It has two portals in one app:

- **Employee view** — home dashboard, apply for leave, leave history, team calendar, profile, printable monthly report.
- **Manager view (Pharmacy Manager / Admin)** — manager dashboard, request review & approval, team roster with balance adjustments, leave summary report (CSV export), AI assistant, and policy settings.

> The app's leave data lives in the browser (`localStorage`, seeded by `src/data/mockData.ts`). The **manager login** is secured by a **server-side 2FA** flow (Express backend) — a 4-digit code is generated, validated, and emailed on the server, so it never appears in the client.

---

## ✨ Key Features

- **Proactive notice-policy engine** — computes advance-notice days, flags *late* applications, and auto-computes leave duration (manually adjustable).
- **Approval workflow** — approve/reject requests with automatic leave-balance updates and rejection reasons.
- **Leave types** — Annual, Unpaid, Emergency (default: deduct from annual leave), plus Medical/sick balance.
- **Manager 2FA** — email + password, then a **server-generated 4-digit code** emailed to the pharmacy inbox (Resend); code is verified server-side with expiry and attempt limits.
- **AI Assistant** — DeepSeek-powered chat that analyses the live leave data in the manager portal.
- **Team calendar** — monthly view with mandatory vs optional company holidays.
- **Printable monthly leave report** — with employee & manager signature lines (print / save as PDF).
- **Balance adjustments, policy settings, CSV export** — all retained and responsive on desktop + mobile.

---

## 🚀 Run Locally

**Prerequisites:** [Node.js](https://nodejs.org) (v18+; tested on v24).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure secrets — copy `.env.example` to `.env` and fill in the manager credentials, the DeepSeek key, and the Resend key (only the manager credentials are needed to run; the rest enable the AI/email features):
   ```bash
   cp .env.example .env
   ```
3. Start both servers — this runs the backend **and** the frontend together and **auto-restarts** them if they crash (or when the backend file changes):
   ```bash
   npm run dev:all
   ```
   > Run each in a separate terminal if you prefer: `npm run server` (backend :3001) and `npm run dev` (frontend :3000, proxies `/api` → :3001).
4. Open **http://localhost:3000/**.

> **Manager login:** use `manager@maxcare.com.my` / `maxcare123` (change in `.env`). The code is emailed to `EMAIL_TO`. If `RESEND_API_KEY` isn't set, the code is printed to the **backend console** instead.

| Script | Purpose |
| --- | --- |
| `npm run dev:all` | Backend + frontend together, **auto-restart** (concurrently + nodemon) |
| `npm run dev` | Vite dev server on `:3000` |
| `npm run server` / `npm run dev:server` | Express backend on `:3001` (plain / nodemon auto-reload) |
| `npm run build` | Production build to `dist/` |
| `npm start` | Run the built app + API via Express (single server) |
| `npm run lint` | Type-check with `tsc --noEmit` |

---

## 🧩 Tech Stack

- React 19 + Vite 6 + TypeScript, Tailwind CSS 4
- Express + Node (backend for manager 2FA), Resend (email)
- `lucide-react`, `motion`; state via React Context + `localStorage`

## 📁 Project Structure

```
server/index.js        # Express: manager 2FA (OTP + email) + serves dist/
src/
├── components/        # auth, employee, manager, layout
├── context/           # LeaveProvider (all state + actions)
├── data/              # mockData.ts (employees, leave, holidays, policy)
├── lib/               # date + deepseek helpers
└── types/             # TypeScript models
```

## ✏️ Customising

- **Branding / name** — edit `APP_META` in `src/data/mockData.ts`.
- **Employees, balances, holidays, policy** — edit the `INITIAL_*` exports in `src/data/mockData.ts`.
- **Manager credentials / 2FA** — `MANAGER_EMAIL`, `MANAGER_PASSWORD`, `EMAIL_TO` in `.env`.

## ☁️ Deploying

This is now a **Node/Express app** (not a static-only site), because the manager 2FA needs the API:

1. Build the frontend: `npm run build` (outputs `dist/`).
2. Deploy `server/index.js` + `dist/` to a Node host — **Render, Railway, Fly.io**, or a VPS — with `npm start`.
3. Set the env vars in your host (see `.env`): `MANAGER_EMAIL`, `MANAGER_PASSWORD`, `EMAIL_TO`, `RESEND_API_KEY`, `RESEND_FROM`, `DEEPSEEK_API_KEY`.

> If you prefer a purely static host (GitHub Pages / Netlify), the manager 2FA must be moved to a **serverless function** (e.g. Vercel/Netlify function using Resend). Everything else works as a static site.

---

© Maxcare Pharmacy. Built as an internal leave-management portal prototype.
