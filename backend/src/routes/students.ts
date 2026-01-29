import { Router } from "express";
import { prisma } from "../lib/prisma";
import type { AreaOfInterest } from "@prisma/client";

const router = Router();

function csvEscape(value: any) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function parseBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return undefined;

  const t = v.trim().toLowerCase();
  if (t === "true" || t === "1" || t === "yes") return true;
  if (t === "false" || t === "0" || t === "no") return false;
  return undefined;
}

function parseAreaOfInterest(v: unknown): AreaOfInterest | undefined {
  if (!v || typeof v !== "string") return undefined;
  const t = v.trim().toUpperCase();

  if (t === "COSMETOLOGY" || t === "BARBER" || t === "NAIL_TECHNICIAN") {
    return t as AreaOfInterest;
  }
  return undefined;
}

/**
 * GET /students
 * Optional filters: schoolId, campaignId, areaOfInterest, contacted, visitCompleted
 */
router.get("/", async (req, res) => {
  const { schoolId, campaignId, areaOfInterest, contacted, visitCompleted } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
      areaOfInterest: parseAreaOfInterest(areaOfInterest),
      contacted: parseBool(contacted),
      visitCompleted: parseBool(visitCompleted),
    },
    include: { school: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(students);
});

/**
 * GET /students/export/csv
 * Optional filters: schoolId, campaignId, areaOfInterest, contacted, visitCompleted
 *
 * IMPORTANT: must be above /:id routes
 */
router.get("/export/csv", async (req, res) => {
  const { schoolId, campaignId, areaOfInterest, contacted, visitCompleted } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
      areaOfInterest: parseAreaOfInterest(areaOfInterest),
      contacted: parseBool(contacted),
      visitCompleted: parseBool(visitCompleted),
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
    "Contacted",
    "Contacted At",
    "Had Visit",
    "Visit Completed At",
    "Created At",
  ].map(csvEscape).join(",");

  const rows = students.map((s) =>
    [
      s.firstName,
      s.lastName,
      s.email ?? "",
      s.phone ?? "",
      s.areaOfInterest ?? "",
      s.school?.name ?? "",
      s.campaign?.name ?? "",
      s.contacted ? "YES" : "NO",
      s.contactedAt ? s.contactedAt.toISOString() : "",
      s.visitCompleted ? "YES" : "NO",
      s.visitCompletedAt ? s.visitCompletedAt.toISOString() : "",
      s.createdAt?.toISOString?.() ?? "",
    ].map(csvEscape).join(",")
  );

  res.header("Content-Type", "text/csv");
  res.attachment("students.csv");
  res.send([header, ...rows].join("\n"));
});

/**
 * POST /students
 * Public intake (kiosk). campaignId is assigned automatically from active campaign.
 * Requires: firstName, lastName, schoolId AND (email OR phone)
 */
router.post("/", async (req, res) => {
  const { firstName, lastName, email, phone, schoolId, areaOfInterest } = req.body;

  if (!firstName || !lastName || !schoolId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const emailClean = email ? String(email).trim() : "";
  const phoneClean = phone ? String(phone).trim() : "";

  if (!emailClean && !phoneClean) {
    return res.status(400).json({ error: "Email or phone is required" });
  }

  const activeCampaign = await prisma.campaign.findFirst({
    where: { isActive: true },
  });

  if (!activeCampaign) {
    return res.status(400).json({ error: "No active campaign" });
  }

  const interest = parseAreaOfInterest(areaOfInterest) ?? "COSMETOLOGY";

  const student = await prisma.student.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: emailClean ? emailClean : null,
      phone: phoneClean ? phoneClean : null,
      schoolId: Number(schoolId),
      campaignId: activeCampaign.id,
      areaOfInterest: interest,
      contacted: false,
      visitCompleted: false,
    },
    include: { school: true, campaign: true },
  });

  res.status(201).json(student);
});

/**
 * PUT /students/:id
 * Admin updates (including lifecycle flags).
 */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const {
    firstName,
    lastName,
    email,
    phone,
    schoolId,
    areaOfInterest,
    contacted,
    visitCompleted,
  } = req.body;

  const data: any = {
    firstName: firstName !== undefined ? String(firstName).trim() : undefined,
    lastName: lastName !== undefined ? String(lastName).trim() : undefined,
    email: email !== undefined ? (String(email).trim() ? String(email).trim() : null) : undefined,
    phone: phone !== undefined ? (String(phone).trim() ? String(phone).trim() : null) : undefined,
    schoolId: schoolId !== undefined ? Number(schoolId) : undefined,
    areaOfInterest:
      areaOfInterest !== undefined ? (parseAreaOfInterest(areaOfInterest) ?? undefined) : undefined,
  };

  if (contacted !== undefined) {
    const next = Boolean(contacted);
    data.contacted = next;
    data.contactedAt = next ? new Date() : null;
  }

  if (visitCompleted !== undefined) {
    const next = Boolean(visitCompleted);
    data.visitCompleted = next;
    data.visitCompletedAt = next ? new Date() : null;
  }

  const student = await prisma.student.update({
    where: { id },
    data,
    include: { school: true, campaign: true },
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
