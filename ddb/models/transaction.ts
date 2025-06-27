import { queryItems, putItem, getItem, updateItem } from "../index";
import { TransactionProps } from "./types";

export const TRANSACTION_PK = "Transaction_PK"

export const create = async (data: Omit<TransactionProps, "id" | "createdAt" | "updatedAt">) => {
    const sk = await putItem(TRANSACTION_PK, data)
    return getItem(TRANSACTION_PK, sk);
}

export const getAll = async () => {
    return queryItems({ pk: TRANSACTION_PK })
}

export const getById = async (params: {
    values: Record<string, any>;
    names?: Record<string, any>;
    filterExpression?: string;
    sortKeyExpression?: string;
}) => {
    return queryItems({ pk: TRANSACTION_PK, ...params })
}

export const update = async (id: number, data: Partial<TransactionProps>) => {
    return updateItem({ id, pk: TRANSACTION_PK, updates: data, whereClause: {} }) as Promise<TransactionProps | undefined>;
}
