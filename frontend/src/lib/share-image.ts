import type { Reflection } from './api';

export type MeasureFn = (text: string, fontSize: number) => number;

export const IMAGE_WIDTH = 1080;
export const IMAGE_MIN_HEIGHT = 1350;
const PADDING_X = 96;
const HEADER_HEIGHT = 190;
const FOOTER_HEIGHT = 170;
const TITLE_FONT = 62;
const TITLE_LINE_HEIGHT = 76;
const DATE_BLOCK = 90;
const PARAGRAPH_GAP = 0.6; // fraction of the body line height
const BODY_LINE_RATIO = 1.55;

export interface LayoutInput {
	title: string;
	paragraphs: string[];
	measure: MeasureFn;
	width?: number;
	minHeight?: number;
	maxFont?: number;
	minFont?: number;
}

export interface Layout {
	width: number;
	height: number;
	paddingX: number;
	fontSize: number;
	lineHeight: number;
	paragraphGap: number;
	titleFont: number;
	titleLineHeight: number;
	titleLines: string[];
	paragraphLines: string[][];
	titleY: number;
	dateY: number;
	bodyY: number;
	footerY: number;
}

/** Greedy word wrap; words longer than a line are hard-split. */
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: MeasureFn): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = '';

	const pushLong = (word: string) => {
		let chunk = '';
		for (const char of word) {
			if (chunk && measure(chunk + char, fontSize) > maxWidth) {
				lines.push(chunk);
				chunk = char;
			} else {
				chunk += char;
			}
		}
		current = chunk;
	};

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (measure(candidate, fontSize) <= maxWidth) {
			current = candidate;
			continue;
		}
		if (current) lines.push(current);
		current = '';
		if (measure(word, fontSize) <= maxWidth) current = word;
		else pushLong(word);
	}
	if (current) lines.push(current);
	return lines;
}

/**
 * Picks the largest body font that fits the fixed portrait canvas; when even
 * the smallest font overflows, the canvas grows taller instead of clipping.
 */
export function computeLayout(input: LayoutInput): Layout {
	const width = input.width ?? IMAGE_WIDTH;
	const minHeight = input.minHeight ?? IMAGE_MIN_HEIGHT;
	const maxFont = input.maxFont ?? 44;
	const minFont = input.minFont ?? 26;
	const textWidth = width - PADDING_X * 2;

	const titleLines = wrapText(input.title, textWidth, TITLE_FONT, input.measure);
	const titleBlock = titleLines.length * TITLE_LINE_HEIGHT;
	const bodyTop = HEADER_HEIGHT + titleBlock + DATE_BLOCK;

	const build = (fontSize: number) => {
		const lineHeight = Math.round(fontSize * BODY_LINE_RATIO);
		const paragraphGap = Math.round(lineHeight * PARAGRAPH_GAP);
		const paragraphLines = input.paragraphs.map((p) => wrapText(p, textWidth, fontSize, input.measure));
		const count = paragraphLines.reduce((sum, lines) => sum + lines.length, 0);
		const gaps = Math.max(0, paragraphLines.filter((l) => l.length).length - 1);
		const bodyHeight = count * lineHeight + gaps * paragraphGap;
		return { fontSize, lineHeight, paragraphGap, paragraphLines, required: bodyTop + bodyHeight + FOOTER_HEIGHT };
	};

	let chosen = build(minFont);
	for (let size = maxFont; size >= minFont; size -= 2) {
		const attempt = build(size);
		if (attempt.required <= minHeight) {
			chosen = attempt;
			break;
		}
	}

	const height = Math.max(minHeight, chosen.required);
	return {
		width,
		height,
		paddingX: PADDING_X,
		fontSize: chosen.fontSize,
		lineHeight: chosen.lineHeight,
		paragraphGap: chosen.paragraphGap,
		titleFont: TITLE_FONT,
		titleLineHeight: TITLE_LINE_HEIGHT,
		titleLines,
		paragraphLines: chosen.paragraphLines,
		titleY: HEADER_HEIGHT,
		dateY: HEADER_HEIGHT + titleBlock + 20,
		bodyY: bodyTop,
		footerY: height - FOOTER_HEIGHT / 2,
	};
}

interface ShareNavigator {
	canShare?: (data: { files: File[] }) => boolean;
	share?: (data: { files: File[]; title?: string }) => Promise<void>;
}

/** True when the browser supports sharing files (Web Share Level 2). */
export function canShareFiles(nav: ShareNavigator | undefined, file: File): boolean {
	if (!nav || typeof nav.canShare !== 'function' || typeof nav.share !== 'function') return false;
	try {
		return nav.canShare({ files: [file] });
	} catch {
		return false;
	}
}

export function slugify(value: string): string {
	const slug = value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'reflexion';
}

/** Renders the reflection to a PNG blob using only Canvas 2D. */
export async function renderReflectionPng(
	reflection: Pick<Reflection, 'title' | 'paragraphs' | 'date_label'>,
): Promise<Blob> {
	const probe = document.createElement('canvas').getContext('2d');
	if (!probe) throw new Error('Canvas 2D not supported');
	const serif = 'Georgia, "Times New Roman", serif';
	const measure: MeasureFn = (text, size) => {
		probe.font = `${size}px ${serif}`;
		return probe.measureText(text).width;
	};
	const layout = computeLayout({ title: reflection.title, paragraphs: reflection.paragraphs, measure });

	const canvas = document.createElement('canvas');
	canvas.width = layout.width;
	canvas.height = layout.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D not supported');

	ctx.fillStyle = '#f7f6f1';
	ctx.fillRect(0, 0, layout.width, layout.height);
	ctx.fillStyle = 'rgba(167, 243, 208, 0.35)';
	ctx.beginPath();
	ctx.arc(0, 0, 420, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
	ctx.beginPath();
	ctx.arc(layout.width, layout.height * 0.6, 380, 0, Math.PI * 2);
	ctx.fill();

	ctx.textBaseline = 'top';
	ctx.textAlign = 'center';
	ctx.fillStyle = '#047857';
	ctx.font = `600 34px ${serif}`;
	ctx.fillText('ODAAT', layout.width / 2, 80);

	ctx.fillStyle = '#292524';
	ctx.font = `${layout.titleFont}px ${serif}`;
	layout.titleLines.forEach((line, i) => {
		ctx.fillText(line, layout.width / 2, layout.titleY + i * layout.titleLineHeight);
	});

	ctx.fillStyle = '#78716c';
	ctx.font = `28px ${serif}`;
	ctx.fillText(reflection.date_label, layout.width / 2, layout.dateY);

	ctx.textAlign = 'left';
	ctx.fillStyle = '#57534e';
	ctx.font = `${layout.fontSize}px ${serif}`;
	let y = layout.bodyY;
	layout.paragraphLines.forEach((lines, index) => {
		if (!lines.length) return;
		if (index > 0) y += layout.paragraphGap;
		for (const line of lines) {
			ctx.fillText(line, layout.paddingX, y);
			y += layout.lineHeight;
		}
	});

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#78716c';
	ctx.font = `28px ${serif}`;
	ctx.fillText('odaat.cuevaneander.tech', layout.width / 2, layout.footerY);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
	});
}
