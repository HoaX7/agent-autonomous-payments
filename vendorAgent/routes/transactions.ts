import express from "express";
import { downloadInvoiceReceiptPdf } from "../controllers/transactions";

const routes = express.Router();

routes.get("/:id", downloadInvoiceReceiptPdf)

export default routes;
