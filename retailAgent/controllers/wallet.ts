import { getItem, updateItem } from "../../ddb";
import { WalletProps } from "../../ddb/models/types";

const Wallet_PK = "Wallet_PK";

export const getWalletDetails = async () => {
    return getItem<WalletProps>(Wallet_PK)
}

export const updateWallet = async (id: number, data: {
    balance: number;
    budget: number;
}) => {
    return updateItem({ id, updates: data, whereClause: {}, pk: Wallet_PK })
}
