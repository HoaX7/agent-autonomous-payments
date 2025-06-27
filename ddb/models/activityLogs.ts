import { queryItems, putItem, batchDelete, updateItem } from "../index";
import { ActivityLogProps } from "./types";

export const ACTIVITY_LOGS_PK = "ActivityLogs_PK";
export const getItems = async (from?: number) => {
    const queryObj: any = {
        pk: ACTIVITY_LOGS_PK
    }
    if (from && !isNaN(from)) {
        queryObj.values = {
            ":from": from
        }
        queryObj.sortKeyExpression = "id > :from"
    }
    return queryItems<ActivityLogProps>(queryObj)
}

export const logActivity = async (log: Omit<ActivityLogProps, "id" | "createdAt" | "updatedAt">) => {
    return putItem(ACTIVITY_LOGS_PK, log)
}

export const deleteLogs = async () => {
    return batchDelete(ACTIVITY_LOGS_PK);
}

export const update = async (id: number, data: { status: ActivityLogProps["status"] }) => {
    return updateItem({ id, updates: data, pk: ACTIVITY_LOGS_PK, whereClause: {} })
}
