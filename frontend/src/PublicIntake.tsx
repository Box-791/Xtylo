import { useEffect, useMemo, useState } from "react";
import {
  fetchSchools,
  createStudent,
  AreaOfInterest,
  AREA_OF_INTEREST_LABEL,
} from "./api";

type School = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
};

export default function PublicIntake() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolId, setSchoolId] = useState<number | "">("");
  const [areaOfInterest, setAreaOfInterest] = useState<AreaOfInterest>(
    AreaOfInterest.COSMETOLOGY
  );
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSchools()
      .then(setSchools)
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = useMemo(() => {
    const first = firstName.trim();
    const last = lastName.trim();
    const hasContact = email.trim() !== "" || phone.trim() !== "";
    return Boolean(first && last && schoolId !== "" && hasContact && !submitting);
  }, [firstName, lastName, email, phone, schoolId, submitting]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const first = firstName.trim();
    const last = lastName.trim();
    const emailStr = email.trim();
    const phoneStr = phone.trim();

    if (!first || !last || schoolId === "") {
      setError("First name, last name, and school are required.");
      return;
    }

    if (!emailStr && !phoneStr) {
      setError("Please enter either an email or a phone number.");
      return;
    }

    try {
      setSubmitting(true);

      await createStudent({
        firstName: first,
        lastName: last,
        email: emailStr || undefined,
        phone: phoneStr || undefined,
        schoolId: Number(schoolId),
        areaOfInterest,
        consent,
      });

      setOk("Thank you! Your information was submitted.");

      // reset
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setSchoolId("");
      setAreaOfInterest(AreaOfInterest.COSMETOLOGY);
      setConsent(false);
    } catch (e: any) {
      setError(e?.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{
          width: "min(820px, 100%)",
          margin: "0 auto",
          padding: 20,
        }}
      >
        <h1 style={{ marginBottom: 6 }}>Interested in Beauty School?</h1>
        <small>Please fill out the form below. Email or phone is required.</small>

        <div style={{ height: 16 }} />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={submit}>
            {/* GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 12,
              }}
            >
              {/* First Name */}
              <div style={{ gridColumn: "span 12" }}>
                <label className="label">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                />
              </div>

              {/* Last Name */}
              <div style={{ gridColumn: "span 12" }}>
                <label className="label">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                />
              </div>

              {/* On wider screens, use 2 columns */}
              <style>
                {`
                  @media (min-width: 720px) {
                    .kiosk-col-6 { grid-column: span 6 !important; }
                    .kiosk-col-12 { grid-column: span 12 !important; }
                  }
                `}
              </style>

              {/* Email */}
              <div className="kiosk-col-6" style={{ gridColumn: "span 12" }}>
                <label className="label">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div className="kiosk-col-6" style={{ gridColumn: "span 12" }}>
                <label className="label">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(###) ###-####"
                  autoComplete="tel"
                />
              </div>

              {/* School */}
              <div className="kiosk-col-6" style={{ gridColumn: "span 12" }}>
                <label className="label">School</label>
                <select
                  value={schoolId}
                  onChange={(e) =>
                    setSchoolId(e.target.value ? Number(e.target.value) : "")
                  }
                >
                  <option value="">Select a school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.city || s.state
                        ? ` — ${s.city ?? ""}${s.city && s.state ? ", " : ""}${
                            s.state ?? ""
                          }`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area of Interest */}
              <div className="kiosk-col-6" style={{ gridColumn: "span 12" }}>
                <label className="label">Area of Interest</label>
                <select
                  value={areaOfInterest}
                  onChange={(e) =>
                    setAreaOfInterest(e.target.value as AreaOfInterest)
                  }
                >
                  {Object.values(AreaOfInterest).map((v) => (
                    <option key={v} value={v}>
                      {AREA_OF_INTEREST_LABEL[v]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consent */}
              <div className="kiosk-col-12" style={{ gridColumn: "span 12" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8, // closer spacing between checkbox and text
                    padding: "10px 12px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{
                      width: 18,
                      height: 18,
                      margin: 0, // removes default spacing that can cause "far apart"
                    }}
                  />
                  <span style={{ lineHeight: 1.2 }}>
                    I agree to be contacted by Xtylo.
                  </span>
                </label>
              </div>

              {/* Messages */}
              {error && (
                <div style={{ gridColumn: "span 12", color: "#fecaca" }}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {ok && (
                <div style={{ gridColumn: "span 12", color: "#bbf7d0" }}>
                  <strong>{ok}</strong>
                </div>
              )}

              {/* Submit */}
              <div
                style={{
                  gridColumn: "span 12",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <button className="btn primary" type="submit" disabled={!canSubmit}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
