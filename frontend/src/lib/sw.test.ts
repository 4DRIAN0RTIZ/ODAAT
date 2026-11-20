import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// sw.js is a classic script served as-is from public/, so it is evaluated in a
// sandbox with a stubbed service-worker scope; its top-level functions are then
// reachable as sandbox globals.
function loadSw() {
	const listeners: Record<string, unknown> = {};
	const sandbox: Record<string, unknown> = {
		self: {
			addEventListener: (type: string, fn: unknown) => {
				listeners[type] = fn;
			},
			location: { origin: 'https://odaat.example' },
		},
		URL,
	};
	vm.createContext(sandbox);
	vm.runInContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), sandbox);
	// `const` declarations are not sandbox properties, so read them explicitly.
	sandbox.CACHE_NAME = vm.runInContext('CACHE_NAME', sandbox);
	// Arrays built inside the sandbox have another realm's prototype; copy them for deepEqual.
	for (const name of ['extractShellAssets', 'extractChunkImports']) {
		const fn = sandbox[name] as (...args: string[]) => string[];
		sandbox[name] = (...args: string[]) => Array.from(fn(...args));
	}
	return { sandbox, listeners } as {
		sandbox: {
			CACHE_NAME: string;
			classifyRequest: (r: { method: string; url: string; mode: string }, origin: string) => string;
			extractShellAssets: (html: string) => string[];
			extractChunkImports: (js: string, jsPath: string) => string[];
		};
		listeners: Record<string, unknown>;
	};
}

const origin = 'https://odaat.example';
const req = (url: string, over: Record<string, string> = {}) => ({ method: 'GET', mode: 'cors', url, ...over });

test('cache name is versioned and lifecycle listeners are registered', () => {
	const { sandbox, listeners } = loadSw();
	assert.match(sandbox.CACHE_NAME, /^odaat-v\d+$/);
	for (const type of ['install', 'activate', 'fetch']) assert.equal(typeof listeners[type], 'function', type);
});

test('non-GET and cross-origin requests are ignored', () => {
	const { sandbox } = loadSw();
	assert.equal(sandbox.classifyRequest(req(`${origin}/`, { method: 'POST' }), origin), 'ignore');
	assert.equal(sandbox.classifyRequest(req('https://odaat.onrender.com/reflections/today'), origin), 'ignore');
	assert.equal(sandbox.classifyRequest(req('https://odaat.onrender.com/health'), origin), 'ignore');
});

test('navigations are network-first', () => {
	const { sandbox } = loadSw();
	assert.equal(sandbox.classifyRequest(req(`${origin}/?fecha=03-14`, { mode: 'navigate' }), origin), 'navigation');
});

test('hashed /_astro assets are immutable', () => {
	const { sandbox } = loadSw();
	assert.equal(sandbox.classifyRequest(req(`${origin}/_astro/index.BTIC4vOW.css`), origin), 'immutable');
});

test('other same-origin assets are stale-while-revalidate', () => {
	const { sandbox } = loadSw();
	for (const path of ['/icons/icon-192.png', '/manifest.webmanifest', '/crystal-alert.min.js', '/favicon.ico']) {
		assert.equal(sandbox.classifyRequest(req(`${origin}${path}`), origin), 'static', path);
	}
});

test('extractShellAssets finds same-origin src/href paths only', () => {
	const { sandbox } = loadSw();
	const html = `<link rel="icon" href="/_astro/favicon.-0GqkboM.webp"><link rel="stylesheet" href="/crystal-alert.min.css">
		<script src="/crystal-alert.min.js"></script><link rel="canonical" href="https://odaat.example/">
		<script type="module" src="/_astro/a.js"></script><a href="/">home</a><a href="#x">x</a>
		<link rel="stylesheet" href="/_astro/index.css?v=1">`;
	assert.deepEqual(sandbox.extractShellAssets(html).sort(), [
		'/_astro/a.js',
		'/_astro/favicon.-0GqkboM.webp',
		'/_astro/index.css',
		'/crystal-alert.min.css',
		'/crystal-alert.min.js',
	]);
});

test('extractChunkImports resolves relative js imports against the importing file', () => {
	const { sandbox } = loadSw();
	const js = 'import{d as e}from"./notifications.Bs6AByWX.js";const x=()=>import(`./lazy.abc.js`);import"./side.js";';
	assert.deepEqual(sandbox.extractChunkImports(js, '/_astro/index.js').sort(), [
		'/_astro/lazy.abc.js',
		'/_astro/notifications.Bs6AByWX.js',
		'/_astro/side.js',
	]);
});
