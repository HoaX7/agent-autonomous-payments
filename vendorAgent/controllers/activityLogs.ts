import * as model from "../../ddb/models/activityLogs";
import { ActivityLogProps } from "../../ddb/models/types";
import { getLoggerContext } from "../clsHooked";
import { wait } from "../utils";

const VENDOR_AGENT = "Pfifier Meds Manufacturing"

/**
 * This method is used by Agent to log activity
 */
export const logActivity = async (log: Pick<ActivityLogProps, "metadata" | "message" | "event" | "status" | "trigger"> & {
    user?: ActivityLogProps["user"];
}, delay = 2000) => {
    try {
        log.message = log.message.replace(/{{recepient}}/g, `${getLoggerContext().recepient} agent`);
        log.message = log.message.replace(/{{vendor}}/g, `${VENDOR_AGENT} agent`);
        const result = await model.logActivity({
            ...log,
            user: log.user || "VENDOR_AGENT",
        })
        console.log(log)
        // if (delay > 0) await wait(delay) // delay
        return result;
    } catch (err) {
        console.error("controllers.logActivity: ERROR", err)
    }
    return;
}
