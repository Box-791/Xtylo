import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

function csvEscape(value: any) {
  // Avoid replaceAll (older TS target issue). Use replace with regex instead.
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

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
 * GET /students/export/csv
 * Optional filters: schoolId, campaignId
 *
 * IMPORTANT: must be above /:id routes
 */
router.get("/export/csv", async (req, res) => {
  const { schoolId, campaignId } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
    },
    include: { school: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "School",
    "Campaign",
    "Created At",
  ].map(csvEscape).join(",");

  const rows = students.map((s) =>
    [
      s.firstName,
      s.lastName,
      s.email ?? "",
      s.phone ?? "",
      s.school?.name ?? "",
      s.campaign?.name ?? "",
      s.createdAt?.toISOString?.() ?? "",
    ].map(csvEscape).join(",")
  );

  res.header("Content-Type", "text/csv");
  res.attachment("students.csv");
  res.send([header, ...rows].join("\n"));
});

/**
 * POST /students
 * Used by PUBLIC intake (kiosk)
 * campaignId is assigned automatically from active campaign
 */
router.post("/", async (req, res) => {
  const { firstName, lastName, email, phone, schoolId } = req.body;

  if (!firstName || !lastName || !schoolId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const activeCampaign = await prisma.campaign.findFirst({
    where: { isActive: true },
  });

  if (!activeCampaign) {
    return res.status(400).json({ error: "No active campaign" });
  }

  const student = await prisma.student.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      schoolId: Number(schoolId),
      campaignId: activeCampaign.id,
    },
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
  const { firstName, lastName, email, phone } = req.body;

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName: firstName ? String(firstName).trim() : undefined,
      lastName: lastName ? String(lastName).trim() : undefined,
      email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
      phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
    },
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
