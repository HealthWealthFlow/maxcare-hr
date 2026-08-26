import { Employee, LeaveRequest, PublicHoliday, LeavePolicy } from '../types/leave';
import { todayISO } from './dates';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const SYSTEM_PROMPT = `You are the Maxcare Pharmacy HR & Leave assistant embedded in the manager portal.
You help the Pharmacy Manager understand and act on the company's leave data.
- Ground every answer in the data context provided below. Do not invent employees, balances, or requests.
- If something is missing or unclear, say so briefly and suggest what to check.
- Be concise and practical: bullet points, short paragraphs, direct recommendations.
- For leave-policy or staffing questions, base recommendations on the provided policy and current requests.
- If the user asks about a specific employee or leave request, reference it by name / ID.
- Answer in the same language the user writes in.`;

export interface LeaveDataContextInput {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  holidays: PublicHoliday[];
  policy: LeavePolicy;
}

/** Build a compact, ready-to-send snapshot of the app's live leave data. */
export function buildLeaveDataContext(data: LeaveDataContextInput): string {
  const lines: string[] = [];
  lines.push(`Today: ${todayISO()}`);
  lines.push('');

  lines.push(`== POLICY ==`);
  lines.push(
    `Annual notice: ${data.policy.annualNoticeDays}d | Unpaid notice: ${data.policy.unpaidNoticeDays}d | Emergency notice: ${data.policy.emergencyNoticeDays}d`,
  );
  lines.push(
    `Emergency treatment: ${data.policy.emergencyTreatment} | Working days: ${Object.entries(data.policy.workingDays)
      .filter(([, v]) => v)
      .map(([k]) => k.toUpperCase())
      .join(', ')}`,
  );
  lines.push('');

  lines.push(`== EMPLOYEES ==`);
  for (const e of data.employees) {
    const avail = Math.max(0, e.entitlements.annualTotal - e.entitlements.annualUsed - e.entitlements.annualPending);
    lines.push(
      `${e.name} (${e.empCode}, ${e.role}, ${e.department}): Annual ${avail} avail (of ${e.entitlements.annualTotal}, used ${e.entitlements.annualUsed}, pending ${e.entitlements.annualPending}); Unpaid used ${e.entitlements.unpaidApprovedYTD}/pending ${e.entitlements.unpaidPending}; Emergency used ${e.entitlements.emergencyApprovedYTD}/pending ${e.entitlements.emergencyPending}; Medical ${e.entitlements.sickUsed}/${e.entitlements.sickTotal}`,
    );
  }
  lines.push('');

  lines.push(`== LEAVE REQUESTS ==`);
  for (const r of data.leaveRequests) {
    const dates = r.startDate === r.endDate ? r.startDate : `${r.startDate} to ${r.endDate}`;
    lines.push(
      `${r.id}: ${r.employeeName} — ${r.type} (${r.durationDays}d) ${dates}, status=${r.status}, submitted ${r.submittedDate}, notice ${r.actualNoticeDays}/${r.requiredNoticeDays}d${r.isLate ? ' LATE' : ''}${r.rejectionReason ? ', reason: ' + r.rejectionReason : ''}`,
    );
  }
  lines.push('');

  lines.push(`== PUBLIC HOLIDAYS ==`);
  for (const h of data.holidays) {
    lines.push(`${h.name}: ${h.date}${h.description ? ` (${h.description})` : ''}`);
  }

  return lines.join('\n');
}

/** Whether the backend reports DeepSeek as configured. */
export async function getAiConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai/health');
    const data = await res.json().catch(() => ({}));
    return Boolean(data?.configured);
  } catch {
    return false;
  }
}

/**
 * Send a chat to the backend, which holds the DeepSeek key and calls DeepSeek.
 * The key never ships to or from the browser.
 */
export async function chatWithDeepSeek(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'AI request failed.');
  }
  return data?.reply || '';
}
