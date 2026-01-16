import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
  });

  res.json(schools);
});

export default router;
