// WHAT: Withdrawal controller — request and list withdrawals
// WHY: Encapsulates Paystack transfer creation and withdrawal request tracking

import { Request, Response } from "express";
import db, { withTransaction } from "../config/db";
import { v4 as uuidv4 } from "uuid";
import { WITHDRAWAL_FEE_KOBO } from "../config/constants";

// WHAT: Request withdrawal — debit wallet, create Paystack recipient & transfer, log request
export async function requestWithdrawal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { amountNaira, accountNumber, bankCode, bankName } = req.body;
    const amountKobo = Math.floor(amountNaira * 100);
    const totalDebit = amountKobo + WITHDRAWAL_FEE_KOBO;

    const walletResult = await db.query<any>("SELECT id, balance_kobo FROM wallets WHERE user_id = $1", [userId]);
    if (walletResult.rows.length === 0) { res.status(404).json({ success: false, message: "Wallet not found" }); return; }
    if (walletResult.rows[0].balance_kobo < totalDebit) { res.status(400).json({ success: false, message: `Insufficient balance. Need ₦${(totalDebit / 100).toFixed(2)} including ₦${(WITHDRAWAL_FEE_KOBO / 100).toFixed(2)} fee` }); return; }

    const { resolveAccountNumber, createTransferRecipient, initiateTransfer } = await import("../services/paystack.service");

    // WHAT: Resolve account
    const resolvedName = await resolveAccountNumber(accountNumber, bankCode);
    if (!resolvedName) { res.status(400).json({ success: false, message: "Could not verify account number. Check and try again." }); return; }

    const withdrawalId = uuidv4();

    await withTransaction(async (client) => {
      const { debitWallet } = await import("../services/wallet.service.js");
      await debitWallet(
        client,
        userId,
        totalDebit,
        "withdrawal",
        `Withdrawal to ${bankName} ${accountNumber}`
      );

      // WHAT: Create recipient on Paystack
      const rc = await createTransferRecipient({ name: resolvedName, accountNumber, bankCode });
      if (!rc) throw new Error("Failed to create transfer recipient");

      // WHAT: Initiate transfer
      const tr = await initiateTransfer({ amountKobo, recipientCode: rc.recipientCode, reference: withdrawalId, reason: "NeedFull withdrawal" });
      if (!tr) throw new Error("Failed to initiate transfer");

      // WHAT: Insert withdrawal request
      await client.query(
        "INSERT INTO withdrawal_requests (id, user_id, amount_kobo, fee_kobo, account_number, bank_code, bank_name, account_name, recipient_code, transfer_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'processing', NOW(), NOW())",
        [withdrawalId, userId, amountKobo, WITHDRAWAL_FEE_KOBO, accountNumber, bankCode, bankName, resolvedName, rc, tr.transferCode || ""],
      );
    });

    res.json({ success: true, message: "Withdrawal initiated. Funds will arrive in 1-2 business days.", data: { withdrawalId, amount: { kobo: amountKobo, naira: amountNaira }, fee: { kobo: WITHDRAWAL_FEE_KOBO, naira: WITHDRAWAL_FEE_KOBO / 100 }, accountName: resolvedName } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to process withdrawal";
    console.error("[Withdrawal] requestWithdrawal error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: Get user's withdrawal history
export async function getMyWithdrawals(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;

    const [result, countRes] = await Promise.all([
      db.query<any>(
        "SELECT id, amount_kobo, fee_kobo, account_number, bank_code, bank_name, account_name, status, created_at FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [req.user!.id, perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM withdrawal_requests WHERE user_id = $1", [req.user!.id]),
    ]);

    const total = parseInt(countRes.rows[0]?.count || "0", 10);
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, amount: { kobo: r.amount_kobo, naira: r.amount_kobo / 100 }, fee: { kobo: r.fee_kobo, naira: r.fee_kobo / 100 }, accountNumber: r.account_number, bankCode: r.bank_code, bankName: r.bank_name, accountName: r.account_name, status: r.status, createdAt: r.created_at })), pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } });
  } catch (error) {
    console.error("[Withdrawal] getMyWithdrawals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
}
