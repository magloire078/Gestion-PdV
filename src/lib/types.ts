export interface Client {
  id: string;
  companyId: string;
  name: string;
  email?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  amount: number;
  status: 'Payée' | 'En attente' | 'En retard';
  issueDate: string;
  dueDate: string;
}

export interface Expense {
  id: string;
  companyId: string;
  description: string;
  category: 'Marketing' | 'Logiciels' | 'Fournitures de bureau' | 'Déplacement' | 'Autre';
  amount: number;
  date: string;
  receiptUrl?: string;
}

export type UserRole = 'owner' | 'employee' | 'superadmin';

export interface UserProfile {
  id: string; // Document ID (usually same as UID)
  uid?: string; // Legacy/Alias UID
  email: string;
  displayName?: string;
  companyId: string; // Only empty for superadmins potentially
  assignedPosId?: string; // Point of Sale assigned to this user
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  price: number;
  category: string;
  stock: number; // Global stock
  stockByPos?: Record<string, number>; // Local stock per POS if stockType === 'per-pos'
  minStock: number; // Low stock alert threshold
  barcode?: string;
  imageUrl?: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: 'Achat' | 'Vente' | 'Retour' | 'Ajustement' | 'Perte';
  date: string;
}

export interface Sale {
  id: string;
  companyId: string;
  posId?: string;
  cashierId?: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  timestamp: number;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  subscriptionStatus: 'trial' | 'active' | 'inactive';
  subscriptionEndDate: string;
  stockType?: 'global' | 'per-pos'; // Stock management preference
  createdAt: string;
  address?: string;
  phone?: string;
  contactEmail?: string;
  taxId?: string;
  logoUrl?: string;
}

export interface PointOfSale {
  id: string;
  companyId: string;
  name: string;
  location?: string;
  createdAt: string;
}
