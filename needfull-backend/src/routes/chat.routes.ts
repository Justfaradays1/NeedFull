// WHAT: Chat routes — conversations and messages
// WHY: Real-time and RESTful messaging between task participants

import { Router } from "express";
import { body, query, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as chat from "../controllers/chat.controller";

const router = Router();
router.use(authenticate);

router.get("/conversations", chat.listConversations);

router.post("/conversations",
  body("otherUserId").isUUID(),
  validate,
  chat.getOrCreateConversation,
);

router.get("/conversations/:id/messages",
  param("id").isUUID(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt().default(50),
  validate,
  chat.getMessages,
);

router.post("/conversations/:id/messages",
  param("id").isUUID(),
  body("content").trim().isLength({ min: 1, max: 2000 }),
  validate,
  chat.sendMessage,
);

router.post("/conversations/:id/read",
  param("id").isUUID(), validate,
  chat.markConversationRead,
);

export default router;
