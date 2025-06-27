import express from "express";
import serverless from "serverless-http";
import externalRoutes from "./routes/external";
import cors from "cors";
import { SqsEvent } from "./types";
import { restockInventory } from "./agent/agent";
import { logActivity } from "./controllers/activityLogs";

const app = express();
app.use(cors({ origin: "*" }));
app.get("/", (req, res) => {
  res.json({ message: "Retail agent" });
});
app.use("/external", externalRoutes);

export const handler = serverless(app);

export const sqsHandler = async (event: SqsEvent, ctx: any) => {
  try {
    const eventObj = event.Records[0];
    const body = JSON.parse(eventObj.body || "{}");
    console.log({ body, eventObj });
    console.dir(eventObj);
    if (body?.receiptUrl) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deliveryDate = new Date(tomorrow.toLocaleDateString());
      logActivity({
        event: "completed",
        message: `Received order confirmation and receipt from {{vendor}}. Delivery expected by ${
          body.deliveryDate || deliveryDate
        } ${body.receiptUrl || ""}`,
        trigger: "VENDOR_AGENT",
        status: "finished",
      });
    } else if (body?.restockInventory && body?.items && Array.isArray(body.items)) {
      await restockInventory(body.items || []);
    }
  } catch (err) {
    console.error("ERROR: ", err);
  }
  return { statusCode: 200 };
};

export default app;
