import { Request, Response } from "express";
import { getTransaction, updateTransaction } from "./transactions";
import { logActivity } from "./activityLogs";
import { config } from "../config";
import { InvoiceData, VendorAgent } from "../agent/agent";
import { updateInventory } from "../../ddb/models/medicalInventory";
import { sendToQueue } from "../../sqs/index";

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (body.event_type === "PAYMENT.PAYOUTS-ITEM.SUCCEEDED") {
      const transactionId = body.resource.sender_batch_id;
      if (!transactionId) {
        res.sendStatus(200);
        return;
      }
      const transaction = await getTransaction(+transactionId);
      if (!transaction) {
        res.sendStatus(200);
        return;
      }
      const amount = body.resource?.payout_item.amount?.value;
      // generate receipt
      await logActivity({
        event: "log",
        message: `Received payment of $${amount} from ${transaction.recipient} agent`,
      });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deliveryDate = tomorrow.toLocaleDateString();
      await logActivity({
        event: "completed",
        message: `Order confirmed and to be delivered by ${deliveryDate}`,
      }, 0)
      const agent = new VendorAgent();
      const pdfBuff = await agent.generatePdf(
        {
          costPerItem: transaction.metadata?.costPerItem || [],
          totalCost: transaction.metadata?.totalCost || 0,
        },
        "RECEIPT",
        transaction.recipient
      );
      const receiptUrl = `[Download receipt](${config.HOST_URL}/transactions/${transaction.id}?q=receipt)`;
      const promises: any[] = [
        logActivity({
          event: "completed",
          message: `Sending order receipt to ${transaction.recipient} agent. ${receiptUrl}`,
          status: "finished"
        }, 0),
      ];
      if (process.env.QUEUE_URL) {
        promises.push(
          sendToQueue(process.env.QUEUE_URL, { receiptUrl, transactionId, deliveryDate })
        );
      } else {
        logActivity({
          event: "warn",
          message:
            "Unable to trigger SQS, receipt cannot be sent to retail agent",
        });
      }
      await Promise.all(promises);
    //   await Promise.all(
    //     transaction.metadata?.costPerItem?.map(async (item: InvoiceData) => {
    //       return updateInventory(item.id, {}, { qty: 100 });
    //     })
    //   ).catch((err) => {
    //     throw err;
    //   });
      await updateTransaction(+transactionId, {
          paymentStatus: "COMPLETED",
          receipt: Buffer.from(pdfBuff),
        });
    }
    res.sendStatus(200);
    return;
  } catch (err) {
    console.error("confirmPayment: ERROR", err);
    logActivity({
      event: "error",
      message: "Payment confirmation webhook failed",
    });
    res.sendStatus(200);
    return;
  }
};
