// WHAT: Purchase controller — thin handlers for purchase escrow endpoints
// WHY: Delegates to purchase.service for business logic, formats response consistently

import { Request, Response } from "express";
import * as purchaseService from "../services/purchase.service";
import { uploadReceipt as uploadReceiptToCloudinary, uploadImage } from "../services/cloudinary.service";

export async function createPurchaseHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.createPurchaseTask(req.user!.id, {
      categoryId: req.body.categoryId,
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline,
      isUrgent: req.body.isUrgent,
      locationLabel: req.body.locationLabel,
      lat: req.body.lat,
      lng: req.body.lng,
      estimatedItemCostNaira: req.body.estimatedItemCostNaira,
      runnerFeeNaira: req.body.runnerFeeNaira,
      maxAdditionalSpendingNaira: req.body.maxAdditionalSpendingNaira || 0,
      storeName: req.body.storeName,
    });
    res.status(201).json({ success: true, message: "Purchase task created", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create purchase task";
    console.error("[Purchase] createPurchaseHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function fundPurchaseHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.fundPurchaseTask(req.user!.id, req.params.taskId);
    res.json({ success: true, message: "Payment secured in escrow", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fund purchase task";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function acceptPurchaseHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.acceptPurchaseTask(req.user!.id, req.params.taskId);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to accept purchase task";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.updatePurchaseStatus(req.params.taskId, req.user!.id, req.body.status);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update status";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function uploadReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    let receiptUrl = req.body.receiptUrl;
    if (req.file) {
      receiptUrl = await uploadReceiptToCloudinary(req.file.buffer);
    }
    if (!receiptUrl) {
      res.status(400).json({ success: false, message: "Receipt image is required" });
      return;
    }
    const result = await purchaseService.uploadReceipt(
      req.params.taskId,
      req.user!.id,
      req.body.receiptAmountNaira,
      receiptUrl,
      req.body.notes,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to upload receipt";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function generateOTPHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.generateDeliveryOTP(req.params.taskId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate OTP";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function verifyOTPHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.verifyDeliveryOTP(req.params.taskId, req.user!.id, req.body.otp);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "OTP verification failed";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function confirmDeliveryHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.confirmDelivery(req.params.taskId, req.user!.id);
    res.json({ success: true, message: "Delivery confirmed, payment released", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to confirm delivery";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function openDisputeHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.openDispute(
      req.params.taskId,
      req.user!.id,
      req.body.reason,
      req.body.description,
    );
    res.status(201).json({ success: true, message: "Dispute opened", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to open dispute";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function uploadDisputeEvidenceHandler(req: Request, res: Response): Promise<void> {
  try {
    let fileUrl = req.body.fileUrl;
    if (req.file) {
      fileUrl = await uploadImage(req.file.buffer, "needfull/dispute-evidence");
    }
    if (!fileUrl) {
      res.status(400).json({ success: false, message: "Evidence file is required" });
      return;
    }
    const result = await purchaseService.uploadDisputeEvidence(
      req.params.disputeId,
      req.user!.id,
      fileUrl,
      req.body.description,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to upload evidence";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function approveBudgetHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.approveBudget(req.params.approvalId, req.user!.id);
    res.json({ success: true, message: "Budget approved", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to approve budget";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function rejectBudgetHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.rejectBudget(req.params.approvalId, req.user!.id);
    res.json({ success: true, message: "Budget rejected", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reject budget";
    res.status(400).json({ success: false, message: msg });
  }
}

// Admin endpoints
export async function getEscrowStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await purchaseService.getEscrowStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("[Purchase] getEscrowStatsHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch escrow stats" });
  }
}

export async function listPurchaseTasksHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.listPurchaseTasks({
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      perPage: req.query.perPage ? parseInt(req.query.perPage as string) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("[Purchase] listPurchaseTasksHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch purchase tasks" });
  }
}

export async function getPurchaseDetailHandler(req: Request, res: Response): Promise<void> {
  try {
    const detail = await purchaseService.getPurchaseDetail(req.params.taskId);
    res.json({ success: true, data: detail });
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    console.error("[Purchase] getPurchaseDetailHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch purchase detail" });
  }
}

export async function resolveDisputeHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await purchaseService.resolveDispute(
      req.params.disputeId,
      req.user!.id,
      req.body.resolution,
      req.body.notes,
    );
    res.json({ success: true, message: "Dispute resolved", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resolve dispute";
    res.status(400).json({ success: false, message: msg });
  }
}
