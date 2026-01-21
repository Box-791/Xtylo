import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminPin } from "../middleware/adminPin";

const router = Router();

/**
 * PUBLIC: Get all schools (kiosk needs this)
 * GET /schools
 */
router.get("/", async (_req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
  });
  res.json(schools);
});

/**
 * ADMIN: Create school
 * POST /schools
 */
router.post("/", requireAdminPin, async (req, res) => {
  const { name, city, state } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  const school = await prisma.school.create({
    data: {
      name: name.trim(),
      city: typeof city === "string" && city.trim() ? city.trim() : null,
      state: typeof state === "string" && state.trim() ? state.trim() : null,
    },
  });

  res.status(201).json(school);
});

/**
 * ADMIN: Delete school
 * DELETE /schools/:id
 *
 * Safety: we do NOT delete if students exist in school.
 */
router.delete("/:id", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid school id" });

  const count = await prisma.student.count({ where: { schoolId: id } });
  if (count > 0) {
    return res.status(409).json({
      error: "Cannot delete school because students reference it.",
    });
  }

  await prisma.school.delete({ where: { id } });
  res.status(204).end();
});

export default router;
