interface Reflection {
	month: string;
	day: string;
	date_label: string;
	title: string;
	paragraphs: string[];
	text: string;
	source_url: string;
}

const API_BASE_URL = 'http://127.0.0.1:8811';

export async function getTodaysReflection(): Promise<Reflection> {
	const response = await fetch(`${API_BASE_URL}/reflections/today`);
	if (!response.ok) {
		throw new Error(`Failed to fetch today's reflection: ${response.statusText}`);
	}
	const data = await response.json();

	return data;
}


