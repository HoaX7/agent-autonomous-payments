import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sqsClient = new SQSClient({ region: "us-east-1" }); // e.g. "us-east-1"

export async function sendToQueue<T>(queueUrl: string, message: T) {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  });

  const result = await sqsClient.send(command);
  return result.MessageId;
}
