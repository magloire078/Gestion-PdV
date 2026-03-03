import Dexie, { type Table } from 'dexie';

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    stock: number;
    synced: number; // 0 or 1
}

export interface Sale {
    id?: number;
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
        this.version(1).stores({
            products: 'id, name, category, synced',
            sales: '++id, timestamp, synced'
        });
    }
}

export const db = new POSDatabase();
