import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

function csvEscape(value: any) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /students
 * Optional filters: schoolId, campaignId, areaOfInterest
 */
router.get("/", async (req, res) => {
  const { schoolId, campaignId, areaOfInterest } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
      areaOfInterest: areaOfInterest ? String(areaOfInterest) : undefined,
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
 * GET /students/export/csv
 * Optional filters: schoolId, campaignId, areaOfInterest
 *
 * IMPORTANT: must be above /:id routes
 */
router.get("/export/csv", async (req, res) => {
  const { schoolId, campaignId, areaOfInterest } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
      areaOfInterest: areaOfInterest ? String(areaOfInterest) : undefined,
    },
    include: { school: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Area Of Interest",
    "School",
    "Campaign",
    "Created At",
  ]
    .map(csvEscape)
    .join(",");

  const rows = students.map((s: any) =>
    [
      s.firstName,
      s.lastName,
      s.email ?? "",
      s.phone ?? "",
      s.areaOfInterest ?? "",
      s.school?.name ?? "",
      s.campaign?.name ?? "",
      s.createdAt?.toISOString?.() ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );

  res.header("Content-Type", "text/csv");
  res.attachment("students.csv");
  res.send([header, ...rows].join("\n"));
});

/**
 * POST /students
 * Used by PUBLIC intake (kiosk)
 * campaignId is assigned automatically from active campaign
 *
 * REQUIRED:
 * - firstName, lastName, schoolId
 * - AND (email OR phone) at least one
 */
router.post("/", async (req, res) => {
  const { firstName, lastName, email, phone, schoolId, areaOfInterest, consent } =
    req.body;

  const first = String(firstName ?? "").trim();
  const last = String(lastName ?? "").trim();
  const emailStr = String(email ?? "").trim();
  const phoneStr = String(phone ?? "").trim();

  if (!first || !last || !schoolId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // At least one contact method required
  if (!emailStr && !phoneStr) {
    return res.status(400).json({
      error: "Either email or phone is required",
    });
  }

  const activeCampaign = await prisma.campaign.findFirst({
    where: { isActive: true },
  });

  if (!activeCampaign) {
    return res.status(400).json({ error: "No active campaign" });
  }

  const student = await prisma.student.create({
    data: {
      firstName: first,
      lastName: last,
      email: emailStr ? emailStr : null,
      phone: phoneStr ? phoneStr : null,
      schoolId: Number(schoolId),
      campaignId: activeCampaign.id,
      areaOfInterest: areaOfInterest ? String(areaOfInterest) : null,
      consent: consent === undefined ? null : Boolean(consent),
    } as any,
    include: {
      school: true,
      campaign: true,
    },
  });

  res.status(201).json(student);
});

/**
 * PUT /students/:id
 */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, phone, schoolId, areaOfInterest, consent } =
    req.body;

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName: firstName !== undefined ? String(firstName).trim() : undefined,
      lastName: lastName !== undefined ? String(lastName).trim() : undefined,
      email:
        email !== undefined ? (String(email).trim() ? String(email).trim() : null) : undefined,
      phone:
        phone !== undefined ? (String(phone).trim() ? String(phone).trim() : null) : undefined,
      schoolId: schoolId !== undefined ? Number(schoolId) : undefined,
      areaOfInterest:
        areaOfInterest !== undefined
          ? (String(areaOfInterest).trim() ? String(areaOfInterest).trim() : null)
          : undefined,
      consent: consent !== undefined ? Boolean(consent) : undefined,
    } as any,
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

export default router;
