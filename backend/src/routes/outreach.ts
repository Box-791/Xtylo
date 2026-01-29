import {Router} from "express";
import { prisma } from "../lib/prisma";
import { requireAdminPin } from "../middleware/adminPin";
import { twilioClient, getTwilioSender } from "../lib/twilio";

const router = Router();
router.use(requireAdminPin);

router.use((req,res,next) => {
    const pin = String(req.header("x-admin-pin") ?? "");
    if (pin !== process.env.ADMIN_PIN) {
        return res.status(401).json({ error: "Invalid admin pin" });
    }
    next();
});

function toE164(raw: string) {
  // Minimal: assume US if 10 digits. (Good enough for now.)
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw;
  return null;
}

router.post("/sms", async (req, res) => {
  const studentIds: number[] = Array.isArray(req.body?.studentIds) ? req.body.studentIds : [];
  const message = String(req.body?.message ?? "").trim();

  if (!studentIds.length) return res.status(400).json({ error: "studentIds required" });
  if (!message) return res.status(400).json({ error: "message required" });
  if (message.length > 1000) return res.status(400).json({ error: "message too long" });

  if (!twilioClient) return res.status(500).json({ error: "Twilio not configured" });

  const sender = getTwilioSender();

  // fetch students (include campaign so we can log campaignId)
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { campaign: true },
  });

  const results: Array<{ studentId: number; ok: boolean; error?: string }> = [];

  // Send sequentially for simplicity (avoid rate limit surprises)
  for (const s of students) {
    const phone = s.phone ? toE164(s.phone) : null;
    if (!phone) {
      results.push({ studentId: s.id, ok: false, error: "Missing/invalid phone" });
      continue;
    }

    try {
      // Create “message record” first (your schema has OutreachMessage)
      const msgRow = await prisma.outreachMessage.create({
        data: {
          studentId: s.id,
          campaignId: s.campaignId,
          message,
        },
      });

      // Twilio send
      await twilioClient.messages.create({
        to: phone,
        body: message,
        ...(sender.messagingServiceSid
          ? { messagingServiceSid: sender.messagingServiceSid }
          : { from: sender.from! }),
      });

      await prisma.outreachLog.create({
        data: {
          studentId: s.id,
          messageId: msgRow.id,
          status: "SENT",
        },
      });

      // Optional: auto-mark contacted on successful send
      await prisma.student.update({
        where: { id: s.id },
        data: {
          contacted: true,
          contactedAt: s.contacted ? undefined : new Date(),
        },
      });

      results.push({ studentId: s.id, ok: true });
    } catch (e: any) {
      const err = e?.message || "Failed to send";

      // log failure if we can (best effort)
      try {
        const msgRow = await prisma.outreachMessage.create({
          data: { studentId: s.id, campaignId: s.campaignId, message },
        });
        await prisma.outreachLog.create({
          data: { studentId: s.id, messageId: msgRow.id, status: "FAILED" },
        });
      } catch {}

      results.push({ studentId: s.id, ok: false, error: err });
    }
  }

  res.json({ ok: true, results });
});

export default router;