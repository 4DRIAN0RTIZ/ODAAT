interface ToastOptions {
	title: string;
	text: string;
	icon: 'success' | 'error' | 'warning' | 'info';
	duration: number;
}

interface CrystalAlert {
	toast: (options: ToastOptions & { position: 'bottom-right' }) => void;
}

class NotificationService {
	toast(options: ToastOptions): void {
		const crystal = (window as Window & { Crystal?: CrystalAlert }).Crystal;
		crystal?.toast({
			...options,
			position: 'bottom-right',
		});
	}

	/** Shown when an action that needs the API is attempted without a connection. */
	offline(): void {
		this.toast({
			title: 'Sin conexión',
			text: 'Esta acción necesita internet. Aún puedes leer, copiar, descargar o compartir la reflexión actual.',
			icon: 'warning',
			duration: 4000,
		});
	}
}

export const notifications = new NotificationService();
