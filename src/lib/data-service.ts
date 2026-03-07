import { db, Product, type Sale } from './db';
import {
    collection,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    Timestamp,
    getFirestore
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export class DataService {
    public static isSyncing = false;

    private static getFirestoreInstance() {
        const { firestore } = initializeFirebase();
        return firestore;
    }

    static async getProducts(companyId: string): Promise<Product[]> {
        // Always try to fetch from network if online
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

                // Also trigger a background sync for anything not synced
                this.syncPendingProducts(companyId).catch(console.error);

                return products;
            } catch (error) {
                console.error('Error fetching from Firebase, falling back to local:', error);
            }
        }
        return db.products.where('companyId').equals(companyId).toArray();
    }

    static async saveProduct(productData: Omit<Product, 'id' | 'synced'>): Promise<string> {
        if (!productData.companyId) {
            throw new Error('Une ID d\'entreprise est requise pour enregistrer un produit.');
        }

        const firestore = this.getFirestoreInstance();
        const productsCol = collection(firestore, 'products');
        const id = doc(productsCol).id;

        const product: Product = {
            ...productData,
            id,
            synced: 0
        };

        // Save locally first
        await db.products.add(product);

        // Try to sync immediately if online
        if (typeof window !== 'undefined' && navigator.onLine) {
            this.syncPendingProducts(product.companyId).catch(err => {
                console.error('Initial sync failed for product:', id, err);
            });
        }

        return id;
    }

    static async syncPendingProducts(companyId: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try {
            const pendingProducts = await db.products
                .where('synced').equals(0)
                .and(p => p.companyId === companyId)
                .toArray();

            if (pendingProducts.length > 0) {
                const firestore = this.getFirestoreInstance();
                const productsCol = collection(firestore, 'products');

                for (const product of pendingProducts) {
                    try {
                        const { id, synced, ...productToSync } = product;

                        if (id) {
                            const docRef = doc(productsCol, id);
                            await setDoc(docRef, {
                                ...productToSync,
                                synced: 1
                            });

                            await db.products.update(id, { synced: 1 });
                        }
                    } catch (error) {
                        console.error('Failed to sync product:', product.id, error);
                    }
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    static async saveSale(saleData: Omit<Sale, 'id' | 'synced'>): Promise<void> {
        const firestore = this.getFirestoreInstance();
        const salesCol = collection(firestore, 'sales');
        const id = doc(salesCol).id;

        const sale: Sale = {
            ...saleData,
            id,
            synced: 0,
            status: (saleData as any).status || 'completed'
        };

        // Deduct stock for each item
        for (const item of sale.items) {
            const product = await db.products.get(item.productId);
            if (product) {
                if (sale.posId && product.stockByPos && product.stockByPos[sale.posId] !== undefined) {
                    product.stockByPos[sale.posId] -= item.quantity;
                } else {
                    product.stock -= item.quantity;
                }
                product.synced = 0;
                await db.products.put(product);
            }
        }

        // Save locally first
        await db.sales.add(sale);

        if (typeof window !== 'undefined' && navigator.onLine) {
            await this.syncPendingSales(sale.companyId);
            await this.syncPendingProducts(sale.companyId); // Sync stock changes
        }
    }

    static async refundSale(saleId: string, companyId: string): Promise<void> {
        const sale = await db.sales.get(saleId);
        if (!sale || sale.companyId !== companyId) throw new Error("Sale not found or unauthorized");
        if ((sale as any).status === 'refunded') throw new Error("Sale is already refunded");

        // Mark as refunded
        (sale as any).status = 'refunded';
        sale.synced = 0;

        // Restore stock
        for (const item of sale.items) {
            const product = await db.products.get(item.productId);
            if (product) {
                if (sale.posId && product.stockByPos && product.stockByPos[sale.posId] !== undefined) {
                    product.stockByPos[sale.posId] += item.quantity;
                } else {
                    product.stock += item.quantity;
                }
                product.synced = 0;
                await db.products.put(product);
            }
        }

        await db.sales.put(sale);

        if (typeof window !== 'undefined' && navigator.onLine) {
            await this.syncPendingSales(companyId);
            await this.syncPendingProducts(companyId); // Sync stock changes
        }
    }

    static async syncPendingSales(companyId: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try {
            const pendingSales = await db.sales
                .where('synced').equals(0)
                .and(s => s.companyId === companyId)
                .toArray();

            if (pendingSales.length > 0) {
                const firestore = this.getFirestoreInstance();
                const salesCol = collection(firestore, 'sales');

                for (const sale of pendingSales) {
                    try {
                        const { id, ...saleToSync } = sale;

                        // Use setDoc to maintain the same ID between Dexie and Firestore
                        if (id) {
                            const docRef = doc(salesCol, id);
                            await setDoc(docRef, {
                                ...saleToSync,
                                timestamp: Timestamp.fromMillis(sale.timestamp),
                                synced: 1
                            });

                            // Mark as synced locally
                            await db.sales.update(id, { synced: 1 });
                        }
                    } catch (error) {
                        console.error('Failed to sync sale:', sale.id, error);
                    }
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    static async updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
        // Update locally
        await db.products.update(productId, {
            ...productData,
            synced: 0
        });

        // Try to sync
        if (typeof window !== 'undefined' && navigator.onLine) {
            const firestore = this.getFirestoreInstance();
            const productRef = doc(firestore, 'products', productId);
            try {
                await updateDoc(productRef, {
                    ...productData,
                    synced: 1
                });
                await db.products.update(productId, { synced: 1 });
            } catch (error) {
                console.error('Failed to sync product update:', error);
            }
        }
    }

    static async deleteProduct(productId: string): Promise<void> {
        // Delete locally
        await db.products.delete(productId);

        // Delete from Firestore
        if (typeof window !== 'undefined' && navigator.onLine) {
            const firestore = this.getFirestoreInstance();
            const productRef = doc(firestore, 'products', productId);
            try {
                await deleteDoc(productRef);
            } catch (error) {
                console.error('Failed to delete product from Firestore:', error);
            }
        }
    }

    // --- POS Administration ---
    static async getPointsOfSale(companyId: string) {
        if (typeof window === 'undefined') return [];
        const firestore = this.getFirestoreInstance();
        const posCol = collection(firestore, 'pointsOfSale');
        const q = query(posCol, where('companyId', '==', companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async createPointOfSale(posData: any): Promise<string> {
        const firestore = this.getFirestoreInstance();
        const posCol = collection(firestore, 'pointsOfSale');
        const docRef = await addDoc(posCol, posData);
        return docRef.id;
    }

    static async updatePointOfSale(posId: string, posData: any): Promise<void> {
        const firestore = this.getFirestoreInstance();
        const posRef = doc(firestore, 'pointsOfSale', posId);
        await updateDoc(posRef, posData);
    }

    static async deletePointOfSale(posId: string): Promise<void> {
        const firestore = this.getFirestoreInstance();
        const posRef = doc(firestore, 'pointsOfSale', posId);
        await deleteDoc(posRef);
    }
}
