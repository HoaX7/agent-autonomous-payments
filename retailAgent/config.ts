
import * as dotenv from "dotenv"
dotenv.config({ path: process.cwd() + "/retailAgent/.env" })

export const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET
}
