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
    minStock?: number;
    synced: number; // 0 or 1
}

export interface Sale {
    id?: number;
    companyId: string;
    items: {
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    timestamp: number;
    synced: number; // 0 or 1
}

export class POSDatabase extends Dexie {
    products!: Table<Product>;
    sales!: Table<Sale>;

    constructor() {
        super('POSDatabase');
        this.version(3).stores({
            products: 'id, companyId, name, category, barcode, synced',
            sales: '++id, companyId, timestamp, synced'
        });
    }
}

export const db = new POSDatabase();
