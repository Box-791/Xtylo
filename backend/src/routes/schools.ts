import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /schools
 */
router.get("/", async (_req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
  });
  res.json(schools);
});

/**
 * POST /schools
 * Body: { name, city?, state? }
 */
router.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const cityRaw = req.body?.city;
    const stateRaw = req.body?.state;

    const city = cityRaw !== undefined && cityRaw !== null ? String(cityRaw).trim() : null;
    const state = stateRaw !== undefined && stateRaw !== null ? String(stateRaw).trim() : null;

    if (!name) {
      return res.status(400).json({ error: "School name is required" });
    }

    // Optional: prevent obvious duplicates (same name/city/state ignoring case)
    const existing = await prisma.school.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        city: city ? { equals: city, mode: "insensitive" } : city === null ? null : undefined,
        state: state ? { equals: state, mode: "insensitive" } : state === null ? null : undefined,
      },
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const created = await prisma.school.create({
      data: {
        name,
        city,
        state,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create school" });
  }
});

/**
 * DELETE /schools/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Block delete if students exist for this school
    const count = await prisma.student.count({ where: { schoolId: id } });
    if (count > 0) {
      return res.status(400).json({ error: "Cannot delete school with students" });
    }

    await prisma.school.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete school" });
  }
});

export default router;
