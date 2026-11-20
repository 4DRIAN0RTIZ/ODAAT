import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getReflectionByMonthDay, ReflectionNotFoundError } from './api.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

function mockFetch(response: Partial<Response>) {
	const calls: string[] = [];
	globalThis.fetch = (async (url: string) => {
		calls.push(url);
		return response as Response;
	}) as typeof fetch;
	return calls;
}

test('requests /reflections/{MM}-{DD} with zero padding', async () => {
	const body = { title: 'T' };
	const calls = mockFetch({ ok: true, json: async () => body });
	const result = await getReflectionByMonthDay(2, 9);
	assert.deepEqual(calls, ['https://odaat.onrender.com/reflections/02-09']);
	assert.equal(result, body);
});

test('keeps Feb 29 as 02-29', async () => {
	const calls = mockFetch({ ok: true, json: async () => ({}) });
	await getReflectionByMonthDay(2, 29);
	assert.match(calls[0], /\/reflections\/02-29$/);
});

test('throws ReflectionNotFoundError on 404', async () => {
	mockFetch({ ok: false, status: 404, statusText: 'Not Found' });
	await assert.rejects(getReflectionByMonthDay(10, 21), ReflectionNotFoundError);
});

test('throws a generic error on other failures', async () => {
	mockFetch({ ok: false, status: 500, statusText: 'Server Error' });
	await assert.rejects(getReflectionByMonthDay(1, 1), (e: Error) => {
		assert.ok(!(e instanceof ReflectionNotFoundError));
		assert.match(e.message, /Server Error/);
		return true;
	});
});
