import express from "express";
import { confirmPayment } from "../controllers/webhook";

const routes = express.Router();

routes.post("/paypal", confirmPayment)

export default routes;
