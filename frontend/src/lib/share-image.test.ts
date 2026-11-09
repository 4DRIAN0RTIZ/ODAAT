import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, computeLayout, canShareFiles, slugify } from './share-image.ts';

// Fake measurer: every character is 0.5 * fontSize wide.
const measure = (text: string, fontSize: number) => text.length * fontSize * 0.5;

test('wrapText breaks on word boundaries within maxWidth', () => {
	const lines = wrapText('aaa bbb ccc ddd', 40, 20, measure); // 4 chars per line
	assert.deepEqual(lines, ['aaa', 'bbb', 'ccc', 'ddd']);
});

test('wrapText packs several words per line when they fit', () => {
	const lines = wrapText('aa bb cc', 100, 20, measure); // 10 chars per line
	assert.deepEqual(lines, ['aa bb cc']);
});

test('wrapText hard-splits a word longer than the line', () => {
	const lines = wrapText('abcdefghij', 50, 20, measure); // 5 chars per line
	assert.deepEqual(lines, ['abcde', 'fghij']);
});

test('wrapText returns no lines for empty text', () => {
	assert.deepEqual(wrapText('   ', 100, 20, measure), []);
});

const base = { width: 1080, minHeight: 1350, maxFont: 44, minFont: 26 };

test('computeLayout keeps max font and minimum height for short bodies', () => {
	const layout = computeLayout({ ...base, title: 'Hola', paragraphs: ['Corto.'], measure });
	assert.equal(layout.fontSize, 44);
	assert.equal(layout.height, 1350);
});

test('computeLayout shrinks font before growing the canvas', () => {
	const paragraphs = ['palabra '.repeat(150).trim()];
	const layout = computeLayout({ ...base, title: 'Titulo', paragraphs, measure });
	assert.ok(layout.fontSize < 44);
	assert.ok(layout.fontSize >= 26);
});

test('computeLayout grows height at min font for very long bodies', () => {
	const paragraphs = ['palabra '.repeat(2000).trim()];
	const layout = computeLayout({ ...base, title: 'Titulo', paragraphs, measure });
	assert.equal(layout.fontSize, 26);
	assert.ok(layout.height > 1350);
});

test('canShareFiles requires navigator.canShare accepting the files', () => {
	const file = {} as File;
	assert.equal(canShareFiles(undefined, file), false);
	assert.equal(canShareFiles({}, file), false);
	assert.equal(canShareFiles({ canShare: () => false, share: async () => {} }, file), false);
	assert.equal(canShareFiles({ canShare: () => true }, file), false); // no share()
	assert.equal(canShareFiles({ canShare: () => true, share: async () => {} }, file), true);
});

test('slugify makes a safe file name', () => {
	assert.equal(slugify('Un día a la vez: ¡hoy!'), 'un-dia-a-la-vez-hoy');
	assert.equal(slugify('???'), 'reflexion');
});
