import { Employee, LeaveRequest, PublicHoliday, LeavePolicy, AdjustmentRecord } from '../types/leave';

/** The deployed Apps Script /exec URL (set VITE_SHEETS_API_URL). Empty → app uses localStorage. */
export function sheetsApiUrl(): string {
  return ((import.meta.env?.VITE_SHEETS_API_URL as string) || '').trim();
}

export interface SheetSnapshot {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  adjustments: AdjustmentRecord[];
  holidays: PublicHoliday[];
  policy: LeavePolicy;
}

/** Google Sheets returns dates as Date objects that serialise to ISO strings with a UTC shift.
 *  Normalise any full ISO datetime back to a local YYYY-MM-DD. */
function toISODate(v: unknown): unknown {
  if (typeof v !== 'string' || !v.includes('T')) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Pull the whole dataset from the sheet. Returns null on any failure (caller keeps local data). */
export async function fetchSheetSnapshot(url: string): Promise<SheetSnapshot | null> {
  try {
    const res = await fetch(`${url}?action=all`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.employees)) return null;

    const employees = data.employees.map((e: any) => ({
      ...e,
      joinDate: toISODate(e.joinDate) as string,
    }));
    const leaveRequests = data.leaveRequests.map((r: any) => ({
      ...r,
      startDate: toISODate(r.startDate) as string,
      endDate: toISODate(r.endDate) as string,
      submittedDate: toISODate(r.submittedDate) as string,
    }));
    const holidays = (data.holidays || []).map((h: any) => ({
      ...h,
      date: toISODate(h.date) as string,
    }));
    const adjustments = (data.adjustments || []).map((a: any) => ({
      ...a,
      date: a.date || '',
    }));

    return { employees, leaveRequests, adjustments, holidays, policy: data.policy };
  } catch {
    return null;
  }
}

/** Fire a write action to the sheet (best-effort; never blocks the UI). */
export function pushSheetAction(
  url: string,
  action: string,
  params: Record<string, string | number | boolean>,
): void {
  if (!url) return;
  const qs = new URLSearchParams({
    action,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();
  fetch(`${url}?${qs}`).catch(() => {
    /* best-effort */
  });
}
