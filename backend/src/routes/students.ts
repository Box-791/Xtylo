import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /students
 * Optional filters: schoolId, campaignId
 */
router.get("/", async (req, res) => {
  const { schoolId, campaignId } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
    },
    include: {
      school: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(students);
});

/**
 * POST /students
 * Used by PUBLIC intake (iPad)
 */
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, schoolId, campaignId } = req.body;

    if (!firstName || !lastName || !schoolId || !campaignId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        schoolId: Number(schoolId),
        campaignId: Number(campaignId),
      },
    });

    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create student" });
  }
});

/**
 * PUT /students/:id
 */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, phone } = req.body;

  const student = await prisma.student.update({
    where: { id },
    data: { firstName, lastName, email, phone },
  });

  res.json(student);
});

/**
 * DELETE /students/:id
 */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  await prisma.student.delete({ where: { id } });
  res.status(204).end();
});

/**
 * GET /students/export/csv
 */
router.get("/export/csv", async (_req, res) => {
  const students = await prisma.student.findMany({
    include: { school: true, campaign: true },
  });

  const rows = [
    "First Name,Last Name,Email,Phone,School,Campaign",
    ...students.map(
      (s) =>
        `${s.firstName},${s.lastName},${s.email ?? ""},${s.phone ?? ""},${s.school.name},${s.campaign.name}`
    ),
  ];

  res.header("Content-Type", "text/csv");
  res.attachment("students.csv");
  res.send(rows.join("\n"));
});

export default router;
