import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReflectionText, SITE_LINK } from './reflection-text.ts';

test('formats title, date, paragraphs and site link', () => {
	const text = formatReflectionText({
		title: 'Un día a la vez',
		date_label: '19 de noviembre',
		paragraphs: ['Primero.', 'Segundo.'],
	});
	assert.equal(
		text,
		'Un día a la vez\n19 de noviembre\n\nPrimero.\n\nSegundo.\n\nodaat.cuevaneander.tech',
	);
});

test('skips empty parts and trims whitespace', () => {
	const text = formatReflectionText({ title: ' T ', date_label: '', paragraphs: [' a ', '', '  '] });
	assert.equal(text, `T\n\na\n\n${SITE_LINK}`);
});
