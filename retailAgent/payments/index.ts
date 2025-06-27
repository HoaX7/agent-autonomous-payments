import { config } from "../config";
import { logActivity } from "../controllers/activityLogs";
const paypalApi = "https://api-m.sandbox.paypal.com";

export const makePayment = async (
  email: string,
  amount: number,
  transactionId: number
) => {
  if (!config.PAYPAL_CLIENT_ID || !config.PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing paypal env vars.");
  }
  if (amount <= 0) {
    return;
  }
  const accessToken = await getAccessToken(
    config.PAYPAL_CLIENT_ID,
    config.PAYPAL_CLIENT_SECRET
  );
  if (!accessToken) {
    logActivity({
      event: "error",
      message: "Payment failed. Unable to get paypal access token",
    });
    return;
  }
  const resp = await sendPayment(accessToken, email, amount, transactionId);
  if (!resp) {
    return;
  }
  await logActivity({
    event: "completed",
    message: `Payment of $${amount} was sent`,
  });
  return true;
};

const sendPayment = async (
  accesToken: string,
  email: string,
  amount: number,
  transactionId: number
) => {
  try {
    const url = `${paypalApi}/v1/payments/payouts`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: transactionId,
          recipient_type: "EMAIL",
          email_subject: `Payment for Order ${transactionId}`,
          email_message: "You received a payment.",
        },
        items: [
          {
            amount: {
              value: amount.toFixed(2).toString(),
              currency: "USD",
            },
            sender_item_id: transactionId,
            recipient_wallet: "PAYPAL",
            receiver: email,
          },
        ],
      }),
      headers: {
        Authorization: `Bearer ${accesToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw await response.json();
    return response.json();
  } catch (err: any) {
    console.log("payment failed", err);
    logActivity({ event: "error", message: err?.message || "Payment failed" })
    return;
  }
};

const getAccessToken = async (clientId: string, clientSecret: string) => {
  try {
    const body = "grant_type=client_credentials";
    const authToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );
    const url = `${paypalApi}/v1/oauth2/token`;
    const response = await fetch(url, {
      method: "POST",
      body,
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!response.ok) return;
    const resp = await response.json();
    return resp.access_token;
  } catch (err) {
    console.error(err);
    return;
  }
};
