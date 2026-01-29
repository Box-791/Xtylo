import Twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;

if (!sid || !token) {
  // Don’t crash on import in dev, but routes should fail clearly if missing
  console.warn("⚠️ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
}

export const twilioClient = sid && token ? Twilio(sid, token) : null;

export function getTwilioSender() {
  const from = process.env.TWILIO_FROM;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!from && !messagingServiceSid) {
    throw new Error("Set TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID");
  }

  return { from, messagingServiceSid };
}