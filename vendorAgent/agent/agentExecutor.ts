import {
  InMemoryTaskStore,
  TaskStore,
  A2AExpressApp,
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Part,
} from "@a2a-js/sdk";
import { VendorAgent } from "./agent";
import { v4 } from "uuid";
import { logActivity } from "../controllers/activityLogs";
import { getItem } from "../../ddb";
import { VENDOR_DETAILS_PK } from "../../ddb/models/medicalInventory";
import { VendorDetailProps } from "../../ddb/models/types";
import { initLoggerContext, setLoggerContext } from "../clsHooked";

// 1. Define your agent's logic as a AgentExecutor
export class VendorAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();
  private agent: VendorAgent;
  constructor() {
    this.agent = new VendorAgent();
  }

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus
  ): Promise<void> => {
    throw new Error("`cancelTask` not supported");
  };

  /**
   * Takes care of business logic
   * @param ctx
   * @param eventBus
   * @returns
   */
  async execute(ctx: RequestContext, eventBus: ExecutionEventBus) {
    initLoggerContext(() => {
      setLoggerContext({
        requestId: new Date().getTime().toString(),
        recepient: (ctx.userMessage.metadata?.recepient as string) || "unknown",
      });
      this._execute(ctx, eventBus);
      return;
    });
  }

  async _execute(
    ctx: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const userMessage = ctx.userMessage;
    const existingTask = ctx.task;

    // Determine IDs for the task and context, from requestContext.
    const taskId = ctx.taskId;
    const contextId = ctx.contextId;

    console.log(
      `[MyAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
    );
    // 1. Publish initial Task event if it's a new task
    if (!existingTask) {
      const task = taskStatusObject({
        taskId,
        contextId,
        final: false,
        state: "working",
        parts: [{ kind: "text", text: "Processing request..." }],
      }) as unknown as Task;
      task.kind = "task";
      task.id = taskId;
      eventBus.publish(task);
    }

    const parts: Part[] = [];
    for (const item of userMessage.parts) {
      if (item.kind === "data") {
        // get quotation
        if (item.data.getQuotation) {
          await logActivity({
            event: "log",
            message: `Received request from {{recepient}} to generate quotation for the following items: ${(
              item.data.items as any[]
            )
              .slice(0, 3)
              .map((item) => item.name)
              .join(", ")}${
              ((item.data.items as any[]) || []).slice(3).length > 0
                ? ` +${
                    ((item.data.items as any[]) || []).slice(3).length
                  } items`
                : ""
            }`,
          });
          const result = await this.agent.getQuotation(
            (item.data.items as any[]) || [],
            userMessage.metadata?.recepient as string || "unknown"
          );
          if (result) {
            parts.push({
              kind: "data",
              data: {
                result
              },
            });
          } else {
            await logActivity({
              event: "error",
              message: "Unable to generate quotation for {{recepient}}",
            });
            parts.push({
              kind: "text",
              text: "Unable to generate quotation",
            });
          }
        } else if (item.data.getInvoice) {
          await logActivity({
            event: "log",
            message: `Received purchase order from {{recepient}}`,
          });
          const result = await this.agent.getInvoice(
            item.data.items as any[],
            (userMessage.metadata?.recepient as string) || "unknown",
            // if transactionId is present - update the invoice
            userMessage.metadata?.transactionId as number
          );
          if (result) {
            // get payment details
            const details = await getItem<VendorDetailProps>(VENDOR_DETAILS_PK);
            parts.push({
              kind: "data",
              data: {
                result,
                paymentDetails: { email: details?.email, name: details?.name },
              },
            });
          } else {
            await logActivity({
              event: "error",
              message: "Unable to generate invoice for {{recepient}}",
            });
            parts.push({
              kind: "text",
              text: "Unable to generate invoice",
            });
          }
        }
      }
    }

    // 4. Publish final status update
    const finalUpdate: any = taskStatusObject({
      final: true,
      state: "completed",
      contextId,
      taskId,
      metadata: userMessage.metadata,
      parts,
    });
    finalUpdate.kind = "message"; // must be 'message' to indicate end of event
    eventBus.publish(finalUpdate);
    eventBus.finished();
    return;
  }
}

const taskStatusObject = ({
  taskId,
  contextId,
  final = false,
  state,
  parts,
  metadata,
}: {
  taskId: string;
  contextId: string;
  final: boolean;
  state: TaskStatusUpdateEvent["status"]["state"];
  parts?: Part[];
  metadata?: Record<string, any>;
}) => {
  const updateObj: TaskStatusUpdateEvent = {
    kind: "status-update",
    taskId: taskId,
    contextId: contextId,
    status: {
      state: state,
      timestamp: new Date().toISOString(),
    },
    final,
    metadata,
  };
  if (parts) {
    updateObj.status.message = {
      kind: "message",
      role: "agent",
      messageId: v4(),
      taskId: taskId,
      contextId: contextId,
      parts: parts,
    };
  }
  return updateObj;
};
