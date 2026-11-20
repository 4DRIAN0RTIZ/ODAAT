import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	availableDaysInMonth,
	buildMonthGrid,
	buildShareUrl,
	daysInMonth,
	fechaForUrl,
	parseFechaParam,
	shiftMonth,
} from './calendar.ts';

test('daysInMonth: February always has 29 days (data is year-agnostic)', () => {
	assert.equal(daysInMonth(2), 29);
});

test('daysInMonth: 30 and 31 day months', () => {
	assert.equal(daysInMonth(4), 30);
	assert.equal(daysInMonth(11), 30);
	assert.equal(daysInMonth(1), 31);
	assert.equal(daysInMonth(12), 31);
});

test('buildMonthGrid: Monday-first leading blanks (Nov 2026 starts on Sunday -> 6 blanks)', () => {
	const grid = buildMonthGrid(2026, 11);
	assert.deepEqual(grid.slice(0, 7), [null, null, null, null, null, null, 1]);
	assert.equal(grid.length, 6 + 30);
	assert.equal(grid.at(-1), 30);
});

test('buildMonthGrid: no blanks when the month starts on Monday (Jun 2026)', () => {
	const grid = buildMonthGrid(2026, 6);
	assert.equal(grid[0], 1);
	assert.equal(grid.length, 30);
});

test('buildMonthGrid: February shows 29 days even in a non-leap year', () => {
	const grid = buildMonthGrid(2026, 2);
	assert.equal(grid.filter((cell) => cell !== null).length, 29);
	assert.equal(grid.at(-1), 29);
});

test('shiftMonth: next within a year', () => {
	assert.deepEqual(shiftMonth({ year: 2026, month: 5 }, 1), { year: 2026, month: 6 });
});

test('shiftMonth: December -> January wraps the year forward', () => {
	assert.deepEqual(shiftMonth({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 });
});

test('shiftMonth: January -> December wraps the year back', () => {
	assert.deepEqual(shiftMonth({ year: 2026, month: 1 }, -1), { year: 2025, month: 12 });
});

test('availableDaysInMonth: only days of the requested month, missing days absent', () => {
	const reflections = [
		{ month: 10, day: 20 },
		{ month: 10, day: 22 },
		{ month: 11, day: 21 },
	];
	const available = availableDaysInMonth(reflections, 10);
	assert.deepEqual([...available].sort((a, b) => a - b), [20, 22]);
	assert.equal(available.has(21), false);
});

test('parseFechaParam: accepts valid MM-DD including 02-29', () => {
	assert.deepEqual(parseFechaParam('10-21'), { month: 10, day: 21 });
	assert.deepEqual(parseFechaParam('02-29'), { month: 2, day: 29 });
	assert.deepEqual(parseFechaParam('01-01'), { month: 1, day: 1 });
	assert.deepEqual(parseFechaParam('12-31'), { month: 12, day: 31 });
});

test('parseFechaParam: rejects null, empty and malformed values', () => {
	for (const value of [null, '', '1-1', '1021', '10/21', '10-21-2026', ' 10-21', '10-21 ', 'ab-cd', '2026-10-21']) {
		assert.equal(parseFechaParam(value), null, String(value));
	}
});

test('parseFechaParam: rejects impossible dates', () => {
	for (const value of ['02-30', '13-01', '00-10', '04-31', '01-00', '01-32']) {
		assert.equal(parseFechaParam(value), null, value);
	}
});

test('buildShareUrl: sets fecha=MM-DD with zero padding', () => {
	assert.equal(
		buildShareUrl('https://odaat.cuevaneander.tech/', { month: 2, day: 9 }),
		'https://odaat.cuevaneander.tech/?fecha=02-09',
	);
});

test('buildShareUrl: replaces an existing fecha and keeps other params and hash', () => {
	assert.equal(
		buildShareUrl('https://x.test/?a=1&fecha=01-01#top', { month: 10, day: 21 }),
		'https://x.test/?a=1&fecha=10-21#top',
	);
});

test('buildShareUrl: null removes fecha (bare URL)', () => {
	assert.equal(buildShareUrl('https://x.test/?fecha=10-21', null), 'https://x.test/');
	assert.equal(buildShareUrl('https://x.test/?a=1&fecha=10-21', null), 'https://x.test/?a=1');
});

test('fechaForUrl: today keeps the bare URL', () => {
	assert.equal(fechaForUrl({ month: 11, day: 19 }, { month: 11, day: 19 }), null);
});

test('fechaForUrl: another day is kept in the URL', () => {
	assert.deepEqual(fechaForUrl({ month: 11, day: 20 }, { month: 11, day: 19 }), { month: 11, day: 20 });
});
