export function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = todayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date >= today && date < tomorrow;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isPastDue(nextReviewAt: string, now: Date = new Date()): boolean {
  return new Date(nextReviewAt) <= now;
}
