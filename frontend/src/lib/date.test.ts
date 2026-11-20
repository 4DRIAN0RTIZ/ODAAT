import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayInMexicoCity, tomorrowInMexicoCity } from './date.ts';

test('tomorrow: regular day', () => {
	// 2026-11-19 18:00 UTC = 12:00 in Mexico City
	assert.deepEqual(tomorrowInMexicoCity(new Date('2026-11-19T18:00:00Z')), { month: 11, day: 20 });
});

test('tomorrow: crosses month end', () => {
	assert.deepEqual(tomorrowInMexicoCity(new Date('2026-01-31T18:00:00Z')), { month: 2, day: 1 });
});

test('tomorrow: crosses year end', () => {
	assert.deepEqual(tomorrowInMexicoCity(new Date('2026-12-31T18:00:00Z')), { month: 1, day: 1 });
});

test('tomorrow: uses the Mexico date when UTC is already the next day', () => {
	// 2026-11-20 03:00 UTC = 2026-11-19 21:00 in Mexico City -> tomorrow is the 20th, not the 21st
	assert.deepEqual(tomorrowInMexicoCity(new Date('2026-11-20T03:00:00Z')), { month: 11, day: 20 });
});

test('tomorrow: uses the Mexico date when UTC is already the next year', () => {
	// 2027-01-01 02:00 UTC = 2026-12-31 20:00 in Mexico City -> tomorrow is Jan 1
	assert.deepEqual(tomorrowInMexicoCity(new Date('2027-01-01T02:00:00Z')), { month: 1, day: 1 });
});

test('tomorrow: Feb 28 in a leap year goes to Feb 29', () => {
	assert.deepEqual(tomorrowInMexicoCity(new Date('2028-02-28T18:00:00Z')), { month: 2, day: 29 });
});

test('tomorrow: Feb 28 in a non-leap year goes to Mar 1', () => {
	assert.deepEqual(tomorrowInMexicoCity(new Date('2027-02-28T18:00:00Z')), { month: 3, day: 1 });
});

test('tomorrow: Feb 29 goes to Mar 1', () => {
	assert.deepEqual(tomorrowInMexicoCity(new Date('2028-02-29T18:00:00Z')), { month: 3, day: 1 });
});

test('today: uses the Mexico City calendar, not UTC (UTC already next day)', () => {
	// 2026-11-20 03:00 UTC = 2026-11-19 21:00 in Mexico City
	assert.deepEqual(todayInMexicoCity(new Date('2026-11-20T03:00:00Z')), { year: 2026, month: 11, day: 19 });
});

test('today: crosses year boundary using Mexico City time', () => {
	// 2027-01-01 03:00 UTC = 2026-12-31 21:00 in Mexico City
	assert.deepEqual(todayInMexicoCity(new Date('2027-01-01T03:00:00Z')), { year: 2026, month: 12, day: 31 });
});
