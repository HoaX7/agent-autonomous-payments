import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const ddbClient = new DynamoDBClient({
  region: "us-east-1", // change as needed
});

export const docClient = DynamoDBDocumentClient.from(ddbClient);

const tableName = "A2APaymentsDemo";

export async function putItem<T extends Record<string, any>>(
  pk: string,
  item: T
) {
  const now = Date.now();
  const itemWithTimestamps = {
    ...item,
    id: now, // sortKey
    createdAt: now,
    updatedAt: now,
    pk,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: itemWithTimestamps,
    })
  );
  return now; // sk
}

export async function getItem<RT = Record<string, any>>(
  pk: string,
  sk?: number
) {
  let query = "pk = :pk";
  let values = { ":pk": pk };
  if (sk) {
    query = `${query} and id = :id`;
    Object.assign(values, { ":id": sk });
  }
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: query,
      ExpressionAttributeValues: values,
    })
  );
  return result.Items?.[0] as RT;
}

export async function queryItems<RT = Record<string, any>>(params: {
  pk: string;
  sortKeyExpression?: string;
  filterExpression?: string; // e.g. "#id IN (:id1, :id2)"
  names?: Record<string, string>;
  values?: Record<string, any>;
}): Promise<RT[]> {
  const {
    pk,
    filterExpression,
    names = {},
    values = {},
    sortKeyExpression,
  } = params;

  const keyName = "pk";
  const expressionAttributeNames = {
    [`#${keyName}`]: keyName,
    ...names,
  };

  const expressionAttributeValues = {
    [`:pk`]: pk,
    ...values,
  };

  let keyExpression = `#${keyName} = :pk`;
  if (sortKeyExpression) {
    keyExpression = `${keyExpression} AND ${sortKeyExpression}`;
  }
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyExpression,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  return result.Items as RT[];
}

export async function updateItem<T extends Record<string, any>>(params: {
  id: number;
  whereClause: Record<string, any>;
  updates: Partial<T>;
  pk: string;
  incStock?: {
    qty: number;
  };
}) {
  const { whereClause, updates } = params;

  const now = Date.now();
  const fullUpdates = { ...updates, updatedAt: now };

  const keys = Object.keys(fullUpdates);
  const expressionParts = keys.map((k, i) => `#k${i} = :v${i}`);
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, any> = {};

  keys.forEach((k, i) => {
    ExpressionAttributeNames[`#k${i}`] = k;
    ExpressionAttributeValues[`:v${i}`] = fullUpdates[k];
  });

  if (params.incStock) {
    ExpressionAttributeValues[":qty"] = params.incStock.qty;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        ...whereClause,
        pk: params.pk,
        id: params.id,
      },
      UpdateExpression: `SET ${expressionParts.join(", ")}${
        params.incStock?.qty ? ", inStock = inStock + :qty" : ""
      }`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

export const batchDelete = async (pk: string) => {
  const result = await queryItems({ pk });
  if (result.length > 0) {
    const chunks = chunkArray(result, Math.ceil(result.length / 24));
    await Promise.all(
      chunks.map(async (chunk) => {
        const deleteRequest = chunk.map((r) => ({
          DeleteRequest: {
            Key: {
              pk,
              id: r.id,
            },
          },
        }));
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: deleteRequest,
            },
          })
        );
      })
    );
  }
};

function chunkArray(array: any[], size: number) {
  if (!Array.isArray(array)) throw new TypeError("Expected an array");
  if (typeof size !== "number" || size <= 0)
    throw new RangeError("Chunk size must be a positive number");

  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
