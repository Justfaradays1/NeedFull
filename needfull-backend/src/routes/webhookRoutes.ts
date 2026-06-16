// WHAT: Webhook handlers for Paystack and Monnify payment providers
// WHY: Receive real-time payment notifications and update wallet/withdrawal status automatically
// FUTURE: Add webhook event logging table for debugging, add webhook signature rotation/versioning

import { Router, Request, Response } from "express";
import db, { queryOne, withTransaction } from "../config/db";
import { creditWallet } from "../services/wallet.service";
import { verifyWebhookSignature } from "../services/paystack.service";
import { handleMonnifyWebhook } from "../services/monnify.service";
import { notifyUser } from "../services/notification.service";

const router = Router();

import express from "express";

const rawBodyMiddleware = express.raw({ type: 'application/json' });

router.post(
  "/webhooks/paystack",
  rawBodyMiddleware,
  async (req: Request, res: Response) => {
    try {
      // WHAT: Extract signature from header
      // WHY: Verify webhook authenticity
      const signature = (req.headers["x-paystack-signature"] ||
        req.headers["x-paystack-sig"]) as string;

      if (!signature) {
        console.warn("[Paystack Webhook] Missing signature header");
        return void res.status(400).json({ error: "Missing signature" });
      }

      // WHAT: Verify webhook signature
      // WHY: Ensure webhook is authentic from Paystack
      const isValid = verifyWebhookSignature(req.body, signature);

      if (!isValid) {
        console.warn("[Paystack Webhook] Invalid signature");
        return void res.status(400).json({ error: "Invalid signature" });
      }

      // WHAT: Parse body as JSON after signature verification
      // WHY: Now safe to parse and process events
      let payload;
      try {
        payload = JSON.parse(req.body.toString());
      } catch (error) {
        console.error("[Paystack Webhook] Failed to parse JSON:", error);
        return void res.status(200).json({ status: "ok" }); // Still return 200
      }

      // WHAT: Handle successful card charge
      // WHY: Credit wallet when user completes card payment
      if (payload.event === "charge.success") {
        try {
          const chargeData = payload.data;

          // WHAT: Extract reference and verify idempotency
          // WHY: Prevent double-crediting if webhook is retried
          const reference = chargeData.reference;
          const amountKobo = chargeData.amount;

          // WHAT: Check if already processed
          // WHY: Idempotency - don't credit twice
          const existing = await db.query(
            `SELECT id FROM wallet_transactions WHERE reference = $1 AND type = 'card_deposit'`,
            [reference],
          );

          if (existing.rows.length > 0) {
            console.log(
              `[Paystack Webhook] Charge ${reference} already processed`,
            );
            return void res.status(200).json({ status: "ok" }); // Idempotent
          }

          // WHAT: Extract user ID from metadata
          // WHY: Know which user to credit
          const metadata = chargeData.metadata || {};
          const userId = metadata.userId;

          if (!userId) {
            console.error("[Paystack Webhook] Missing userId in metadata");
            return void res.status(200).json({ status: "ok" });
          }

          // WHAT: Credit wallet within transaction
          // WHY: Ensure wallet update and notification happen together
          await withTransaction(async (client) => {
            await creditWallet(
              client,
              userId,
              amountKobo,
              "card_deposit",
              "Card payment deposit via Paystack",
              reference, // idempotencyKey
              reference, // reference
            );

            // WHAT: Notify user of successful deposit
            // WHY: User sees funds immediately in app
            await notifyUser(userId, {
              type: "deposit_received",
              title: "Deposit Received",
              body: `₦${(amountKobo / 100).toLocaleString()} added to your wallet`,
              taskId: undefined,
              conversationId: undefined,
              actorId: undefined,
            });
          });

          console.log(
            `[Paystack Webhook] Charged ${reference} - ₦${(amountKobo / 100).toLocaleString()}`,
          );
        } catch (error) {
          console.error(
            "[Paystack Webhook] Error processing charge.success:",
            error,
          );
        }
      }

      // WHAT: Handle successful transfer (withdrawal)
      // WHY: Update withdrawal request status when payout to user's bank succeeds
      if (payload.event === "transfer.success") {
        try {
          const transferData = payload.data;
          const reference = transferData.reference;

          // WHAT: Update withdrawal_requests status to 'completed'
          // WHY: User can see their withdrawal succeeded
          await db.query(
            `UPDATE withdrawal_requests 
             SET status = 'completed', updated_at = NOW()
             WHERE reference = $1`,
            [reference],
          );

          // WHAT: Get user and notify
          // WHY: Inform user their money is on the way
          const withdrawal = await db.query<{ user_id: string }>(
            `SELECT user_id FROM withdrawal_requests WHERE reference = $1`,
            [reference],
          );

          if (withdrawal.rows.length > 0) {
            const userId = withdrawal.rows[0].user_id;
            await notifyUser(userId, {
              type: "withdrawal_completed",
              title: "Withdrawal Completed",
              body: `Your withdrawal of ₦${(transferData.amount / 100).toLocaleString()} has been sent to your bank account`,
              taskId: undefined,
              conversationId: undefined,
              actorId: undefined,
            });
          }

          console.log(
            `[Paystack Webhook] Transfer ${reference} succeeded - ₦${(transferData.amount / 100).toLocaleString()}`,
          );
        } catch (error) {
          console.error(
            "[Paystack Webhook] Error processing transfer.success:",
            error,
          );
        }
      }

      // WHAT: Handle failed transfer (withdrawal)
      // WHY: Notify user and reverse wallet hold if transfer fails
      if (payload.event === "transfer.failed") {
        try {
          const transferData = payload.data;
          const reference = transferData.reference;

          // WHAT: Fetch withdrawal request
          // WHY: Get user_id and amount to refund
          const withdrawal = await queryOne<{
            user_id: string;
            amount_kobo: number;
          }>(
            `SELECT user_id, amount_kobo FROM withdrawal_requests WHERE reference = $1`,
            [reference],
          );

          // WHAT: Update withdrawal status to 'failed'
          // WHY: Track failure for audit
          await db.query(
            `UPDATE withdrawal_requests 
             SET status = 'failed', failure_reason = $1, updated_at = NOW()
             WHERE reference = $2`,
            [transferData.reason || "Transfer failed", reference],
          );

          // WHAT: Refund wallet if escrow is held
          // WHY: Return funds to user's balance when transfer fails
          await withTransaction(async (client) => {
            // NOTE: Assume escrow was locked for withdrawal
            // This is a simplified refund - real implementation may need adjustment
            await creditWallet(
              client,
              withdrawal.user_id,
              withdrawal.amount_kobo,
              "withdrawal_failed_refund",
              `Withdrawal refunded due to transfer failure: ${transferData.reason || "Unknown reason"}`,
              `paystack_failure_${reference}`, // idempotencyKey
            );
          });

          // WHAT: Notify user of failed transfer
          // WHY: User knows to try again or contact support
          await notifyUser(withdrawal.user_id, {
            type: "withdrawal_failed",
            title: "Withdrawal Failed",
            body: `Your withdrawal of ₦${(withdrawal.amount_kobo / 100).toLocaleString()} failed. Funds have been refunded to your wallet. Reason: ${transferData.reason || "Unknown"}`,
            taskId: undefined,
            conversationId: undefined,
            actorId: undefined,
          });

          console.log(
            `[Paystack Webhook] Transfer ${reference} failed - ${transferData.reason}`,
          );
        } catch (error) {
          console.error(
            "[Paystack Webhook] Error processing transfer.failed:",
            error,
          );
        }
      }

      // WHAT: Always return 200 to Paystack
      // WHY: Prevent Paystack from retrying webhooks on our errors
      return void res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("[Paystack Webhook] Unexpected error:", error);
      // WHAT: Always return 200
      // WHY: Webhook has been received, errors are logged
      return void res.status(200).json({ status: "ok" });
    }
  },
);

// WHAT: Monnify webhook handler
// WHY: Process successful bank transfers to virtual accounts
router.post(
  "/webhooks/monnify",
  rawBodyMiddleware,
  async (req: Request, res: Response) => {
    try {
      // WHAT: Extract signature header
      // WHY: Verify webhook authenticity
      const signature = (req.headers["monnify-signature"] ||
        req.headers["x-monnify-signature"]) as string;

      // WHAT: Parse payload
      // WHY: Pass to monnify service for processing
      let payload;
      try {
        payload = JSON.parse(req.body.toString());
      } catch (error) {
        console.error("[Monnify Webhook] Failed to parse JSON:", error);
        return void res.status(200).json({ status: "ok" }); // Still return 200
      }

      // WHAT: Delegate to monnify service
      // WHY: Service handles signature verification and event processing
      const result = await handleMonnifyWebhook(payload, signature || "");

      if (!result.processed) {
        console.warn("[Monnify Webhook]", result.message);
      } else {
        console.log("[Monnify Webhook]", result.message);
      }

      // WHAT: Always return 200
      // WHY: Prevent Monnify retries, errors are logged
      return void res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("[Monnify Webhook] Unexpected error:", error);
      // WHAT: Always return 200
      // WHY: Webhook received successfully even if processing failed
      return void res.status(200).json({ status: "ok" });
    }
  },
);

export default router;
