import { DataService } from './data-service';

export class SyncEngine {
    private static intervalId: NodeJS.Timeout | null = null;

    static start(intervalMs: number = 30000) {
        if (this.intervalId) return;

        if (typeof window === 'undefined') return;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('App is online. Starting sync...');
            DataService.syncPendingSales();
        });

        // Initial sync check
        if (navigator.onLine) {
            DataService.syncPendingSales();
        }

        // Periodic sync
        this.intervalId = setInterval(() => {
            if (navigator.onLine) {
                DataService.syncPendingSales();
            }
        }, intervalMs);
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
