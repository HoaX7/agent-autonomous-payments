type DateProps = {
    createdAt: number;
    updatedAt: number;
}

export type InventoryProps = {
    id: number;
    name: string;
    inStock: number;
    price: number;
} & DateProps;