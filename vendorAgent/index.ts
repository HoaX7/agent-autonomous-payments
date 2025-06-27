import {
  A2AExpressApp,
  DefaultRequestHandler,
  InMemoryTaskStore,
} from "@a2a-js/sdk";
import { VendorAgentExecutor } from "./agent/agentExecutor";
import { vendorAgentCard } from "./agent/agentCard";
import express from "express";
import serverless from "serverless-http";
import { updateOrder } from "./controllers/transactions";
import webhookRoute from "./routes/webhook";
import transactionRoute from "./routes/transactions";

const requestHandler = new DefaultRequestHandler(
  vendorAgentCard,
  new InMemoryTaskStore(),
  new VendorAgentExecutor()
);

// Create and setup A2AExpressApp
const appBuilder = new A2AExpressApp(requestHandler);
// only creates a2a routes
const expressApp = appBuilder.setupRoutes(express(), "");
// custom routes
expressApp.post("/updateOrder/:id", updateOrder)
expressApp.use("/webhooks", webhookRoute)
expressApp.use("/transactions", transactionRoute)

// const PORT = process.env.PORT || 41242; // Different port for coder agent
  // expressApp.listen(PORT, () => {
  //   console.log(`[RetailAgent] Server using new framework started on http://localhost:${PORT}`);
  //   console.log(`[RetailAgent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
  //   console.log('[RetailAgent] Press Ctrl+C to stop the server');
  // });
export default expressApp;

export const handler = serverless(expressApp);
