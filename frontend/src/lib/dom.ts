import type { Reflection } from './api';
import { buildShareUrl, fechaForUrl } from './calendar';
import { todayInMexicoCity } from './date';
import { saveLastReflection } from './last-reflection';

/** Renders the reflection and remembers it as the last one shown (for offline use). */
export function applyReflectionToDom(reflection: Reflection): void {
	const reflectionTitle = document.getElementById('reflection-title');
	const reflectionDate = document.getElementById('reflection-date');
	const reflectionParagraphs = document.getElementById('reflection-paragraphs');

	if (!reflectionTitle || !reflectionDate || !reflectionParagraphs) {
		throw new Error('Reflection DOM nodes not found');
	}

	reflectionTitle.textContent = reflection.title;
	reflectionDate.textContent = reflection.date_label;
	reflectionDate.dataset.month = String(reflection.month);
	reflectionDate.dataset.day = String(reflection.day);
	reflectionParagraphs.replaceChildren();
	for (const paragraph of reflection.paragraphs) {
		const p = document.createElement('p');
		p.textContent = paragraph;
		reflectionParagraphs.appendChild(p);
	}
	saveLastReflection(reflection);
}

/** Month/day of the reflection currently displayed, or null before any was applied. */
export function readDisplayedMonthDay(): { month: number; day: number } | null {
	const { month, day } = document.getElementById('reflection-date')?.dataset ?? {};
	return month && day ? { month: Number(month), day: Number(day) } : null;
}

/** Reflects the displayed reflection in the address bar: `?fecha=MM-DD`, or the bare URL for today. */
export function syncUrlWithReflection(reflection: Reflection): void {
	const today = todayInMexicoCity(new Date());
	const fecha = fechaForUrl(
		{ month: reflection.month, day: reflection.day },
		{ month: today.month, day: today.day },
	);
	const url = new URL(buildShareUrl(window.location.href, fecha));
	history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
