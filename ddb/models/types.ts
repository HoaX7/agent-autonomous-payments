type DateProps = {
    createdAt: number;
    updatedAt: number;
}

export type WalletProps = {
    balance: number;
    budget: number;
    id: number;
} & DateProps;

export type MedicalInventoryProps = {
    id: number;
    name: string;
    inStock: number;
    price: number;
} & DateProps;

export type ActivityLogProps = {
    id: number;
    message: string;
    metadata?: Record<string, unknown>;
    event: "log" | "error" | "warn" | "completed" | "parsing";
    user?: "VENDOR_AGENT" | "RETAIL_AGENT" | "USER";
    trigger?: "self" | "VENDOR_AGENT" | "RETAIL_AGENT";
    status?: "finished" | "started" | "working" | "task-complete";
} & DateProps;

export type TransactionProps = {
    id: number;
    invoice?: Buffer; // invoice or receipt
    receipt?: Buffer;
    quotation?: Buffer;
    recipient: string;
    paymentMethod: "paypal";
    paymentStatus: "PENDING" | "SENT" | "COMPLETED" | "CANCELLED" | "FAILED" | "QUOTED";
    paymentId?: string;
    type: "pdf";
    metadata?: Record<string, any>;
} & DateProps;

export type VendorDetailProps = {
    id: number;
    name: "Vendor Agent";
    url: string;
    email: string;
} & DateProps;
