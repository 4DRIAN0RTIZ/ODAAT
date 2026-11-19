export const SITE_LINK = 'odaat.cuevaneander.tech';

export interface ReflectionTextInput {
	title: string;
	date_label: string;
	paragraphs: string[];
}

/** Plain-text version of a reflection, ready to paste into chats. */
export function formatReflectionText({ title, date_label, paragraphs }: ReflectionTextInput): string {
	const header = [title, date_label].map((s) => s.trim()).filter(Boolean).join('\n');
	const body = paragraphs.map((p) => p.trim()).filter(Boolean);
	return [header, ...body, SITE_LINK].filter(Boolean).join('\n\n');
}
