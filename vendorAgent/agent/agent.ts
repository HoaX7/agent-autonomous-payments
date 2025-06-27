import { logActivity } from "../controllers/activityLogs";
import { getItemPrice } from "../controllers/medicalInvnetory";
import { jsPDF } from "jspdf";
import {
  createTransaction,
  updateTransaction,
} from "../controllers/transactions";
import { config } from "../config";
import { toLocaleDateTime } from "../utils";

const vendor = "Pfifier Meds Manufacturing";

type InvoiceParams = {
  id: number;
  required: number;
  name: string;
};

export type InvoiceData = {
  id: number;
  name: string;
  cost: number;
  quantity: number;
  total: number;
};

export class VendorAgent {
  async getQuotation(items: InvoiceParams[], recipient: string) {
    const { totalCost, costPerItem } = await this._getQuotation(items);
    await logActivity({
      event: "log",
      message: `Generating and sending quotation to ${recipient} agent`,
    });
    const pdfBuf = await this.generatePdf(
      {
        costPerItem,
        totalCost,
      },
      "QUOTATION",
      recipient
    );
    const transaction: any = await createTransaction({
      quotation: Buffer.from(pdfBuf),
      paymentMethod: "paypal",
      paymentStatus: "QUOTED",
      type: "pdf",
      recipient,
      metadata: {
        costPerItem,
        totalCost,
      },
    });
    const quotationUrl = `[Download quotation](${config.HOST_URL}/transactions/${transaction?.id}?q=quotation)`;
    await logActivity({
        event: "completed",
        message: `Quotation generated ${quotationUrl}`
    })
    return {
      transactionId: transaction?.id,
      quotationUrl,
      totalCost,
      costPerItem
    };
  }
  async _getQuotation(items: InvoiceParams[]) {
    const itemsMeta = items.reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {} as { [key: number]: InvoiceParams });
    const result = await Promise.all(items.map((it) => getItemPrice(it.id)));
    // calculate cost for each item
    const costPerItem = result.filter(Boolean).map((item) => {
      if (!item) return;
      const total = item.price * itemsMeta[item.id].required;
      return {
        total,
        id: item.id,
        name: item.name,
        quantity: itemsMeta[item.id].required,
        cost: item.price,
      };
    }) as InvoiceData[];
    // calculate total price
    const totalCost = costPerItem.reduce((acc, r) => {
      acc = acc + (r?.total || 0);
      return acc;
    }, 0);
    return {
      totalCost,
      costPerItem,
    };
  }
  async getInvoice(
    items: InvoiceParams[],
    recipient: string,
    transactionId?: number
  ) {
    try {
      const { totalCost, costPerItem } = await this._getQuotation(items);
      // generate invoice
      await logActivity({
        event: "log",
        message: `Generating and sending invoice to ${recipient} agent`,
      });
      const pdfBuf = await this.generatePdf(
        {
          costPerItem,
          totalCost,
        },
        "INVOICE",
        recipient
      );
      let transaction, invoiceUrl;
      if (transactionId) {
        transaction = await updateTransaction(transactionId, {
          invoice: Buffer.from(pdfBuf),
          paymentStatus: "PENDING",
          metadata: {
            costPerItem,
            totalCost,
          },
        });
      } else {
        // Create transaction in ddb
        transaction = await createTransaction({
          invoice: Buffer.from(pdfBuf),
          paymentMethod: "paypal",
          paymentStatus: "PENDING",
          type: "pdf",
          recipient,
          metadata: {
            costPerItem,
            totalCost,
          },
        });
      }
      if (!transaction) {
        logActivity({
          event: "error",
          message: "Unable to create invoice transaction",
        });
      } else {
        invoiceUrl = `[Download invoice](${config.HOST_URL}/transactions/${transaction.id}?q=invoice)`;
        await logActivity({
            event: "completed",
            message: `Invoice generated ${invoiceUrl}`
        })
      }
      return {
        costPerItem,
        totalCost,
        transactionId: transaction?.id,
        invoiceUrl,
      };
    } catch (err) {
      console.error("agent.getInvoice: ERROR", err);
      logActivity({
        event: "error",
        message: "Failed to generate invoice for {{recepient}}",
      });
      return;
    }
  }
  async generatePdf(
    data: {
      costPerItem: InvoiceData[];
      totalCost: number;
    },
    type: "INVOICE" | "RECEIPT" | "QUOTATION",
    recipient: string
  ) {
    const { costPerItem, totalCost } = data;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text(type, 105, 20, { align: "center" });

    // Parties
    doc.setFontSize(12);
    doc.text(`Date: ${toLocaleDateTime()}`, 20, 35);
    doc.text(`Vendor: ${vendor} Agent`, 20, 42);
    doc.text(`Recipient: ${recipient} Agent`, 20, 49);

    // Table Headers
    const startY = 62;
    doc.setFontSize(12);
    doc.text("Item Name", 20, startY);
    doc.text("Qty", 90, startY);
    doc.text("Cost", 120, startY);
    doc.text("Total", 160, startY);
    // Divider line
    doc.line(20, startY + 2, 190, startY + 2);

    // Table Content
    let y = startY + 10;
    costPerItem.forEach((item) => {
      doc.text(item.name, 20, y);
      doc.text(String(item.quantity), 90, y);
      doc.text(`$${item.cost.toFixed(2)}`, 120, y);
      doc.text(`$${item.total.toFixed(2)}`, 160, y);
      y += 8;
    });

    doc.line(20, y - 4.5, 190, y - 4.5);

    // Total
    doc.setFontSize(12);
    doc.text("Total:", 140, y + 2);
    doc.text(`$${totalCost.toFixed(2)}`, 160, y + 2);

    // payment info
    if (type !== "QUOTATION") {
      doc.setFontSize(12);
      doc.text(
        `Payment Status: ${type === "RECEIPT" ? "PAID" : "PENDING"}`,
        20,
        y + 2
      );
      doc.text("Payment Method: Paypal", 20, y + 10);
    }

    // return blob data to store in ddb
    return doc.output("blob").arrayBuffer();
  }
}
