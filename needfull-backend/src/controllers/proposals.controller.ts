// WHAT: Proposals controller — budget negotiation endpoints
// WHY: Thin HTTP layer delegating to proposal.service (all financial
//      calculations happen server-side; the client only ever sends the
//      proposed amount and reason)

import { Request, Response } from "express";
import {
  createProposal,
  acceptProposal,
  rejectProposal,
  cancelProposal,
  fundProposal,
  listProposals,
} from "../services/proposal.service";

export async function createProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await createProposal({
      taskId: req.params.taskId,
      userId: req.user!.id,
      amountNaira: req.body.amount,
      reason: req.body.reason,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create proposal";
    console.error("[Proposals] createProposalHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function listProposalsHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await listProposals(req.params.taskId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    const msg = error instanceof Error ? error.message : "Failed to fetch proposals";
    res.status(400).json({ success: false, message: msg });
  }
}

export async function acceptProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await acceptProposal(req.params.proposalId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to accept proposal";
    console.error("[Proposals] acceptProposalHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function rejectProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await rejectProposal(req.params.proposalId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reject proposal";
    console.error("[Proposals] rejectProposalHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function cancelProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await cancelProposal(req.params.proposalId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to cancel proposal";
    console.error("[Proposals] cancelProposalHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function fundProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await fundProposal(req.params.proposalId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Funding failed";
    console.error("[Proposals] fundProposalHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}