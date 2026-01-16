import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

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

router.post("/", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    schoolId,
    campaignId,
  } = req.body;

  if (!firstName || !lastName || !schoolId || !campaignId) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        schoolId: Number(schoolId),
        campaignId: Number(campaignId),
      },
      include: {
        school: true,
        campaign: true,
      },
    });

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create student" });
  }
});


export default router;
