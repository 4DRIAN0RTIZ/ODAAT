import type { Reflection } from './api';

export function applyReflectionToDom(reflection: Reflection): void {
	const reflectionTitle = document.getElementById('reflection-title');
	const reflectionDate = document.getElementById('reflection-date');
	const reflectionParagraphs = document.getElementById('reflection-paragraphs');
	const reflectionSource = document.getElementById('reflection-source');
	const reflectionSourceText = document.getElementById('reflection-source-text');

	if (
		!reflectionTitle ||
		!reflectionDate ||
		!reflectionParagraphs ||
		!reflectionSource ||
		!reflectionSourceText ||
		!(reflectionSource instanceof HTMLAnchorElement)
	) {
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
	reflectionSource.href = reflection.source_url;
	reflectionSourceText.textContent = reflection.source_url;
}
