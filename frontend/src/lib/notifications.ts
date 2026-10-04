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
}

export const notifications = new NotificationService();
