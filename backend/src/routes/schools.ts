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
 * body: { name: string, city?: string, state?: string }
 */
router.post("/", async (req, res) => {
  try {
    const { name, city, state } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const school = await prisma.school.create({
      data: {
        name: String(name).trim(),
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
      },
    });

    res.status(201).json(school);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create school" });
  }
});

/**
 * PUT /schools/:id
 * body: { name?: string, city?: string|null, state?: string|null }
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { name, city, state } = req.body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        city: city !== undefined ? (city ? String(city).trim() : null) : undefined,
        state: state !== undefined ? (state ? String(state).trim() : null) : undefined,
      },
    });

    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update school" });
  }
});

/**
 * DELETE /schools/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    await prisma.school.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete school" });
  }
});

export default router;
