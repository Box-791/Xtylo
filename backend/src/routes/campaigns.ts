import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminPin } from "../middleware/adminPin";

const router = Router();

/**
 * PUBLIC: Get active campaign
 * GET /campaigns/active
 */
router.get("/active", async (_req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) return res.status(404).json({ error: "No active campaign" });
  res.json(campaign);
});

/**
 * ADMIN: Get all campaigns
 * GET /campaigns
 */
router.get("/", requireAdminPin, async (_req, res) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(campaigns);
});

/**
 * ADMIN: Create campaign
 * POST /campaigns
 */
router.post("/", requireAdminPin, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name required" });
  }

  const campaign = await prisma.campaign.create({
    data: { name: name.trim() },
  });

  res.status(201).json(campaign);
});

/**
 * ADMIN: Activate campaign (only one active)
 * POST /campaigns/:id/activate
 */
router.post("/:id/activate", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid campaign id" });

  await prisma.campaign.updateMany({ data: { isActive: false } });

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { isActive: true },
  });

  res.json(campaign);
});

/**
 * ADMIN: Deactivate a single campaign
 * POST /campaigns/:id/deactivate
 */
router.post("/:id/deactivate", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid campaign id" });

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { isActive: false },
  });

  res.json(campaign);
});

/**
 * ADMIN: Deactivate all campaigns
 * POST /campaigns/deactivate
 */
router.post("/deactivate", requireAdminPin, async (_req, res) => {
  await prisma.campaign.updateMany({ data: { isActive: false } });
  res.json({ ok: true });
});

/**
 * ADMIN: Delete campaign
 * DELETE /campaigns/:id
 *
 * Safety: we do NOT delete if students exist in campaign.
 */
router.delete("/:id", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid campaign id" });

  const count = await prisma.student.count({ where: { campaignId: id } });
  if (count > 0) {
    return res.status(409).json({
      error:
        "Cannot delete campaign because it has students. Export data first or create a new campaign.",
    });
  }

  await prisma.campaign.delete({ where: { id } });
  res.status(204).end();
});

export default router;
