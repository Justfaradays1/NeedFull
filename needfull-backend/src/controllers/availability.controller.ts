// WHAT: Availability controller — CRUD + discovery for runner availability posts
// WHY: Runners publish what they can help with; posters discover them nearby

import { Request, Response } from "express";
import {
  createAvailability,
  listMyAvailability,
  deactivateAvailability,
  listAvailability,
} from "../services/availability.service";

export async function listHandler(req: Request, res: Response): Promise<void> {
  try {
    const items = await listAvailability({
      categoryId: req.query.categoryId as string | undefined,
      runnerId: req.query.runnerId as string | undefined,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radiusMeters: req.query.radiusMeters
        ? parseFloat(req.query.radiusMeters as string)
        : undefined,
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("[Availability] listHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch availability" });
  }
}

export const mineHandler = async (req: Request, res: Response) => {
  try {
    const data = await listMyAvailability(req.user!.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error("[Availability] mineHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your offers" });
  }
};

export const createHandler = async (req: Request, res: Response) => {
  try {
    const data = await createAvailability(req.user!.id, {
      categoryId: req.body.categoryId,
      note: req.body.note,
      availableUntil: req.body.availableUntil,
      maxTravelKm: req.body.maxTravelKm,
      isOnlineToday: req.body.isOnlineToday,
      lat: req.body.lat,
      lng: req.body.lng,
      locationLabel: req.body.locationLabel,
    });
    res.status(201).json({ success: true, message: "You're now available", data });
  } catch (error) {
    console.error("[Availability] createHandler error:", error);
    res.status(400).json({ success: false, message: "Failed to create offer" });
  }
};

export async function deactivateHandler(req: Request, res: Response): Promise<void> {
  try {
    const ok = await deactivateAvailability(req.user!.id, req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }
    res.json({ success: true, message: "Offer ended" });
  } catch (error) {
    console.error("[Availability] deactivateHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to end offer" });
  }
}