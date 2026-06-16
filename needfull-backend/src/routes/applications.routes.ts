// WHAT: Applications routes — apply, manage, counter, withdraw
// WHY: Task application lifecycle endpoints

import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as applications from "../controllers/applications.controller";

const router = Router();
router.use(authenticate);

router.post("/",
  body("taskId").isUUID(),
  body("message").optional().trim().isLength({ min: 10, max: 500 }),
  body("proposedAmountNaira").optional().isFloat({ min: 50 }),
  validate,
  applications.applyHandler,
);

router.get("/me", applications.getMyApplications);

router.post("/:applicationId/accept",
  param("applicationId").isUUID(), validate,
  applications.acceptApplicationHandler,
);

router.post("/:applicationId/reject",
  param("applicationId").isUUID(), validate,
  applications.rejectApplicationHandler,
);

router.post("/:applicationId/withdraw",
  param("applicationId").isUUID(), validate,
  applications.withdrawApplication,
);

router.post("/:applicationId/counter",
  param("applicationId").isUUID(),
  body("counterAmountNaira").isFloat({ min: 50 }),
  validate,
  applications.counterOfferHandler,
);

router.post("/:applicationId/accept-counter",
  param("applicationId").isUUID(), validate,
  applications.acceptCounterOfferHandler,
);

export default router;
