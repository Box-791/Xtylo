import { useEffect, useMemo, useRef, useState } from "react";
import { fetchActiveCampaign, fetchSchools, createStudent } from "./api";

interface School {
  id: number;
  name: string;
}

function isValidEmail(email: string) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "").slice(0, 15);
}

export default function PublicIntake() {
  const [schools, setSchools] = useState<School[]>([]);
  const [campaign, setCampaign] = useState<{ id: number; name: string } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const successTimerRef = useRef<number | null>(null);
  const firstRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    schoolId: "",
    consent: false,
  });

  function hardResetForm() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      schoolId: "",
      consent: false,
    });
    setError(null);
    // keep success banner visible briefly, but focus immediately:
    setTimeout(() => firstRef.current?.focus(), 0);
  }

  async function load() {
    setError(null);
    try {
      const [sc, active] = await Promise.all([fetchSchools(), fetchActiveCampaign()]);
      setSchools(sc);
      setCampaign(active);
    } catch {
      setError("System is not ready. Ask the presenter to activate a campaign.");
      setCampaign(null);
    }
  }

  useEffect(() => {
    load();

    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    firstRef.current?.focus();
  }, [campaign]);

  const canSubmit = useMemo(() => {
    const phoneNorm = normalizePhone(form.phone);
    const hasContact = Boolean(form.email.trim() || phoneNorm);

    return Boolean(
      campaign &&
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.schoolId &&
        form.consent &&
        hasContact &&
        isValidEmail(form.email) &&
        !submitting
    );
  }, [campaign, form, submitting]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (submitting) return;

    if (!campaign) return setError("No active campaign. Ask the presenter to activate a campaign.");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.schoolId) {
      return setError("Please fill First Name, Last Name, and School.");
    }
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");

    const phoneNorm = normalizePhone(form.phone);
    if (!form.email.trim() && !phoneNorm) return setError("Provide at least an email or a phone number.");
    if (!form.consent) return setError("Please check the consent box.");

    setSubmitting(true);
    try {
      await createStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: phoneNorm || undefined,
        schoolId: Number(form.schoolId),
        consent: true,
      });

      // ✅ show success, reset immediately so next student can enter right away
      setSuccess("Submitted! Hand the iPad to the next student.");
      hardResetForm();

      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      successTimerRef.current = window.setTimeout(() => setSuccess(null), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form
        onSubmit={submit}
        className="card"
        style={{
          width: "min(780px, 100%)",
          padding: 22,
        }}
      >
        <div className="spread" style={{ gap: 16 }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>Beauty School Interest Form</h1>
            <small>
              Campaign:{" "}
              {campaign ? (
                <span className="badge good">{campaign.name}</span>
              ) : (
                <span className="badge warn">Not active</span>
              )}
            </small>
          </div>
          <button type="button" className="btn" onClick={load} disabled={submitting}>
            Refresh
          </button>
        </div>

        {success && (
          <div
            className="card"
            style={{
              marginTop: 14,
              background: "rgba(34,197,94,0.12)",
              borderColor: "rgba(34,197,94,0.45)",
              padding: 14,
            }}
          >
            <strong style={{ color: "#bbf7d0" }}>✅ {success}</strong>
          </div>
        )}

        {error && (
          <div
            className="card"
            style={{
              marginTop: 14,
              background: "rgba(239,68,68,0.12)",
              borderColor: "rgba(239,68,68,0.45)",
              padding: 14,
            }}
          >
            <strong style={{ color: "#fecaca" }}>Error:</strong>{" "}
            <span style={{ color: "#fecaca", whiteSpace: "pre-wrap" }}>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          <div className="kioskTwoCol">
            <input
              ref={firstRef}
              placeholder="First Name *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              style={{ padding: 16, fontSize: 18 }}
            />
            <input
              placeholder="Last Name *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              style={{ padding: 16, fontSize: 18 }}
            />
          </div>

          <div className="kioskTwoCol">
            <input
              placeholder="Email (recommended)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              inputMode="email"
              style={{ padding: 16, fontSize: 18 }}
            />
            <input
              placeholder="Phone (recommended)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              inputMode="tel"
              style={{ padding: 16, fontSize: 18 }}
            />
          </div>

          <select
            value={form.schoolId}
            onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
            required
            style={{ padding: 16, fontSize: 18 }}
          >
            <option value="">Select your school *</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 2px", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              style={{ width: 22, height: 22 }}
            />
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.88)" }}>
              I agree to be contacted by Xtylo about enrollment. *
            </span>
          </label>

          <div className="spread" style={{ gap: 12 }}>
            <button className="btn primary" disabled={!canSubmit} type="submit" style={{ padding: 14, fontSize: 18 }}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button className="btn" type="button" onClick={hardResetForm} style={{ padding: 14, fontSize: 18 }} disabled={submitting}>
              Clear
            </button>
          </div>

          <small style={{ opacity: 0.8 }}>* Required fields. Provide at least an email or phone.</small>
        </div>
      </form>
    </div>
  );
}
