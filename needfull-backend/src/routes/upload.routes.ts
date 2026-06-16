// WHAT: Upload routes — receipt and image uploads
// WHY: File upload endpoints for wallet receipts and other attachments

import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { uploadReceipt } from "../services/cloudinary.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and HEIC images are allowed"));
  },
});

const router = Router();
router.use(authenticate);

router.post("/receipt", upload.single("receipt"), async (req: any, res: any) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const url = await uploadReceipt(req.file.buffer);
    res.status(201).json({ success: true, message: "Receipt uploaded successfully", data: { url, filename: req.file.originalname, size: req.file.size } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to upload receipt";
    console.error("[Upload] upload receipt error:", error);
    res.status(400).json({ success: false, message: msg });
  }
});

export default router;
