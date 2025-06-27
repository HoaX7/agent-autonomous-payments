import type { Request, Response } from "express";
import { jsonError, jsonSuccess } from "../responses";
import * as inventory from "../../ddb/models/medicalInventory";
import { threshold } from "../constants";
import { sendToQueue } from "../../sqs/index";
import { deleteLogs, logActivity } from "./activityLogs";
import { restockInventory } from "../agent/agent";
import { randomElementFromArray, randomNumber } from "../utils";

/**
 * Consume inventory items to simulate re-stocking
 * by the agent
 */
export const simulate = async (req: Request, res: Response) => {
  try {
    const result = await inventory.getItems();
    const randomArr = randomElementFromArray(result, result.length / 2);
    for (let i = 0; i < randomArr.length; i++) {
      const item = randomArr[i];
      const randomStock = randomNumber(1, threshold - 2);
    //   await inventory.updateInventory(item.id, { inStock: randomStock });
      randomArr[i].inStock = randomStock;
    }

    // delete logs
    await deleteLogs()

    // restockInventory(randomArr) // for dev
    // notify the agent to re-stock items
    if (process.env.QUEUE_URL) {
      console.log("dispatching SQS:", process.env.QUEUE_URL);
      await sendToQueue(process.env.QUEUE_URL, { restockInventory: true, items: randomArr });
    } else {
      await logActivity({
        event: "error",
        message: "Could not trigger SQS. Invalid url",
      });
    }

    jsonSuccess(res, randomArr);
  } catch (err: any) {
    console.error(err);
    jsonError(res, { message: err.message });
  }
  return;
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const result = await inventory.getItems();
    jsonSuccess(res, result);
  } catch (err: any) {
    console.error(err);
    jsonError(res, { message: err.message });
  }
  return;
};
