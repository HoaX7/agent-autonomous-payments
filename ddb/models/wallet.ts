import { getItem, updateItem } from "../index";
import { WalletProps } from "./types";

export const WALLET_PK = "Wallet_PK";

export const getWallet = async () => {
    return getItem<WalletProps>(WALLET_PK)
}

export const updateWallet = async (id: number, data: Omit<WalletProps, "id" | "createdAt" | "updatedAt">) => {
    return updateItem({ id, whereClause: {}, updates: data, pk: WALLET_PK })
}
