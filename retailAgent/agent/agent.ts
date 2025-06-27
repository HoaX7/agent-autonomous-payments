import { A2AClient } from "./A2AClient";
import { getItem } from "../../ddb";
import * as inventory from "../../ddb/models/medicalInventory";
import { ERROR_CODES, LLMError, threshold } from "../constants";
import { logActivity, updateActivityStatus } from "../controllers/activityLogs";
import { llm } from "../genkit";
import {
  MedicalInventoryProps,
  VendorDetailProps,
} from "../../ddb/models/types";
import { getWalletDetails, updateWallet } from "../controllers/wallet";
import { makePayment } from "../payments/index";
import { GenerateResponse, Message } from "genkit";
import { randomNumber } from "../utils";

type InvoiceParams = {
  id: number;
  required: number;
  name: string;
}[];

type InvoiceDataReturnType = {
  id: number;
  name: string;
  cost: number;
  quantity: number;
  total: number;
};

type AgentInvoiceObject = {
  kind: "data";
  data: {
    result: {
      costPerItem: InvoiceDataReturnType[];
      totalCost: number;
      transactionId: number;
      invoiceUrl?: string;
    };
    paymentDetails: {
      email: string;
      name: string;
    };
  };
};

const RETAILER_NAME = "Clover Pharmacy";

export const restockInventory = async (arr: MedicalInventoryProps[]) => {
  try {
    if (arr.length <= 0) return;
    await logActivity({
      message: "Inventory change observed",
      event: "log",
    }, 0);
    await logActivity({
        message: "Creating a list of low inventory items",
        event: "log"
    })
    /**
     * Establish connection to vendor agent, to fetch invoice
     */
    const vendorAgent = new VendorAgent();
    await vendorAgent.connectClient();
    const agentCard = await vendorAgent.fetchAgentCard();
    if (!agentCard) {
      await logActivity({
        event: "error",
        message: "Failed to establish connection with {{vendor}}",
      });
      return;
    }
    // const walletDetails = await getWalletDetails();
    // if (
    //   !walletDetails ||
    //   walletDetails.budget <= 0 ||
    //   walletDetails.balance <= 0
    // ) {
    //   await logActivity({
    //     event: "error",
    //     message: "Low balance or budget. Reload balance to continue",
    //   });
    //   return;
    // }

    /**
     * Identify items and required amount to re-stock using llm
     */
    console.log("processing request in llm");
    // const result = await inventory.getItems();
    const response = await useLLM(
      `${JSON.stringify(
        arr.map((item) => ({
          name: item.name,
          id: item.id,
          inStock: item.inStock,
        }))
      )} can you give me all the items i need to re-stock along with the required amount`,
      arr
    );
    console.log("response from llm - success");

    /**
     * parse text response from llm
     */
    let responseText = response.message?.content?.[0]?.text || "";
    const parsedData = parseLLMResponse<InvoiceParams>(responseText);
    if (parsedData.length <= 0) {
      await logActivity({ message: "No items to re-stock", event: "log" });
      return;
    }
    await logActivity({
        event: "log",
        message: `The following items are low on inventory: ${
            parsedData.slice(0, 3).map((p) => p.name).join(", ")
        }${parsedData.slice(3).length > 0 ? ` +${parsedData.slice(3).length} items` : ""}`
    })
    const quotation = await vendorAgent.getQuotation(parsedData);
    // const budget = walletDetails.budget;
    const budget = 2000;
    await logActivity({
        event: "log",
        message: `Checking budget for payable quotation amount $${quotation?.data?.result?.totalCost || 0}`
    }, 0)
    if (!quotation?.data.result.totalCost || budget < quotation?.data?.result?.totalCost) {
        await logActivity({
            event: "error",
            message: "Budget not available. Increase budget to continue"
        })
        return;
    }
    await logActivity({
        event: "log",
        message: "Budget available"
    }, 0)
    let invoice = await vendorAgent.getInvoice(parsedData, quotation.data.result.transactionId);
    if (!invoice) {
      await logActivity({
        event: "error",
        message: "Unable to retrieve invoice from {{vendor}}",
      });
      return;
    }
    if (!invoice.data.paymentDetails?.email) {
      await Promise.all([
        vendorAgent.updateOrder(invoice.data.result.transactionId),
        logActivity({
          event: "error",
          message: "Payment details not found for {{vendor}}",
        }),
      ]);
      return;
    }
    // if (budget < invoice.data.result.totalCost) {
    //   await Promise.all([
    //     vendorAgent.updateOrder(invoice.data.result.transactionId),
    //     logActivity({
    //       event: "error",
    //       message: "Low balance. Reload agent balance to continue",
    //     }),
    //   ]);
    //   return;
    // }
    // // Make payment
    const [_, payment] = await Promise.all([
      logActivity({
        event: "log",
        message: `Making payment of $${invoice.data.result.totalCost} to {{vendor}}`,
      }),
      makePayment(
        invoice.data.paymentDetails.email,
        invoice.data.result.totalCost,
        invoice.data.result.transactionId
      ),
    ]);
    if (!payment) {
      await vendorAgent.updateOrder(invoice.data.result.transactionId, {
        failed: true,
      });
      return;
    }
    // notify vendor of payment
    await logActivity({
        event: "log",
        message: "Waiting for payment confirmation from paypal, may take up to 60s...",
        status: "working",
        user: "VENDOR_AGENT"
    })
    // // /**
    //  * If budget is lower than the total cost
    //  * use llm to filter out some items & quantity
    //  * to place orders.
    //  *
    //  * else place order for all items
    //  */
    // if (budget < invoice.data.result.totalCost) {
    //   // Use invoice to determine if items are within budget
    //   const resp = await useLLM(
    //     `${JSON.stringify(
    //       invoice.data
    //     )}, my budget is ${budget}. filter out the items I can purchase to fit my budget.`,
    //     result
    //   );
    //   const itemsWithinBudget = parseLLMResponse<InvoiceParams>(
    //     resp.message?.content?.[0].text || ""
    //   );
    //   if (!itemsWithinBudget || itemsWithinBudget.length <= 0) {
    //     await Promise.all([
    //       vendorAgent.updateOrder(invoice.data.result.transactionId, {
    //         cancelled: true,
    //       }),
    //       logActivity({
    //         event: "error",
    //         message:
    //           "Low balance or budget. Reload agent balance or increase budget to continue",
    //       }),
    //     ]);
    //     return;
    //   }
    //   // generate new invoice with new item requirements
    //   invoice = await vendorAgent.updateInvoice(
    //     itemsWithinBudget,
    //     invoice.data.result.transactionId
    //   );
    //   if (!invoice) {
    //     await logActivity({
    //       event: "error",
    //       message: "Unable to fetch invoice from vendor",
    //     });
    //     return;
    //   }
    // }
  } catch (err: any) {
    console.error("agent.restockInventory: ERROR", err);
    if (err instanceof LLMError) {
      await logActivity({ message: err.message, event: "error" });
    } else {
      await logActivity({ message: "Unknown error occured", event: "error" });
    }
  }
  return;
};

const parseLLMResponse = <T>(responseText: string) => {
  if (!responseText) throw new LLMError(ERROR_CODES.NO_RESPONSE);
  responseText = parseEmbededJson(responseText);
  if (!responseText) throw new LLMError(ERROR_CODES.INVALID_RESPONSE);
  return JSON.parse(responseText) as T;
};
const parseEmbededJson = (str: string) => {
  const match = str.match(/```json\s*(.*?)\s*```/s);
  return match ? match[1] : "";
};

const useLLM = async (text: string, mockData: MedicalInventoryProps[] = []) => {
  console.time("llmResponse");
  const data = [...mockData].filter((item) => item.inStock < threshold);
  // mock llm response
  let response: any = {
    message: {
      content: [
        {
          text: `\`\`\`json${JSON.stringify(
            data.map((item) => {
              return {
                id: item.id,
                required: randomNumber(1, 2),
                name: item.name,
              };
            })
          )}\`\`\``,
        },
      ],
    },
  };
  if (process.env.USE_LLM) {
    response = await llm(
      {
        now: new Date().toISOString(),
        threshold,
      },
      {
        messages: [
          {
            role: "user",
            content: [
              {
                text,
              },
            ],
          },
        ],
        tools: [],
      }
    );
  }
  console.timeEnd("llmResponse");
  return response;
};

class VendorAgent {
  client: A2AClient | null = null;
  async connectClient() {
    try {
      const result = await getItem<VendorDetailProps>(
        inventory.VENDOR_DETAILS_PK
      );
      if (!result?.url) {
        logActivity({
          event: "error",
          message:
            "Unable to connect to {{vendor}}, please provide a valid url",
        });
        return;
      }
      this.client = new A2AClient(result.url);
        // this.client = new A2AClient("http://localhost:41241"); // local dev
    } catch (err) {
      console.error(err);
    }
  }
  async fetchAgentCard() {
    return this.client?._fetchAndCacheAgentCard();
  }
  async updateOrder(
    transactionId: number,
    params?: { failed?: boolean; cancelled?: boolean; completed?: boolean }
  ) {
    return this.client?.updateOrder(transactionId, {
      ...(params || {}),
      metadata: {
        recepient: RETAILER_NAME,
      },
    });
  }
 async getQuotation(items: InvoiceParams) {
    if (!this.client) {
      logActivity({
        event: "error",
        message: "Unable to connect to {{vendor}}. Client not initialized",
      });
      return;
    }
    await logActivity({
      event: "log",
      message: "Requesting quotation for low inventory items",
    });
    const response = await this.client?.sendMessage({
      message: {
        parts: [
          {
            kind: "data",
            data: { items, getQuotation: true },
          },
        ],
        kind: "message",
        role: "user",
        messageId: new Date().getTime().toString(),
        metadata: {
          recepient: RETAILER_NAME,
        },
      },
    });
    console.log("got quotation from vendor");
    const quotation = response.result.status.message.parts.find(
      (item: any) => item.kind === "data"
    );
    if (!quotation) {
      logActivity({
        event: "error",
        message: "Failed to retrieve quotation from {{vendor}}",
      });
      return;
    }
    await logActivity({
      event: "completed",
      message:
        `Quotation received from {{vendor}} ${quotation.data.result.quotationUrl}`,
        trigger: "VENDOR_AGENT"
    });
    const logId = await logActivity({
      event: "parsing",
      message: "Parsing quotation",
      status: "working"
    });
    if (logId) {
        await updateActivityStatus(logId, "task-complete")
    }
    return quotation as AgentInvoiceObject;
  } 
  /**
   * Fetch invoice from vendor
   */
  async getInvoice(items: InvoiceParams, transactionId?: number) {
    if (!this.client) {
      logActivity({
        event: "error",
        message: "Unable to connect to {{vendor}}. Client not initialized",
      });
      return;
    }
    await logActivity({
      event: "log",
      message: "Generating and sending purchase order to {{vendor}}",
    });
    const _logId = await logActivity({
        event: "log",
        message: "Waiting for invoice",
        status: "working",
    }, 0)
    const response = await this.client?.sendMessage({
      message: {
        parts: [
          {
            kind: "data",
            data: { items, getInvoice: true, transactionId },
          },
        ],
        kind: "message",
        role: "user",
        messageId: new Date().getTime().toString(),
        metadata: {
          recepient: RETAILER_NAME,
          transactionId
        },
      },
    });
    console.log("got invoice from vendor");
    const invoice = response.result.status.message.parts.find(
      (item: any) => item.kind === "data"
    );
    if (!invoice) {
      logActivity({
        event: "error",
        message: "Failed to retrieve invoice from {{vendor}}",
      });
      return;
    }
    if (_logId) {
        await updateActivityStatus(_logId, "task-complete")
    }
    await logActivity({
      event: "completed",
      message:
        "Received invoice from {{vendor}}. Total payable amount: " +
        `$${invoice.data.result.totalCost} ${invoice.data.result.invoiceUrl}`,
        trigger: "VENDOR_AGENT"
    });
    const logId = await logActivity({
      event: "parsing",
      message: "Parsing invoice",
      status: "working"
    });
    if (logId) {
        await updateActivityStatus(logId, "task-complete")
    }
    return invoice as AgentInvoiceObject;
  }
  /**
   * Generate new invoice based on items you can buy within
   * the budget
   */
  async updateInvoice(items: InvoiceParams, transactionId: number) {
    if (!this.client) {
      logActivity({
        event: "error",
        message: "Unable to connect to {{vendor}}. Client not initialized",
      });
      return;
    }
    logActivity({
      event: "log",
      message: "Amount out of budget, requesting new invoice from {{vendor}}",
    });
    const response = await this.client?.sendMessage({
      message: {
        parts: [
          {
            kind: "data",
            data: { items, getInvoice: true },
          },
        ],
        kind: "message",
        role: "user",
        messageId: new Date().getTime().toString(),
        metadata: {
          recepient: RETAILER_NAME,
          transactionId,
        },
      },
    });
    const invoice = response.result.status.message.parts.find(
      (item: any) => item.kind === "data"
    ) as AgentInvoiceObject;
    if (!invoice) {
      logActivity({
        event: "error",
        message: "Failed to retrieve updated invoice from {{vendor}}",
      });
      return;
    }
    await logActivity({
      event: "completed",
      message:
        "Invoice received from {{vendor}}. Total payable amount: " +
        `$${invoice.data.result.totalCost} ${invoice.data.result.invoiceUrl}`,
      trigger: "VENDOR_AGENT"
    });
    await logActivity({
      event: "parsing",
      message: "Parsing invoice",
    });
    return invoice;
  }
}
