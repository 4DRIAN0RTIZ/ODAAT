// ODAAT service worker. Hand-written, no build step: it ships as-is from public/.
// Bump the number in CACHE_NAME whenever the caching strategy changes; the
// activate step then deletes every older cache.
const CACHE_NAME = 'odaat-v1';
const SHELL_URL = '/';
const EXTRA_PRECACHE = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

/** Decides how a request is handled: 'ignore' | 'navigation' | 'immutable' | 'static'. */
function classifyRequest(request, origin) {
	if (request.method !== 'GET') return 'ignore';
	const url = new URL(request.url);
	// The reflections API lives on another origin and is deliberately never cached here.
	if (url.origin !== origin) return 'ignore';
	if (request.mode === 'navigate') return 'navigation';
	if (url.pathname.startsWith('/_astro/')) return 'immutable';
	return 'static';
}

/** Same-origin asset paths referenced by the shell HTML (query and hash stripped). */
function extractShellAssets(html) {
	const paths = new Set();
	for (const match of html.matchAll(/(?:src|href)=["'](\/[^"'#?\s]*)/g)) {
		const path = match[1];
		if (path !== '/' && !path.startsWith('//')) paths.add(path);
	}
	return [...paths];
}

/** Relative `./x.js` imports of a hashed JS file, resolved to absolute paths. */
function extractChunkImports(js, jsPath) {
	const dir = jsPath.slice(0, jsPath.lastIndexOf('/') + 1);
	const paths = new Set();
	for (const match of js.matchAll(/(?:from|import)\s*\(?\s*["'`]\.\/([^"'`]+\.js)["'`]/g)) {
		paths.add(dir + match[1]);
	}
	return [...paths];
}

async function precache() {
	const cache = await caches.open(CACHE_NAME);
	// The shell must be cached or the install fails and is retried later.
	const shell = await fetch(SHELL_URL, { cache: 'reload' });
	if (!shell.ok) throw new Error(`Shell responded ${shell.status}`);
	const html = await shell.clone().text();
	await cache.put(SHELL_URL, shell);

	// A first visit loads its assets before this worker controls the page, so
	// they are fetched again here to make the very next offline visit work.
	const assets = new Set([...extractShellAssets(html), ...EXTRA_PRECACHE]);
	const scripts = [...assets].filter((path) => path.endsWith('.js') && path.startsWith('/_astro/'));
	for (const script of scripts) {
		try {
			const response = await fetch(script);
			if (!response.ok) continue;
			await cache.put(script, response.clone());
			assets.delete(script);
			for (const chunk of extractChunkImports(await response.text(), script)) assets.add(chunk);
		} catch {
			// Best effort: a missing asset is fetched and cached at runtime later.
		}
	}
	await Promise.allSettled(
		[...assets].map(async (path) => {
			if (await cache.match(path)) return;
			const response = await fetch(path);
			if (response.ok) await cache.put(path, response);
		}),
	);
}

async function networkFirstNavigation(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		// Every ?fecha=... URL serves the same static shell, so one entry covers them all.
		if (response.ok && new URL(request.url).pathname === SHELL_URL) {
			await cache.put(SHELL_URL, response.clone());
		}
		return response;
	} catch (error) {
		const cached = await cache.match(SHELL_URL);
		if (cached) return cached;
		throw error;
	}
}

async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

async function staleWhileRevalidate(event) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(event.request);
	const refresh = fetch(event.request)
		.then(async (response) => {
			if (response.ok) await cache.put(event.request, response.clone());
			return response;
		})
		.catch((error) => {
			if (cached) return cached;
			throw error;
		});
	if (cached) {
		event.waitUntil(refresh.catch(() => {}));
		return cached;
	}
	return refresh;
}

self.addEventListener('install', (event) => {
	event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	switch (classifyRequest(event.request, self.location.origin)) {
		case 'navigation':
			event.respondWith(networkFirstNavigation(event.request));
			break;
		case 'immutable':
			event.respondWith(cacheFirst(event.request));
			break;
		case 'static':
			event.respondWith(staleWhileRevalidate(event));
			break;
		default:
			// Not handled: the browser performs its default network request.
			break;
	}
});
