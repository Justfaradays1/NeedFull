// WHAT: Notifications routes — list, unread count, mark read
// WHY: In-app notification management

import { Router } from "express";
import { param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as notifications from "../controllers/notifications.controller";

const router = Router();
router.use(authenticate);

router.get("/", notifications.list as any);
router.get("/unread-count", notifications.unreadCount as any);
router.post("/read-all", notifications.markAllRead as any);
router.post("/:id/read", param("id").isUUID(), validate, notifications.markRead as any);
router.delete("/:id", param("id").isUUID(), validate, notifications.remove as any);

export default router;
