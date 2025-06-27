import requester from "./requester";

export const getInventory = async () => {
    return requester({
        url: "external/inventory",
        method: "GET",
    })
}

export const getActivityLogs = async (from?: number) => {
    return requester({
        url: "external/activityLogs",
        method: "GET",
        data: { from }
    })
}

export const simulateLowInventory = async () => {
    return requester({
        url: "external/simulate",
        method: "POST",
        data: { low: true }
    })
}
