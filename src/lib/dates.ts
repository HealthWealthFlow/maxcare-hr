/**
 * Small date helpers that keep the app consistent with the real current date
 * instead of hardcoded demo fixtures. All ISO strings are YYYY-MM-DD in the
 * local timezone (never UTC), so "today" is always the user's today.
 */

/** Format a Date as a local YYYY-MM-DD string. */
export function toLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's date as a local YYYY-MM-DD string. */
export function todayISO(): string {
  return toLocalISO(new Date());
}

/** e.g. "Thursday, 10 Sep 2026" */
export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** e.g. "10 Sep" (from an ISO date) */
export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

/** e.g. "10 Sep - 11 Sep" (from two ISO dates) */
export function formatDateRange(startISO: string, endISO: string): string {
  if (startISO === endISO) return formatShortDate(startISO);
  return `${formatShortDate(startISO)} - ${formatShortDate(endISO)}`;
}

/** Current year, e.g. 2026 */
export function currentYear(): string {
  return String(new Date().getFullYear());
}

/** Current month name, e.g. "September" */
export function currentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long' });
}

/** Zero-indexed month + year of "today", e.g. (8, 2026) */
export function currentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/** e.g. "2026-09" (current year-month prefix for filtering) */
export function currentYearMonthPrefix(): string {
  return toLocalISO().slice(0, 7);
}

/**
 * Completed full months of service from a join date to "today" (or a given date).
 * e.g. join 2026-03-25 to 2026-08-25 = 5 completed months.
 */
export function completedMonthsOfService(joinDate: string, from: Date = new Date()): number {
  const [jy, jm, jd] = joinDate.split('-').map(Number);
  if (!jy || !jm || !jd) return 0;
  let months = (from.getFullYear() - jy) * 12 + (from.getMonth() + 1) - jm;
  if (from.getDate() < jd) months -= 1;
  return Math.max(0, months);
}

/**
 * Earn-to-Date leave (whole days, floored): entitlement / 12 x completed months of service.
 * Capped at the entitlement and never negative. Used for Annual (and Medical) accrual.
 */
export function earnedToDate(entitlement: number, joinDate: string): number {
  const months = completedMonthsOfService(joinDate);
  const earned = Math.floor((entitlement / 12) * months);
  return Math.max(0, Math.min(entitlement, earned));
}

/** Time-of-day greeting, e.g. "Good Morning" / "Good Afternoon" / "Good Evening". */
export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Whole months the employee works in the current calendar year (pro-rata factor for a mid-year joiner). */
export function monthsInCurrentYear(joinDate: string): number {
  return monthsInYear(joinDate, new Date().getFullYear());
}

/** Whole months the employee works in a specific calendar year. */
export function monthsInYear(joinDate: string, year: number): number {
  const [jy, jm] = joinDate.split('-').map(Number);
  if (!jy || !jm) return 12;
  if (jy < year) return 12;
  if (jy === year) return Math.max(1, 12 - jm + 1);
  return 12;
}

/** A full per-year entitlement pro-rated for the months worked in a given year (mid-year joiner). */
export function proRateEntitlement(base: number, joinDate: string, year: number): number {
  return Math.max(1, Math.floor((base * monthsInYear(joinDate, year)) / 12));
}
