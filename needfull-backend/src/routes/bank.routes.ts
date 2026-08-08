// WHAT: Bank routes — account number resolution for the withdraw form
// WHY: Auto-fill account name via Paystack before submitting a withdrawal

import { Router } from "express";
import { query } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { resolveBankAccount } from "../controllers/wallet.controller";

const router = Router();
router.use(authenticate);

router.get("/resolve",
  query("accountNumber").trim().isLength({ min: 10, max: 10 }),
  query("bankCode").trim().notEmpty(),
  validate,
  resolveBankAccount,
);

export default router;