import type { Response } from "express";

export const jsonError = (res: Response, error: {
    code?: string;
    message?: string;
    status?: number;
}) => {
    res.status(error.status || 500)
        .json({
            success: false,
            message: error.message || "Internal Server Error",
            code: error.code || "INTERNAL_SERVER_ERROR",
            status: error.status
        })
}

export const jsonSuccess = (res: Response, data: any, statusCode = 200) => {
    res.status(statusCode)
        .json({
            success: true,
            data
        })
}
