import { useEffect, useMemo, useState } from "react";
import {
  fetchSchools,
  createStudent,
  AREA_OF_INTERESTS,
  AREA_OF_INTEREST_LABEL,
} from "./api";
import type { AreaOfInterest, School } from "./api";

import "./PublicIntake.css";


export default function PublicIntake() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolId, setSchoolId] = useState<number | "">("");
  const [areaOfInterest, setAreaOfInterest] =
    useState<AreaOfInterest>("COSMETOLOGY");

  const canSubmit = useMemo(() => {
    const hasName = firstName.trim() && lastName.trim();
    const hasSchool = schoolId !== "";
    const hasContact = email.trim() || phone.trim(); // either is ok
    return Boolean(hasName && hasSchool && hasContact && !submitting);
  }, [firstName, lastName, schoolId, email, phone, submitting]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sc = await fetchSchools();
        if (!alive) return;

        // Filter out any schools that somehow have empty names
        const clean = (Array.isArray(sc) ? sc : []).filter(
          (s) => String(s?.name ?? "").trim().length > 0
        );

        setSchools(clean);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load schools.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (schoolId === "") {
      setError("Please select a school.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide either an email or a phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await createStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        schoolId: Number(schoolId),
        areaOfInterest,
      });

      setSuccess("Submitted. Thank you!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setSchoolId("");
      setAreaOfInterest("COSMETOLOGY");
    } catch (e: any) {
      setError(e?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pi-page">
      <div className="pi-card">
        <h1 className="pi-title">Interested in Beauty School?</h1>
        <p className="pi-subtitle">
          Please enter your information and we’ll reach out soon.
        </p>

        {error && (
          <div className="pi-alert pi-alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="pi-alert pi-alert-success">
            <strong>{success}</strong>
          </div>
        )}

        {loading ? (
          <p className="pi-muted">Loading…</p>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="pi-grid">
              <div className="pi-field">
                <label>First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>

              <div className="pi-field">
                <label>Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>

              <div className="pi-field">
                <label>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>

              <div className="pi-field">
                <label>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>

              <div className="pi-field">
                <label>School</label>
                <select
                  value={schoolId}
                  onChange={(e) =>
                    setSchoolId(e.target.value ? Number(e.target.value) : "")
                  }
                >
                  <option value="">Select school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pi-field">
                <label>Area of interest</label>
                <select
                  value={areaOfInterest}
                  onChange={(e) =>
                    setAreaOfInterest(e.target.value as AreaOfInterest)
                  }
                >
                  {AREA_OF_INTERESTS.map((v) => (
                    <option key={v} value={v}>
                      {AREA_OF_INTEREST_LABEL[v]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="pi-btn" type="submit" disabled={!canSubmit}>
              {submitting ? "Submitting…" : "Submit"}
            </button>

            <div className="pi-muted pi-footnote">
              Provide at least one: email or phone.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
