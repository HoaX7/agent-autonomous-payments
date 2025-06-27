import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "node:path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import dotenv from "dotenv";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

dotenv.config({ path: __dirname + "/../.env" });

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // verify API Keys in .env
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API keys");
    }

    const queue = new sqs.Queue(this, "AgentQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
      queueName: "A2APaymentsQueue",
    });
    const table = new ddb.Table(this, "A2APaymentsDemo", {
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "id", type: ddb.AttributeType.NUMBER },
      tableName: "A2APaymentsDemo",
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const retailFn = new lambda.Function(this, "RetailAgent", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../../retailAgent/dist")
      ),
      environment: {
        QUEUE_URL: queue.queueUrl,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "",
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || "",
      },
    });

    // use the auto-generated role for 1 lambda
    const lambdaRole = retailFn.role;
    // Add custom policies
    lambdaRole?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
        ],
        resources: [queue.queueArn, table.tableArn],
      })
    );

    const retailSqsHandlerFn = new lambda.Function(this, "RetailSqsHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.sqsHandler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../../retailAgent/dist")
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(45), // 30 sec timeout to receive invoice from vendor
      environment: {
        QUEUE_URL: queue.queueUrl,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "",
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || "",
      },
    });
    retailSqsHandlerFn.addEventSource(new SqsEventSource(queue));

    const vendorFn = new lambda.Function(this, "VendorAgent", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../../vendorAgent/dist")
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(45),
      environment: {
        QUEUE_URL: queue.queueUrl,
        HOST_URL: "", // update with vendor api-gateway url
      },
    });

    console.log("Vendor Lambda Function Name:", vendorFn.functionName);

    // access from www
    new apigw.LambdaRestApi(this, `ApiGwEndpoint`, {
      handler: retailFn,
      restApiName: `A2AProtocol`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    const vendorEndpoint = new apigw.LambdaRestApi(
      this,
      `ApiGwVendorEndpoint`,
      {
        handler: vendorFn,
        restApiName: `A2AProtocol-Vendor`,
        defaultCorsPreflightOptions: {
          allowOrigins: apigw.Cors.ALL_ORIGINS,
          allowMethods: apigw.Cors.ALL_METHODS,
        },
      }
    );

    // grant perms to access queue and table
    queue.grantSendMessages(retailFn);
    queue.grantConsumeMessages(retailFn);
    table.grantReadWriteData(retailFn);

    // sqs lambda
    queue.grantSendMessages(retailSqsHandlerFn);
    queue.grantConsumeMessages(retailSqsHandlerFn);
    table.grantReadWriteData(retailSqsHandlerFn);

    // vendor perms
    table.grantReadWriteData(vendorFn);
    queue.grantSendMessages(vendorFn);
    queue.grantConsumeMessages(vendorFn);
  }
}
