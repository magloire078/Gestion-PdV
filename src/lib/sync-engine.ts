import { DataService } from './data-service';

export class SyncEngine {
    private static intervalId: NodeJS.Timeout | null = null;
    private static onlineListener: (() => void) | null = null;

    static start(companyId: string, intervalMs: number = 30000) {
        if (this.intervalId) return;

        if (typeof window === 'undefined') return;

        const syncAll = () => {
            DataService.syncPendingProducts(companyId);
            DataService.syncPendingSales(companyId);
        };

        // Listen for online/offline events
        this.onlineListener = () => {
            console.log('App is online. Starting sync...');
            syncAll();
        };
        window.addEventListener('online', this.onlineListener);

        // Initial sync check
        if (navigator.onLine) {
            syncAll();
        }

        // Periodic sync
        this.intervalId = setInterval(() => {
            if (navigator.onLine) {
                syncAll();
            }
        }, intervalMs);
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.onlineListener && typeof window !== 'undefined') {
            window.removeEventListener('online', this.onlineListener);
            this.onlineListener = null;
        }
    }
}
