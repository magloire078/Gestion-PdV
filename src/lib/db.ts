import Dexie, { type EntityTable } from 'dexie';

export interface Product {
    id: string;
    companyId: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    barcode?: string;
    stock: number;
    stockByPos?: Record<string, number>;
    minStock?: number;
    synced: number; // 0 or 1
}

export interface Sale {
    id: string;
    companyId: string;
    posId?: string; // Point of Sale where the sale occurred
    cashierId?: string; // User who made the sale
    items: {
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    timestamp: number;
    status: 'completed' | 'refunded';
    synced: number; // 0 or 1
}

export interface StockMovement {
    id: string;
    companyId: string;
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    date: number;
    reason?: string;
    synced: number; // 0 or 1
}

export const db = new Dexie('POSDatabase') as Dexie & {
    products: EntityTable<Product, 'id'>;
    sales: EntityTable<Sale, 'id'>;
    stockMovements: EntityTable<StockMovement, 'id'>;
};

db.version(6).stores({
    products: 'id, companyId, name, category, barcode, synced',
    sales: 'id, companyId, posId, cashierId, timestamp, status, synced',
    stockMovements: 'id, companyId, productId, type, date, synced'
});
