import * as model from "../../ddb/models/transaction";
import { TransactionProps } from "../../ddb/models/types";
import { Request, Response } from "express";

export const createTransaction = async (
  data: Omit<TransactionProps, "id" | "createdAt" | "updatedAt">
) => {
  try {
    return model.create(data);
  } catch (err) {
    console.error("createTransaction: ERROR", err);
    return;
  }
};

export const getTransaction = async (id: number) => {
  const result = await model.getById({
    sortKeyExpression: "id = :id",
    values: { ":id": id },
  });
  return result?.[0] as TransactionProps;
};

export const updateTransaction = async (
  id: number,
  data: Partial<TransactionProps>
) => {
  try {
    return model.update(id, data);
  } catch (err) {
    console.error("updateTransaction: ERROR", err);
    return;
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) throw new Error("Invalid id");
    const body = req.body;
    let failed = !!body.failed;
    let completed = !!body.completed;
    await model.update(id, {
      paymentStatus: completed ? "COMPLETED" : failed ? "FAILED" : "CANCELLED",
    });
    res.status(200).json({ success: true });
    return;
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Internal Server Error",
    });
    return;
  }
};

export const downloadInvoiceReceiptPdf = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) throw new Error("Invalid id");
    const query = req.query.q;
    const transaction = await getTransaction(+id);
    if (!transaction) {
      res
        .status(404)
        .json({ message: "Transaction not found", success: false });
      return;
    }
    const isReceipt = query === "receipt";
    const isQuotation = query === "quotation";
    let buff = transaction.invoice;
    if (isQuotation) {
      if (!transaction.quotation) {
        res.status(404).json({
          message:
            "A quotation was not generated for this transaction. Contact the merchant",
        });
        return;
      }
      buff = transaction.quotation;
    } else if (isReceipt) {
      if (!transaction.receipt) {
        res.status(404).json({
          message:
            "A receipt was not generated for this transaction. Contact the merchant",
        });
        return;
      }
      buff = transaction.receipt;
    }
    if (!buff) {
      res.status(404).json({
        message:
          "An invoice was not generated for this transaction. Contact the merchant",
      });
      return;
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${query}.pdf`,
      "Content-Length": buff.length,
    });

    res.send(buff);
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
};
