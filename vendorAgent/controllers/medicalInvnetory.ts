import type { Request, Response } from "express";
import * as inventory from "../../ddb/models/medicalInventory";


export const getItemPrice = async (id: number) => {
    try {
        const result = await inventory.getItems({
            sortKeyExpression: "#id = :id",
            names: {
                "#id": "id"
            },
            values: {
                ":id": id
            }
        })
        return result[0];
    } catch (err) {
        console.error(err);
        return;
    }
}
