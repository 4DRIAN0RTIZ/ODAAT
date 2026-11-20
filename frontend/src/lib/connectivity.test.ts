import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideStartup, offlineBannerText, isOffline } from './connectivity.ts';

test('fetch success always shows the live reflection', () => {
	for (const online of [true, false]) {
		for (const hasCached of [true, false]) {
			assert.equal(decideStartup({ online, hasCached, outcome: 'success' }), 'live');
		}
	}
});

test('online and still pending keeps waiting (slow server wake-up is not offline)', () => {
	assert.equal(decideStartup({ online: true, hasCached: true, outcome: 'pending' }), 'wait');
	assert.equal(decideStartup({ online: true, hasCached: false, outcome: 'pending' }), 'wait');
});

test('browser offline with a cached reflection shows it without waiting', () => {
	assert.equal(decideStartup({ online: false, hasCached: true, outcome: 'pending' }), 'cached');
});

test('browser offline without cache shows the offline message', () => {
	assert.equal(decideStartup({ online: false, hasCached: false, outcome: 'pending' }), 'offline-message');
});

test('online but fetch failed: cached reflection if any', () => {
	assert.equal(decideStartup({ online: true, hasCached: true, outcome: 'failed' }), 'cached');
});

test('online but fetch failed without cache shows the server-error message', () => {
	assert.equal(decideStartup({ online: true, hasCached: false, outcome: 'failed' }), 'server-error-message');
});

test('offline and fetch failed without cache shows the offline message', () => {
	assert.equal(decideStartup({ online: false, hasCached: false, outcome: 'failed' }), 'offline-message');
});

test('banner text mentions the saved reflection date', () => {
	assert.equal(
		offlineBannerText('14 de marzo'),
		'Sin conexión · mostrando la última reflexión guardada (14 de marzo)',
	);
});

test('banner text omits the parenthesis when the label is empty', () => {
	assert.equal(offlineBannerText(''), 'Sin conexión · mostrando la última reflexión guardada');
});

test('isOffline is true only when onLine is explicitly false', () => {
	assert.equal(isOffline({ onLine: false }), true);
	assert.equal(isOffline({ onLine: true }), false);
	assert.equal(isOffline({} as { onLine?: boolean }), false);
	assert.equal(isOffline(undefined), false);
});
