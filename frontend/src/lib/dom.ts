import type { Reflection } from './api';

export function applyReflectionToDom(reflection: Reflection): void {
	const reflectionTitle = document.getElementById('reflection-title');
	const reflectionDate = document.getElementById('reflection-date');
	const reflectionParagraphs = document.getElementById('reflection-paragraphs');

	if (!reflectionTitle || !reflectionDate || !reflectionParagraphs) {
		throw new Error('Reflection DOM nodes not found');
	}

	reflectionTitle.textContent = reflection.title;
	reflectionDate.textContent = reflection.date_label;
	reflectionParagraphs.replaceChildren();
	for (const paragraph of reflection.paragraphs) {
		const p = document.createElement('p');
		p.textContent = paragraph;
		reflectionParagraphs.appendChild(p);
	}
}
