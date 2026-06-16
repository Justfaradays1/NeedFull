// WHAT: Wallet routes — balance, transactions, funding (manual/virtual/card), withdrawals
// WHY: Financial operation endpoints

import { Router } from "express";
import { body, query, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as wallet from "../controllers/wallet.controller";
import * as withdrawal from "../controllers/withdrawal.controller";

const router = Router();
router.use(authenticate);

router.get("/", wallet.getWalletHandler);

router.get("/transactions",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt().default(20),
  validate,
  wallet.getTransactions,
);

router.post("/fund/manual",
  body("amountNaira").isFloat({ min: 100 }),
  body("bankReference").trim().notEmpty(),
  body("senderBank").trim().notEmpty(),
  body("senderName").trim().notEmpty(),
  body("receiptUrl").optional().isURL(),
  validate,
  wallet.submitManualTransferHandler,
);

router.get("/fund/manual/pending", wallet.getMyPendingManualTransfers);

router.get("/fund/virtual", wallet.getOrCreateVirtualAccountHandler);

router.post("/fund/card/initiate",
  body("amountNaira").isFloat({ min: 100 }),
  body("callbackUrl").isURL(),
  validate,
  wallet.initiateCardPayment,
);

router.post("/fund/card/verify/:reference",
  param("reference").trim().notEmpty(),
  validate,
  wallet.verifyCardPayment,
);

router.post("/withdraw",
  body("amountNaira").isFloat({ min: 100 }),
  body("accountNumber").trim().isLength({ min: 10, max: 10 }),
  body("bankCode").trim().notEmpty(),
  body("bankName").trim().notEmpty(),
  validate,
  withdrawal.requestWithdrawal,
);

router.get("/withdrawals",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt().default(20),
  validate,
  withdrawal.getMyWithdrawals,
);

export default router;
