import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminPin } from "../middleware/adminPin";
import { publicRateLimit } from "../middleware/publicRateLimit";

const router = Router();

/** ADMIN: list students */
router.get("/", requireAdminPin, async (req, res) => {
  const { schoolId, campaignId } = req.query;

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId ? Number(schoolId) : undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
    },
    include: { school: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(students);
});

/**
 * PUBLIC: create student (kiosk)
 * - campaign is auto-attached
 * - duplicate prevention inside active campaign
 * - basic rate limiting
 */
router.post("/", publicRateLimit, async (req, res) => {
  const { firstName, lastName, email, phone, schoolId, consent } = req.body;

  if (!firstName || !lastName || !schoolId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const activeCampaign = await prisma.campaign.findFirst({ where: { isActive: true } });
  if (!activeCampaign) {
    return res.status(400).json({ error: "No active campaign" });
  }

  const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : undefined;
  const phoneNorm = typeof phone === "string" ? phone.replace(/[^\d]/g, "").slice(0, 15) : undefined;

  // must have at least one contact method
  if (!emailNorm && !phoneNorm) {
    return res.status(400).json({ error: "Please provide email or phone." });
  }

  // duplicate prevention within active campaign
  const existing = await prisma.student.findFirst({
    where: {
      campaignId: activeCampaign.id,
      OR: [
        emailNorm ? { email: emailNorm } : undefined,
        phoneNorm ? { phone: phoneNorm } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (existing) {
    return res.status(409).json({ error: "This student appears to be already registered." });
  }

  const student = await prisma.student.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: emailNorm,
      phone: phoneNorm,
      consent: Boolean(consent),
      schoolId: Number(schoolId),
      campaignId: activeCampaign.id,
    },
    include: { school: true, campaign: true },
  });

  res.status(201).json(student);
});

/** ADMIN: update student */
router.put("/:id", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, phone, schoolId } = req.body;

  const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : undefined;
  const phoneNorm = typeof phone === "string" ? phone.replace(/[^\d]/g, "").slice(0, 15) : undefined;

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName: typeof firstName === "string" ? firstName.trim() : undefined,
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
      email: emailNorm,
      phone: phoneNorm,
      schoolId: schoolId ? Number(schoolId) : undefined,
    },
    include: { school: true, campaign: true },
  });

  res.json(student);
});

/** ADMIN: delete student */
router.delete("/:id", requireAdminPin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.student.delete({ where: { id } });
  res.status(204).end();
});

/** ADMIN: export CSV (optionally filter by campaignId query) */
router.get("/export/csv", requireAdminPin, async (req, res) => {
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;

  const students = await prisma.student.findMany({
    where: { campaignId: campaignId || undefined },
    include: { school: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  const csvEscape = (v: unknown) => {
    const s = String(v ?? "");
    const escaped = s.replace(/"/g, `""`);
    return `"${escaped}"`;
  };

  const rows = [
    "First Name,Last Name,Email,Phone,School,Campaign,Consent,Created At",
    ...students.map((s) =>
      [
        csvEscape(s.firstName),
        csvEscape(s.lastName),
        csvEscape(s.email),
        csvEscape(s.phone),
        csvEscape(s.school.name),
        csvEscape(s.campaign.name),
        csvEscape(s.consent ? "YES" : "NO"),
        csvEscape(s.createdAt.toISOString()),
      ].join(",")
    ),
  ];

  res.header("Content-Type", "text/csv");
  res.attachment("students.csv");
  res.send(rows.join("\n"));
});

export default router;
