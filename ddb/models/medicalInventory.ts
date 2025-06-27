import { queryItems, updateItem } from "../index";
import { MedicalInventoryProps } from "./types";

export const MEDICAL_INVENTORY_PK = "MedicalInventory_PK";
export const VENDOR_DETAILS_PK = "Vendor_PK";

export const getItems = async (params?: {
    values: Record<string, any>;
    names?: Record<string, any>;
    filterExpression?: string;
    sortKeyExpression?: string;
}) => {
    console.log("models.medicalInventory fetching items with params:", params)
    return queryItems<MedicalInventoryProps>({
        pk: MEDICAL_INVENTORY_PK,
        values: {},
        ...(params || {})
    })
}

export const updateInventory = async (id: number, data: Partial<Omit<MedicalInventoryProps, "id" | "createdAt" | "updatedAt">>, incStock?: { qty: number; }) => {
    return updateItem({ id, whereClause: {}, updates: data, pk: MEDICAL_INVENTORY_PK, incStock })
}
