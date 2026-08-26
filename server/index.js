import express from 'express';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);
const MANAGER_EMAIL = (process.env.MANAGER_EMAIL || 'manager@maxcare.com.my').toLowerCase();
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'maxcare123';
const EMAIL_TO = process.env.EMAIL_TO || 'maxcarepharmacy99@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'Maxcare Pharmacy <onboarding@resend.dev>';
const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 30);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
// 2FA is OFF for development; enable it before publishing (or it auto-ONs in production).
const REQUIRE_2FA = process.env.REQUIRE_2FA
  ? process.env.REQUIRE_2FA === 'true'
  : process.env.NODE_ENV === 'production';

/** email -> { code, expiresAt, attempts, lastSentAt } — in-memory, not exposed to the client. */
const otps = new Map();

// CORS (the Vite dev server proxies /api, so this mainly matters for cross-origin deploys).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/** Send the code via Resend; returns whether it was actually emailed. */
async function sendOtpEmail(to, code) {
  if (!RESEND_API_KEY) {
    console.log(`[dev] OTP for ${to}: ${code}  (set RESEND_API_KEY to email it instead)`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: 'Maxcare HR — Manager Verification Code',
      text: `Your Maxcare HR manager verification code is: ${code}\n\nIt expires in ${OTP_TTL_MIN} minutes.\n\nIf you did not request this, please ignore this email.`,
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(`Resend ${res.status}: ${j?.message || res.statusText}`);
  }
  return true;
}

// --- Request an OTP for the manager ---
app.post('/api/auth/request-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== MANAGER_EMAIL || password !== MANAGER_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
  }

  // 2FA disabled → credentials are enough, skip the code.
  if (!REQUIRE_2FA) {
    return res.json({ ok: true, requiresVerification: false, message: 'Signed in.' });
  }

  const existing = otps.get(email);
  if (existing && Date.now() - existing.lastSentAt < OTP_RESEND_SECONDS * 1000) {
    return res.status(429).json({ ok: false, error: 'Please wait a moment before requesting a new code.' });
  }

  const code = String(crypto.randomInt(1000, 10000));
  otps.set(email, {
    code,
    expiresAt: Date.now() + OTP_TTL_MIN * 60 * 1000,
    attempts: 0,
    lastSentAt: Date.now(),
  });

  let emailSent = false;
  try {
    emailSent = await sendOtpEmail(EMAIL_TO, code);
  } catch (e) {
    console.error('Email send failed:', e.message);
  }

  return res.json({ ok: true, emailSent, requiresVerification: true, message: 'A verification code has been sent.' });
});

// --- Verify the OTP ---
app.post('/api/auth/verify-otp', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const entry = otps.get(email);

  if (!entry) {
    return res.status(400).json({ ok: false, error: 'No active code found. Please request a new one.' });
  }
  if (Date.now() > entry.expiresAt) {
    otps.delete(email);
    return res.status(400).json({ ok: false, error: 'The code has expired. Please request a new one.' });
  }
  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    otps.delete(email);
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please request a new code.' });
  }
  if (code !== entry.code) {
    entry.attempts += 1;
    return res.status(400).json({ ok: false, error: 'Incorrect code. Please try again.' });
  }

  otps.delete(email);
  return res.json({ ok: true });
});

// --- AI Assistant (DeepSeek) — the API key stays server-side ---
app.get('/api/ai/health', (req, res) => {
  res.json({ configured: Boolean(DEEPSEEK_API_KEY) });
});

app.post('/api/ai', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!messages.length) return res.status(400).json({ ok: false, error: 'No messages provided.' });
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'DeepSeek is not configured on the server. Set DEEPSEEK_API_KEY in the backend .env.',
    });
  }
  // Keep only the fields we forward and bound the history length.
  const clean = messages
    .slice(0, 20)
    .map((m) => ({ role: String(m?.role || 'user'), content: String(m?.content || '') }));

  try {
    const r = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: DEEPSEEK_MODEL, messages: clean, temperature: 0.4, stream: false }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      throw new Error(`DeepSeek ${r.status}: ${j?.error?.message || j?.message || r.statusText}`);
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content;
    return res.json({ ok: true, reply: (typeof reply === 'string' ? reply : '').trim() });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message || 'DeepSeek request failed.' });
  }
});

// --- Serve the built frontend (production) ---
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'Not found' });
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Maxcare HR server running at http://localhost:${PORT}`);
});
