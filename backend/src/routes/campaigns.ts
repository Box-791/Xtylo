import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Get all campaigns
router.get("/", async (_req, res) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(campaigns);
});

// Create campaign
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Name required" });
  }

  const campaign = await prisma.campaign.create({
    data: { name: String(name).trim() },
  });

  res.status(201).json(campaign);
});

// Activate campaign (only one active)
router.post("/:id/activate", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  await prisma.campaign.updateMany({
    data: { isActive: false },
  });

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { isActive: true },
  });

  res.json(campaign);
});

// Deactivate all campaigns
router.post("/deactivate", async (_req, res) => {
  await prisma.campaign.updateMany({
    data: { isActive: false },
  });
  res.json({ ok: true });
});

// Get active campaign
router.get("/active", async (_req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { isActive: true },
  });

  if (!campaign) {
    return res.status(404).json({ error: "No active campaign" });
  }

  res.json(campaign);
});

// Delete campaign
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  // Prevent deleting active campaign (safe rule)
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  if (campaign.isActive) {
    return res.status(400).json({ error: "Deactivate campaign before deleting it" });
  }

  await prisma.campaign.delete({ where: { id } });
  res.status(204).end();
});

export default router;
