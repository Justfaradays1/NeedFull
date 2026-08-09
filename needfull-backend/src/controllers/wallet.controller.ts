// WHAT: Wallet controller — balance, transactions, funding (manual/virtual/card), withdrawals
// WHY: Wraps wallet services with consistent error handling and response formatting
// FUTURE: Add real-time balance via Socket.io

import { Request, Response } from "express";
import db, { withTransaction } from "../config/db";
import { getWallet, creditWallet } from "../services/wallet.service";
import { submitManualTransfer } from "../services/manualTransfer.service";
import { getOrCreateVirtualAccount } from "../services/monnify.service";
import { initializeTransaction, verifyTransaction, resolveAccountNumber } from "../services/paystack.service";

export async function getWalletHandler(req: Request, res: Response): Promise<void> {
  try {
    const wallet = await getWallet(req.user!.id);
    let virtualAccount = null;
    try {
      const { getUserVirtualAccount } = await import("../services/monnify.service");
      virtualAccount = await getUserVirtualAccount(req.user!.id);
    } catch { /* optional */ }
    res.json({ success: true, data: { id: wallet.id, balance: { kobo: wallet.balance_kobo, naira: wallet.balance_naira }, escrow: { kobo: wallet.escrow_kobo, naira: wallet.escrow_naira }, earnings: { kobo: wallet.earnings_kobo, naira: wallet.earnings_naira }, pending: { kobo: wallet.pending_kobo, naira: wallet.pending_naira }, virtualAccount: virtualAccount ? { accountNumber: virtualAccount.account_number, bankName: virtualAccount.bank_name, accountName: virtualAccount.account_name } : null } });
  } catch (error) {
    console.error("[Wallet] getWalletHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wallet" });
  }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;

    const wallet = await db.query<any>("SELECT id FROM wallets WHERE user_id = $1", [req.user!.id]);
    if (wallet.rows.length === 0) { res.status(404).json({ success: false, message: "Wallet not found" }); return; }

    const [txns, countRes] = await Promise.all([
      db.query<any>(
        `SELECT wt.id, wt.type, wt.amount AS amount_kobo, wt.balance_before AS balance_before_kobo, wt.balance_after AS balance_after_kobo, wt.task_id, wt.note, wt.created_at, t.title as task_title
         FROM wallet_transactions wt LEFT JOIN tasks t ON wt.task_id = t.id
         WHERE wt.wallet_id = $1 ORDER BY wt.created_at DESC LIMIT $2 OFFSET $3`,
        [wallet.rows[0].id, perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM wallet_transactions WHERE wallet_id = $1", [wallet.rows[0].id]),
    ]);

    const total = parseInt(countRes.rows[0]?.count || "0", 10);
    res.json({
      success: true,
      data: txns.rows.map((tx: any) => ({ id: tx.id, type: tx.type, amount: { kobo: Number(tx.amount_kobo), naira: Number(tx.amount_kobo) / 100 }, balanceBefore: { kobo: Number(tx.balance_before_kobo), naira: Number(tx.balance_before_kobo) / 100 }, balanceAfter: { kobo: Number(tx.balance_after_kobo), naira: Number(tx.balance_after_kobo) / 100 }, taskId: tx.task_id, taskTitle: tx.task_title, note: tx.note, createdAt: tx.created_at })),
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    console.error("[Wallet] getTransactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
}

export async function submitManualTransferHandler(req: Request, res: Response): Promise<void> {
  try {
    const transfer = await submitManualTransfer(req.user!.id, req.body);
    res.status(201).json({ success: true, message: "Transfer submitted. Admin will verify within 1-2 hours on business days.", data: { transferId: transfer.id, status: transfer.status, amount: { kobo: transfer.amount_kobo, naira: transfer.amount_naira }, bankReference: transfer.bank_reference, createdAt: transfer.created_at } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit transfer";

    // WHAT: Known business-rule failures → meaningful 4xx responses (safe to show users)
    // WHY: Duplicate submissions and amount rejections are expected flows, not server faults
    if (msg.includes("already pending or confirmed")) {
      res.status(409).json({ success: false, message: msg });
      return;
    }
    if (msg.includes("Amount must be greater than")) {
      res.status(400).json({ success: false, message: msg });
      return;
    }

    // WHAT: Unexpected/system errors (DB failures, email failures, etc.) → 500, never leak internals
    // WHY: A server fault is not a user-input problem; users get a generic message, devs get the full log
    console.error("[Wallet] submitManualTransferHandler error:", {
      userId: req.user?.id,
      body: req.body,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
    });
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting your transfer. Please try again in a moment.",
    });
  }
}

export async function getMyPendingManualTransfers(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>(
      "SELECT id, amount_kobo, bank_reference, sender_bank, sender_name, status, created_at FROM manual_transfers WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC",
      [req.user!.id],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, amount: { kobo: r.amount_kobo, naira: r.amount_kobo / 100 }, bankReference: r.bank_reference, senderBank: r.sender_bank, senderName: r.sender_name, status: r.status, createdAt: r.created_at })) });
  } catch (error) {
    console.error("[Wallet] getMyPendingManualTransfers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending transfers" });
  }
}

export async function getOrCreateVirtualAccountHandler(req: Request, res: Response): Promise<void> {
  try {
    const account = await getOrCreateVirtualAccount(req.user!.id, req.user!.email, req.user!.fullName || "");
    res.json({ success: true, data: { method: "virtual_account", virtualAccount: { accountNumber: account.accountNumber, bankName: account.bankName, accountName: account.accountName, description: "Use this account to transfer funds via your bank" }, fallback: { method: "manual_transfer", bankAccount: { accountNumber: process.env.NEEDFULL_BANK_ACCOUNT_NUMBER, bankCode: process.env.NEEDFULL_BANK_CODE, description: "Or transfer directly and submit reference for manual verification" } } } });
  } catch (error) {
    console.error("[Wallet] getOrCreateVirtualAccountHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to get virtual account" });
  }
}

export async function initiateCardPayment(req: Request, res: Response): Promise<void> {
  try {
    const amountKobo = Math.floor(req.body.amountNaira * 100);
    const reference = `DEP_${req.user!.id}_${Date.now()}`;
    const transaction = await initializeTransaction({ email: req.user!.email, amountKobo, reference, callbackUrl: req.body.callbackUrl, metadata: { userId: req.user!.id, purpose: "wallet_deposit", amountNaira: req.body.amountNaira } });
    res.json({ success: true, data: { authorizationUrl: transaction.authorizationUrl, reference: transaction.reference, accessCode: transaction.accessCode, amountNaira: req.body.amountNaira } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to initiate payment";
    console.error("[Wallet] initiateCardPayment error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function verifyCardPayment(req: Request, res: Response): Promise<void> {
  try {
    const { reference } = req.params;
    const userId = req.user!.id;
    const transaction = await verifyTransaction(reference);

    const existing = await db.query("SELECT id FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND reference = $2", [userId, reference]);
    if (existing.rows.length > 0) { res.status(400).json({ success: false, message: "This payment has already been processed" }); return; }
    if (transaction.status !== "success") { res.status(400).json({ success: false, message: `Payment status is ${transaction.status}. Expected success.` }); return; }

    const result = await withTransaction(async (client) => creditWallet(client, userId, transaction.amountKobo, "card_deposit", "Card payment deposit", reference, reference));
    res.json({ success: true, message: `₦${transaction.amountKobo / 100} added to your wallet`, data: { balance: { kobo: Number(result.balance_kobo), naira: Number(result.balance_kobo) / 100 } } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("[Wallet] verifyCardPayment error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: Resolve bank account number → account holder name (Paystack)
// WHY: Withdraw form auto-fills the account name before submission
export async function resolveBankAccount(req: Request, res: Response): Promise<void> {
  try {
    const { accountNumber, bankCode } = req.query;
    if (!accountNumber || !bankCode) {
      res.status(400).json({ success: false, message: "accountNumber and bankCode are required" });
      return;
    }

    const resolved = await resolveAccountNumber(String(accountNumber), String(bankCode));
    if (!resolved.name) {
      res.status(400).json({
        success: false,
        message: resolved.reason || "Could not verify account number. Check and try again.",
      });
      return;
    }

    res.json({ success: true, data: { accountName: resolved.name } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resolve account";
    console.error("[Wallet] resolveBankAccount error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}
