import type { Request, Response } from "express";
import { jsonError, jsonSuccess } from "../responses";
import * as model from "../../ddb/models/activityLogs";
import { ActivityLogProps } from "../../ddb/models/types";
import { wait } from "../utils";

export const fetchActivityLogs = async (req: Request, res: Response) => {
    try {
        const { from } = req.query;
        const result = await model.getItems(Number(from));
        jsonSuccess(res, result.sort((a, b) => a.createdAt >= b.createdAt ? -1 : 1))
    } catch (err: any) {
        jsonError(res, {
            message: err.message
        })
    }
    return;
}

const VENDOR_AGENT = "Pfifier Meds Manufacturing"

/**
 * This method is used by Agent to log activity
 */
export const logActivity = async (log: Omit<ActivityLogProps, "id" | "createdAt" | "updatedAt">, 
    delay = 2000) => {
    try {
        log.message = log.message.replace(/{{vendor}}/g, `${VENDOR_AGENT} agent`)
        console.log(log)
        const result = await model.logActivity({
            ...log,
            user: log.user || "RETAIL_AGENT",
        })
        // if (delay > 0) await wait(delay) // simulate delay
        return result;
    } catch (err) {
        console.error("controllers.logActivity: ERROR", err)
    }
    return;
}

export const deleteLogs = async () => {
    return model.deleteLogs();
}

export const updateActivityStatus = async (id: number, status: ActivityLogProps["status"]) => {
    // return model.update(id, { status });
}
