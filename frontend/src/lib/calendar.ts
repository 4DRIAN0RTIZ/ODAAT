import type { MonthDay } from './date';

export interface YearMonth {
	year: number;
	month: number;
}

// The reflection data is year-agnostic and includes 02-29, so February always has 29 days.
const DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const FECHA_PARAM = 'fecha';

export function daysInMonth(month: number): number {
	return DAYS_PER_MONTH[month - 1];
}

/**
 * Cells of a month, Monday-first: `null` for leading blanks, then 1..N.
 * `year` only determines which weekday the month starts on.
 */
export function buildMonthGrid(year: number, month: number): Array<number | null> {
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
	const leadingBlanks = (firstWeekday + 6) % 7;
	const days = Array.from({ length: daysInMonth(month) }, (_, index) => index + 1);
	return [...Array<null>(leadingBlanks).fill(null), ...days];
}

export function shiftMonth(from: YearMonth, delta: number): YearMonth {
	const index = from.year * 12 + (from.month - 1) + delta;
	return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 };
}

export function availableDaysInMonth(reflections: ReadonlyArray<MonthDay>, month: number): Set<number> {
	return new Set(reflections.filter((item) => item.month === month).map((item) => item.day));
}

/** Parses a `MM-DD` query value, or returns null when malformed or not a real calendar day. */
export function parseFechaParam(value: string | null): MonthDay | null {
	const match = /^(\d{2})-(\d{2})$/.exec(value ?? '');
	if (!match) return null;
	const month = Number(match[1]);
	const day = Number(match[2]);
	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(month)) return null;
	return { month, day };
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Returns `pageUrl` with `?fecha=MM-DD` set (or removed when `monthDay` is null). */
export function buildShareUrl(pageUrl: string, monthDay: MonthDay | null): string {
	const url = new URL(pageUrl);
	if (monthDay) {
		url.searchParams.set(FECHA_PARAM, `${pad2(monthDay.month)}-${pad2(monthDay.day)}`);
	} else {
		url.searchParams.delete(FECHA_PARAM);
	}
	return url.toString();
}

/** Month/day to keep in the URL: null for today's reflection (bare URL), otherwise the displayed day. */
export function fechaForUrl(displayed: MonthDay, today: MonthDay): MonthDay | null {
	return displayed.month === today.month && displayed.day === today.day ? null : displayed;
}
