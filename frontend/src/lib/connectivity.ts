export type FetchOutcome = 'pending' | 'success' | 'failed';

export type StartupView = 'live' | 'cached' | 'offline-message' | 'server-error-message' | 'wait';

export interface StartupState {
	online: boolean;
	hasCached: boolean;
	outcome: FetchOutcome;
}

/**
 * What the startup screen should show. A pending fetch while the browser reports
 * online means the (free-tier) server is still waking up, so we keep waiting.
 */
export function decideStartup({ online, hasCached, outcome }: StartupState): StartupView {
	if (outcome === 'success') return 'live';
	if (online && outcome === 'pending') return 'wait';
	if (hasCached) return 'cached';
	return online ? 'server-error-message' : 'offline-message';
}

export function offlineBannerText(dateLabel: string): string {
	const base = 'Sin conexión · mostrando la última reflexión guardada';
	return dateLabel ? `${base} (${dateLabel})` : base;
}

/** `navigator.onLine === false` is reliable; `true` only means "maybe online". */
export function isOffline(nav: { onLine?: boolean } | undefined): boolean {
	return nav?.onLine === false;
}
