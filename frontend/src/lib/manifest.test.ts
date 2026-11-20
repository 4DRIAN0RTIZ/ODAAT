import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publicDir = new URL('../../public/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', publicDir), 'utf8'));

function pngSize(path: string): { width: number; height: number } {
	const buffer = readFileSync(new URL(path.replace(/^\//, ''), publicDir));
	assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG', `${path} is not a PNG`);
	return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('manifest has the required installability fields', () => {
	assert.equal(manifest.name, 'ODAAT');
	assert.ok(manifest.short_name && manifest.short_name.length <= 12);
	assert.ok(manifest.description);
	assert.equal(manifest.lang, 'es');
	assert.equal(manifest.start_url, '/');
	assert.equal(manifest.scope, '/');
	assert.equal(manifest.display, 'standalone');
	assert.equal(manifest.theme_color, '#f7f6f1');
	assert.equal(manifest.background_color, '#f7f6f1');
});

test('manifest icons exist with the declared sizes', () => {
	assert.ok(Array.isArray(manifest.icons));
	for (const icon of manifest.icons) {
		assert.equal(icon.type, 'image/png');
		const [w, h] = icon.sizes.split('x').map(Number);
		assert.deepEqual(pngSize(icon.src), { width: w, height: h }, icon.src);
	}
});

test('manifest declares 192, 512 and a maskable 512 icon', () => {
	const find = (sizes: string, purpose: string) =>
		manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === sizes && (i.purpose ?? 'any') === purpose);
	assert.ok(find('192x192', 'any'));
	assert.ok(find('512x512', 'any'));
	assert.ok(find('512x512', 'maskable'));
});

test('apple touch icon exists at 180x180', () => {
	assert.deepEqual(pngSize('/icons/apple-touch-icon.png'), { width: 180, height: 180 });
});
