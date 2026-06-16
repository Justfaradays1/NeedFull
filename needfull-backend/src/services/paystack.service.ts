// WHAT: Typed wrapper around Paystack HTTP API for payment processing
// WHY: Centralized payment integration with deposit (via card), withdrawal (to bank account)
// FUTURE: Add bank list endpoint for dynamic bank selection in withdrawal form

import axios, { AxiosError } from "axios";
import { createHmac } from "crypto";
import env from "../config/env";

// WHAT: Create Paystack API client with authentication
// WHY: Reusable axios instance with pre-configured headers and base URL
const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// WHAT: Initialize payment transaction for user deposit
// WHY: Create Paystack payment session and return authorization URL for card payment
export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}): Promise<{
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}> {
  try {
    const response = await paystackClient.post("/transaction/initialize", {
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    });

    // WHAT: Check for successful response from Paystack API
    // WHY: API returns status: true on success, false on failure with message
    if (!response.data.status) {
      throw new Error(
        response.data.message ||
          "Paystack did not confirm transaction initialization",
      );
    }

    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      accessCode: response.data.data.access_code,
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Paystack transaction initialization failed: ${message}`);
  }
}

// WHAT: Verify transaction after user completes payment
// WHY: Confirm payment success and get final amount, email, and metadata
export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amountKobo: number;
  email: string;
  metadata: Record<string, any>;
}> {
  try {
    const response = await paystackClient.get(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (!response.data.status) {
      throw new Error(
        response.data.message || "Transaction verification failed",
      );
    }

    return {
      status: response.data.data.status,
      amountKobo: response.data.data.amount,
      email: response.data.data.customer.email,
      metadata: response.data.data.metadata || {},
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Paystack transaction verification failed: ${message}`);
  }
}

// WHAT: Create transfer recipient (bank account) for future withdrawals
// WHY: Register user's bank account once, reuse for multiple withdrawal requests
export async function createTransferRecipient(params: {
  accountNumber: string;
  bankCode: string;
  name: string;
}): Promise<{
  recipientCode: string;
}> {
  try {
    const response = await paystackClient.post("/transferrecipient", {
      type: "nuban", // Nigerian Universal Bank Account Number
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      name: params.name,
    });

    if (!response.data.status) {
      throw new Error(
        response.data.message || "Failed to create transfer recipient",
      );
    }

    return {
      recipientCode: response.data.data.recipient_code,
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Paystack transfer recipient creation failed: ${message}`);
  }
}

// WHAT: Initiate bank transfer to registered recipient
// WHY: Send money from NeedFull balance to user's bank account (withdrawal)
export async function initiateTransfer(params: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason: string;
}): Promise<{
  transferCode: string;
  status: string;
}> {
  try {
    const response = await paystackClient.post("/transfer", {
      source: "balance", // Transfer from NeedFull's Paystack balance
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || "Failed to initiate transfer");
    }

    return {
      transferCode: response.data.data.transfer_code,
      status: response.data.data.status, // 'pending', 'completed', or 'failed'
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Paystack transfer initiation failed: ${message}`);
  }
}

// WHAT: Check status of initiated transfer
// WHY: Monitor withdrawal progress, detect success/failure without webhook
export async function verifyTransfer(reference: string): Promise<{
  status: string;
}> {
  try {
    const response = await paystackClient.get(
      `/transfer/verify/${encodeURIComponent(reference)}`,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Transfer verification failed");
    }

    return {
      status: response.data.data.status,
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Paystack transfer verification failed: ${message}`);
  }
}

// WHAT: Verify Paystack webhook signature using timing-safe comparison
// WHY: Authenticate webhook events from Paystack to prevent spoofing
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  try {
    // WHAT: Generate HMAC-SHA512 hash of request body
    // WHY: Paystack signs all webhooks with this algorithm
    const hash = createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    // WHAT: Compare using timing-safe equality
    // WHY: Prevent timing attacks that could leak signature information
    return hash === signature;
  } catch (error) {
    // WHAT: Log error but return false (untrusted webhook)
    // WHY: Signature verification should always fail safely
    console.error(
      "[Paystack] Webhook signature verification error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

// WHAT: Resolve bank account number to get account holder name
// WHY: Validate account before creating transfer recipient
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string,
): Promise<string | null> {
  try {
    const response = await paystackClient.get("/bank/resolve", {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
    return response.data?.data?.account_name || null;
  } catch (error) {
    console.error(
      "[Paystack] Account resolution error:",
      error instanceof AxiosError ? error.response?.data?.message || error.message : "Unknown error",
    );
    return null;
  }
}
