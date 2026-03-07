import Dexie, { type Table } from 'dexie';

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

export class POSDatabase extends Dexie {
    products!: Table<Product>;
    sales!: Table<Sale>;

    constructor() {
        super('POSDatabase');
        this.version(5).stores({
            products: 'id, companyId, name, category, barcode, synced',
            sales: 'id, companyId, posId, cashierId, timestamp, status, synced'
        });
    }
}

export const db = new POSDatabase();
