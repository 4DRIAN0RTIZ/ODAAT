export interface MonthDay {
	month: number;
	day: number;
}

const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City';

const mexicoDateFormat = new Intl.DateTimeFormat('en-CA', {
	timeZone: MEXICO_CITY_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

function mexicoCityDate(now: Date): { year: number; month: number; day: number } {
	const parts = mexicoDateFormat.formatToParts(now);
	const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
	return { year: read('year'), month: read('month'), day: read('day') };
}

/** Calendar date of `now` in Mexico City. */
export function todayInMexicoCity(now: Date): { year: number; month: number; day: number } {
	return mexicoCityDate(now);
}

/** Month/day of the day after `now`, according to the calendar in Mexico City. */
export function tomorrowInMexicoCity(now: Date): MonthDay {
	const { year, month, day } = mexicoCityDate(now);
	// Pure calendar arithmetic in UTC: no local time zone or DST involved.
	const next = new Date(Date.UTC(year, month - 1, day + 1));
	return { month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}
