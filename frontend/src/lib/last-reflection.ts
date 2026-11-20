import type { Reflection } from './api';

export interface KeyValueStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export const LAST_REFLECTION_KEY = 'odaat:last-reflection:v1';

function defaultStorage(): KeyValueStorage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		// Accessing localStorage can throw (blocked site data, sandboxed frames).
		return null;
	}
}

const isInt = (value: unknown, min: number, max: number): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value !== '';

/** Strict shape check; returns a clean copy (unknown fields dropped) or null. */
function parseReflection(value: unknown): Reflection | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
	const v = value as Record<string, unknown>;
	if (!isInt(v.month, 1, 12) || !isInt(v.day, 1, 31)) return null;
	if (!isNonEmptyString(v.title) || !isNonEmptyString(v.date_label)) return null;
	if (!Array.isArray(v.paragraphs) || v.paragraphs.length === 0) return null;
	if (!v.paragraphs.every((p) => typeof p === 'string')) return null;
	if (typeof v.text !== 'string' || typeof v.source_url !== 'string') return null;
	return {
		month: v.month,
		day: v.day,
		date_label: v.date_label,
		title: v.title,
		paragraphs: [...(v.paragraphs as string[])],
		text: v.text,
		source_url: v.source_url,
	};
}

/** Persists the reflection currently displayed. Returns false when it could not be stored. */
export function saveLastReflection(reflection: Reflection, storage: KeyValueStorage | null = defaultStorage()): boolean {
	if (!storage) return false;
	try {
		storage.setItem(LAST_REFLECTION_KEY, JSON.stringify(reflection));
		return true;
	} catch {
		return false;
	}
}

/** Last stored reflection, or null when absent, unreadable or not the expected shape. */
export function loadLastReflection(storage: KeyValueStorage | null = defaultStorage()): Reflection | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(LAST_REFLECTION_KEY);
		return raw === null ? null : parseReflection(JSON.parse(raw));
	} catch {
		return null;
	}
}
