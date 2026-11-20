import { availableDaysInMonth, buildMonthGrid, shiftMonth, type YearMonth } from './calendar';
import type { MonthDay } from './date';

export const MONTH_NAMES_ES = [
	'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
	'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DAY_BASE_CLASS =
	'h-10 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300';
const DAY_AVAILABLE_CLASS = 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800';
const DAY_UNAVAILABLE_CLASS = 'cursor-not-allowed text-stone-300 line-through';
const DAY_TODAY_CLASS = 'ring-1 ring-emerald-400';
const DAY_DISPLAYED_CLASS = 'bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white';

export interface CalendarOptions {
	/** Resolves the month/day pairs that have a reflection. Called on first open; may reject. */
	loadAvailable: () => Promise<ReadonlyArray<MonthDay>>;
	getDisplayed: () => MonthDay | null;
	getToday: () => { year: number; month: number; day: number };
	onSelect: (monthDay: MonthDay) => void;
	onLoadError: () => void;
}

function requireElement<T extends HTMLElement>(id: string, type: new () => T): T {
	const element = document.getElementById(id);
	if (!(element instanceof type)) throw new Error(`Calendar element #${id} not found`);
	return element;
}

/** Wires the calendar panel to `trigger`. */
export function setupCalendar(trigger: HTMLButtonElement, options: CalendarOptions): void {
	const backdrop = requireElement('calendar-backdrop', HTMLDivElement);
	const panel = requireElement('calendar-panel', HTMLDivElement);
	const title = requireElement('calendar-title', HTMLHeadingElement);
	const grid = requireElement('calendar-grid', HTMLDivElement);
	const prev = requireElement('calendar-prev', HTMLButtonElement);
	const next = requireElement('calendar-next', HTMLButtonElement);
	const close = requireElement('calendar-close', HTMLButtonElement);

	let available: ReadonlyArray<MonthDay> | null = null;
	let shown: YearMonth = { year: 0, month: 1 };
	let opening = false;

	function render() {
		const today = options.getToday();
		const displayed = options.getDisplayed();
		const availableDays = availableDaysInMonth(available ?? [], shown.month);
		title.textContent = `${MONTH_NAMES_ES[shown.month - 1]} ${shown.year}`;

		const cells = buildMonthGrid(shown.year, shown.month).map((day) => {
			if (day === null) {
				const blank = document.createElement('span');
				blank.setAttribute('aria-hidden', 'true');
				return blank;
			}
			const hasReflection = availableDays.has(day);
			const isToday = today.year === shown.year && today.month === shown.month && today.day === day;
			const isDisplayed = displayed?.month === shown.month && displayed.day === day;
			const label = `${day} de ${MONTH_NAMES_ES[shown.month - 1]}`;

			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = String(day);
			button.disabled = !hasReflection;
			button.setAttribute(
				'aria-label',
				[label, isToday ? 'hoy' : '', hasReflection ? '' : 'sin reflexión'].filter(Boolean).join(', '),
			);
			if (isToday) button.setAttribute('aria-current', 'date');
			if (isDisplayed) button.setAttribute('aria-pressed', 'true');
			button.className = [
				DAY_BASE_CLASS,
				hasReflection ? DAY_AVAILABLE_CLASS : DAY_UNAVAILABLE_CLASS,
				isToday ? DAY_TODAY_CLASS : '',
				isDisplayed ? DAY_DISPLAYED_CLASS : '',
			].join(' ');
			button.dataset.day = String(day);
			return button;
		});
		grid.replaceChildren(...cells);
	}

	function focusableElements(): HTMLElement[] {
		return Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));
	}

	function focusInitial() {
		const displayedButton = grid.querySelector<HTMLElement>('button[aria-pressed="true"]');
		(displayedButton ?? grid.querySelector<HTMLElement>('button:not([disabled])') ?? close).focus();
	}

	function closePanel() {
		backdrop.hidden = true;
		document.removeEventListener('keydown', onKeydown);
		trigger.focus();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closePanel();
			return;
		}
		if (event.key !== 'Tab') return;
		const focusable = focusableElements();
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (!first || !last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	async function openPanel() {
		if (opening) return;
		if (available === null) {
			opening = true;
			trigger.disabled = true;
			trigger.setAttribute('aria-busy', 'true');
			try {
				available = await options.loadAvailable();
			} catch {
				options.onLoadError();
				return;
			} finally {
				opening = false;
				trigger.disabled = false;
				trigger.removeAttribute('aria-busy');
			}
		}
		const today = options.getToday();
		const displayed = options.getDisplayed();
		shown = { year: today.year, month: displayed?.month ?? today.month };
		render();
		backdrop.hidden = false;
		document.addEventListener('keydown', onKeydown);
		focusInitial();
	}

	function step(delta: number, focusTarget: HTMLButtonElement) {
		shown = shiftMonth(shown, delta);
		render();
		focusTarget.focus();
	}

	trigger.addEventListener('click', openPanel);
	prev.addEventListener('click', () => step(-1, prev));
	next.addEventListener('click', () => step(1, next));
	close.addEventListener('click', closePanel);
	backdrop.addEventListener('click', (event) => {
		if (event.target === backdrop) closePanel();
	});
	grid.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLButtonElement) || target.disabled || !target.dataset.day) return;
		const day = Number(target.dataset.day);
		closePanel();
		options.onSelect({ month: shown.month, day });
	});
}
