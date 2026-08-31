export interface Product {
    _id: string;
    name: string;
    price: number;
    costPrice: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductInput {
    name: string;
    price: number;
    costPrice?: number;
    quantity: number;
}

export interface Sale {
    _id: string;
    amount: number;
    note?: string;
    productId?: string | {
        _id: string;
        name: string;
        price: number;
        costPrice: number;
    };
    quantitySold?: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaleInput {
    amount: number;
    note?: string;
    productId?: string;
    quantitySold?: number;
}

export interface Expense {
    _id: string;
    amount: number;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: string;
    type: "sale" | "expense";
    amount: number;
    timestamp: Date;
    note?: string;
    description?: string;
    productName?: string;
    productId?: string;
    quantitySold?: number;
    profit?: number;
    unitPrice?: number;
}
