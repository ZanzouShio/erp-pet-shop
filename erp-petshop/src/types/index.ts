export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    barcode?: string;
    ean?: string;
    unit: 'UN' | 'KG' | 'L';
}

export interface CartItem extends Product {
    quantity: number;
    discount: number;
    subtotal: number;
}

export interface Sale {
    id: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod?: PaymentMethod;
    createdAt: Date;
    status: 'pending' | 'completed' | 'cancelled';
}

export type PaymentMethod = 'cash' | 'debit_card' | 'credit_card' | 'pix';

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    loyaltyPoints?: number;
}
