export interface Reflection {
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

export async function getRandomReflection(): Promise<Reflection> {
	const response = await fetch(`${API_BASE_URL}/reflections/random`);
	if (!response.ok) {
		throw new Error(`Failed to fetch random reflection: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}

export async function serverReady(onWaiting?: () => void): Promise<void> {
	const deadline = Date.now() + 90000;
	let notifiedWaiting = false;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
			if (response.ok) return;
		} catch (_) {

		}

		if (!notifiedWaiting) {
			notifiedWaiting = true;
			onWaiting?.();
		}

		await new Promise(resolve => setTimeout(resolve, 3000));
	}

	throw new Error('Server did not become ready within 90 seconds');
}
