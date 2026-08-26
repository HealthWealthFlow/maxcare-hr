/**
 * Client-side email delivery via EmailJS (REST API — supports browser CORS, no server).
 * Configure with VITE_EMAILJS_* env vars (in .env, gitignored) so the keys never ship in source.
 * If not configured, callers should fall back to a demo mode (show the code on-screen).
 */

const read = (envName: string, storageKey: string): string => {
  const env = (import.meta.env?.[envName] as string | undefined)?.trim();
  if (env) return env;
  return (localStorage.getItem(storageKey) || '').trim();
};

const SERVICE_ID = () => read('VITE_EMAILJS_SERVICE_ID', 'maxcare_emailjs_service');
const TEMPLATE_ID = () => read('VITE_EMAILJS_TEMPLATE_ID', 'maxcare_emailjs_template');
const PUBLIC_KEY = () => read('VITE_EMAILJS_PUBLIC_KEY', 'maxcare_emailjs_public');
const DEFAULT_TO = 'maxcarepharmacy99@gmail.com';

export const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send';

export function getEmailRecipient(): string {
  const to = read('VITE_EMAILJS_TO', 'maxcare_emailjs_to');
  return to || DEFAULT_TO;
}

/** True when EmailJS is fully configured (service + template + public key present). */
export function isEmailConfigured(): boolean {
  return Boolean(SERVICE_ID() && TEMPLATE_ID() && PUBLIC_KEY());
}

/** Send a 4-digit verification code to the configured recipient. Throws on failure. */
export async function sendVerificationCode(code: string): Promise<void> {
  const serviceId = SERVICE_ID();
  const templateId = TEMPLATE_ID();
  const publicKey = PUBLIC_KEY();
  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS is not configured. Set VITE_EMAILJS_SERVICE_ID / TEMPLATE_ID / PUBLIC_KEY.');
  }

  const res = await fetch(EMAILJS_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: getEmailRecipient(),
        to_name: 'Maxcare Pharmacy',
        from_name: 'Maxcare HR',
        code,
      },
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.message || j?.status || '';
    } catch {
      /* ignore */
    }
    throw new Error(`Email send failed (${res.status}): ${detail || res.statusText}`);
  }
}
