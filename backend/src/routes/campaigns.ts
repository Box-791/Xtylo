import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { startDate: "desc" },
  });

  res.json(campaigns);
});

export default router;
