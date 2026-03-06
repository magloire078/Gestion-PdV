import { db, Product, Sale } from './db';
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp,
    getFirestore
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export class DataService {
    private static getFirestoreInstance() {
        const { firestore } = initializeFirebase();
        return firestore;
    }

    static async getProducts(companyId: string): Promise<Product[]> {
        if (typeof window !== 'undefined' && navigator.onLine) {
            try {
                const firestore = this.getFirestoreInstance();
                const productsCol = collection(firestore, 'products');
                const q = query(productsCol, where('companyId', '==', companyId));
                const snapshot = await getDocs(q);
                const products = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    synced: 1
                })) as Product[];

                // Update local DB
                await db.products.bulkPut(products);
                return products;
            } catch (error) {
                console.error('Error fetching from Firebase, falling back to local:', error);
            }
        }
        return db.products.where('companyId').equals(companyId).toArray();
    }

    static async saveSale(saleData: Omit<Sale, 'id' | 'synced'>): Promise<void> {
        const sale: Sale = {
            ...saleData,
            synced: 0
        };

        // Save locally first
        await db.sales.add(sale);

        if (typeof window !== 'undefined' && navigator.onLine) {
            await this.syncPendingSales(sale.companyId);
        }
    }

    static async syncPendingSales(companyId: string): Promise<void> {
        const pendingSales = await db.sales
            .where('synced').equals(0)
            .and(s => s.companyId === companyId)
            .toArray();

        if (pendingSales.length === 0) return;

        const firestore = this.getFirestoreInstance();
        const salesCol = collection(firestore, 'sales');

        for (const sale of pendingSales) {
            try {
                const { id, ...saleToSync } = sale;
                await addDoc(salesCol, {
                    ...saleToSync,
                    timestamp: Timestamp.fromMillis(sale.timestamp),
                    synced: 1
                });

                // Mark as synced locally
                if (id) {
                    await db.sales.update(id, { synced: 1 });
                }
            } catch (error) {
                console.error('Failed to sync sale:', sale.id, error);
            }
        }
    }
}
