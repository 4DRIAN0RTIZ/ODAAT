import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLastReflection, saveLastReflection, LAST_REFLECTION_KEY, type KeyValueStorage } from './last-reflection.ts';
import type { Reflection } from './api.ts';

const reflection: Reflection = {
	month: 3,
	day: 14,
	date_label: '14 de marzo',
	title: 'Un día a la vez',
	paragraphs: ['Primero.', 'Segundo.'],
	text: 'Primero. Segundo.',
	source_url: 'https://odaat.cuevaneander.tech',
};

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
	const data = { ...initial };
	return {
		data,
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => {
			data[key] = value;
		},
	};
}

const throwingStorage: KeyValueStorage = {
	getItem: () => {
		throw new Error('denied');
	},
	setItem: () => {
		throw new Error('quota');
	},
};

test('key is versioned', () => {
	assert.match(LAST_REFLECTION_KEY, /:v\d+$/);
});

test('save then load round-trips a reflection', () => {
	const storage = memoryStorage();
	assert.equal(saveLastReflection(reflection, storage), true);
	assert.deepEqual(loadLastReflection(storage), reflection);
});

test('load returns null when nothing is stored', () => {
	assert.equal(loadLastReflection(memoryStorage()), null);
});

test('load returns null for corrupted JSON', () => {
	assert.equal(loadLastReflection(memoryStorage({ [LAST_REFLECTION_KEY]: '{nope' })), null);
});

test('load returns null for wrong shapes', () => {
	const bad: unknown[] = [
		null,
		'text',
		[],
		{ ...reflection, month: '3' },
		{ ...reflection, month: 13 },
		{ ...reflection, day: 0 },
		{ ...reflection, day: 1.5 },
		{ ...reflection, title: 5 },
		{ ...reflection, title: '' },
		{ ...reflection, date_label: undefined },
		{ ...reflection, paragraphs: 'x' },
		{ ...reflection, paragraphs: [1] },
		{ ...reflection, paragraphs: [] },
		{ ...reflection, text: null },
		{ ...reflection, source_url: 1 },
	];
	for (const value of bad) {
		const storage = memoryStorage({ [LAST_REFLECTION_KEY]: JSON.stringify(value) });
		assert.equal(loadLastReflection(storage), null, JSON.stringify(value));
	}
});

test('load drops unknown extra fields', () => {
	const storage = memoryStorage({ [LAST_REFLECTION_KEY]: JSON.stringify({ ...reflection, extra: 1 }) });
	assert.deepEqual(loadLastReflection(storage), reflection);
});

test('storage errors never throw', () => {
	assert.equal(saveLastReflection(reflection, throwingStorage), false);
	assert.equal(loadLastReflection(throwingStorage), null);
});

test('missing storage (undefined) never throws', () => {
	assert.equal(saveLastReflection(reflection, null), false);
	assert.equal(loadLastReflection(null), null);
});
