import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminPin } from "../middleware/adminPin";

router.use(requireAdminPin);


const router = Router();

/**
 * Business rules:
 * - Tours Tue–Sat only
 * - 9:00 AM – 4:00 PM (last start 3:30 PM if using 30-min slots)
 * - No double-booking same startsAt unless previous is CANCELED
 */

type TourStatus = "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

function parseISODateTime(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseISODate(v: unknown): Date | null {
  // expects YYYY-MM-DD
  if (!v || typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(y, mo - 1, da);
  return isNaN(d.getTime()) ? null : d;
}

function isTueToSat(d: Date) {
  const day = d.getDay(); // 0 Sun ... 6 Sat
  return day >= 2 && day <= 6;
}

function isWithinTourHours(d: Date) {
  // 9:00 to 16:00, last start 15:30
  const h = d.getHours();
  const min = d.getMinutes();

  if (h < 9) return false;
  if (h > 15) return false; // 16:00 start not allowed
  if (h === 15 && min > 30) return false;

  return true;
}

function isOnThirtyMinuteSlot(d: Date) {
  return d.getMinutes() === 0 || d.getMinutes() === 30;
}

function parseStatus(v: unknown): TourStatus | undefined {
  if (!v) return undefined;
  const s = String(v).trim().toUpperCase();
  if (s === "SCHEDULED" || s === "COMPLETED" || s === "CANCELED" || s === "NO_SHOW") return s as TourStatus;
  return undefined;
}

/**
 * GET /tours?date=YYYY-MM-DD
 * Returns tours for that day (local server time).
 */
router.get("/", async (req, res) => {
  const date = parseISODate(req.query.date);
  if (!date) return res.status(400).json({ error: "Provide date=YYYY-MM-DD" });

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const tours = await prisma.tourVisit.findMany({
    where: {
      startsAt: { gte: start, lte: end },
    },
    include: {
      student: {
        include: { school: true, campaign: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  res.json(tours);
});

/**
 * POST /tours
 * Body: { studentId: number, startsAt: string(ISO), notes?: string }
 */
router.post("/", async (req, res) => {
  const studentId = Number(req.body?.studentId);
  const startsAt = parseISODateTime(req.body?.startsAt);
  const notes = req.body?.notes !== undefined ? String(req.body.notes) : null;

  if (!studentId || !startsAt) {
    return res.status(400).json({ error: "studentId and startsAt are required" });
  }

  if (!isTueToSat(startsAt)) {
    return res.status(400).json({ error: "Tours are only Tue–Sat" });
  }

  if (!isWithinTourHours(startsAt)) {
    return res.status(400).json({ error: "Tours must be between 9:00 AM and 4:00 PM (last start 3:30 PM)" });
  }

  if (!isOnThirtyMinuteSlot(startsAt)) {
    return res.status(400).json({ error: "Tours must be scheduled on 30-minute slots (:00 or :30)" });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ error: "Student not found" });

  // prevent double-booking same exact start time (ignore canceled)
  const clash = await prisma.tourVisit.findFirst({
    where: {
      startsAt,
      status: { not: "CANCELED" },
    },
  });

  if (clash) {
    return res.status(400).json({ error: "That tour time is already booked" });
  }

  const tour = await prisma.tourVisit.create({
    data: {
      studentId,
      startsAt,
      notes,
      status: "SCHEDULED",
    },
    include: {
      student: { include: { school: true, campaign: true } },
    },
  });

  // Optional: if scheduling a tour counts as “contacted”
  // (Uncomment if you want)
  // await prisma.student.update({
  //   where: { id: studentId },
  //   data: { contacted: true, contactedAt: student.contacted ? undefined : new Date() },
  // });

  res.status(201).json(tour);
});

/**
 * PUT /tours/:id
 * Body: { startsAt?, status?, notes? }
 *
 * If status becomes COMPLETED, we also set:
 * - student.visitCompleted = true
 * - student.visitCompletedAt = now
 */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const startsAt = req.body?.startsAt !== undefined ? parseISODateTime(req.body.startsAt) : undefined;
  const status = parseStatus(req.body?.status);
  const notes = req.body?.notes !== undefined ? String(req.body.notes) : undefined;

  if (req.body?.startsAt !== undefined && !startsAt) {
    return res.status(400).json({ error: "startsAt must be a valid ISO datetime" });
  }

  if (startsAt) {
    if (!isTueToSat(startsAt)) return res.status(400).json({ error: "Tours are only Tue–Sat" });
    if (!isWithinTourHours(startsAt)) return res.status(400).json({ error: "Tours must be between 9:00 AM and 4:00 PM (last start 3:30 PM)" });
    if (!isOnThirtyMinuteSlot(startsAt)) return res.status(400).json({ error: "Tours must be scheduled on 30-minute slots (:00 or :30)" });

    // prevent double-booking if rescheduling
    const clash = await prisma.tourVisit.findFirst({
      where: {
        startsAt,
        status: { not: "CANCELED" },
        id: { not: id },
      },
    });
    if (clash) return res.status(400).json({ error: "That tour time is already booked" });
  }

  const existing = await prisma.tourVisit.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Tour not found" });

  const nextStatus = status ?? (existing.status as TourStatus);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.tourVisit.update({
      where: { id },
      data: {
        startsAt: startsAt ?? undefined,
        status: status ?? undefined,
        notes: notes ?? undefined,
      },
      include: {
        student: { include: { school: true, campaign: true } },
      },
    });

    if (nextStatus === "COMPLETED") {
      await tx.student.update({
        where: { id: updated.studentId },
        data: {
          visitCompleted: true,
          visitCompletedAt: new Date(),
        },
      });
    }

    return updated;
  });

  res.json(result);
});

/**
 * DELETE /tours/:id
 * We "cancel" instead of hard delete.
 */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const tour = await prisma.tourVisit.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  res.json(tour);
});

export default router;
