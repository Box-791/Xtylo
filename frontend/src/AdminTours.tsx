import { useEffect, useMemo, useState } from "react";
import type { Student } from "./api";
import { fetchStudents } from "./api";
import {
  fetchToursByDate,
  createTour,
  updateTour,
  deleteTour,
} from "./api";

type TourStatus = "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

type TourVisit = {
  id: number;
  studentId: number;
  startsAt: string; // ISO
  status: TourStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student: Student;
};

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Tours are Tue–Sat, 9:00–16:00. Simple 30-min slots.
function buildSlots() {
  const slots: string[] = [];
  for (let h = 9; h <= 16; h++) {
    for (const m of [0, 30]) {
      if (h === 16 && m === 30) continue; // last slot 16:00
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const SLOTS = buildSlots();

export default function AdminTours() {
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [tours, setTours] = useState<TourVisit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState<number | "">("");
  const [time, setTime] = useState<string>("09:00");
  const [notes, setNotes] = useState<string>("");

  const startsAtISO = useMemo(() => {
    // local date + selected time -> ISO string
    const [hh, mm] = time.split(":").map(Number);
    const d = new Date(date + "T00:00:00");
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
  }, [date, time]);

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [st, tv] = await Promise.all([
        fetchStudents(), // so you can pick from all students
        fetchToursByDate(date),
      ]);
      setStudents(st);
      setTours(tv);
    } catch (e: any) {
      setError(e?.message || "Failed to load tours.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function onCreateTour() {
    setError(null);
    if (studentId === "") {
      setError("Select a student first.");
      return;
    }
    try {
      await createTour({
        studentId: Number(studentId),
        startsAt: startsAtISO,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to schedule tour.");
    }
  }

  async function setStatus(tourId: number, status: TourStatus) {
    setError(null);
    try {
      await updateTour(tourId, { status });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to update tour.");
    }
  }

  async function onDelete(tourId: number) {
    if (!confirm("Delete this tour booking?")) return;
    setError(null);
    try {
      await deleteTour(tourId);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to delete tour.");
    }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="spread">
        <div>
          <h2>Tour Manager</h2>
          <small>Schedule and manage tours (Tue–Sat, 9am–4pm).</small>
        </div>

        <div className="row">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 180 }}
          />
          <button className="btn" onClick={loadAll} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            marginTop: 14,
            background: "rgba(239,68,68,0.12)",
            borderColor: "rgba(239,68,68,0.45)",
          }}
        >
          <strong style={{ color: "#fecaca" }}>Error:</strong>{" "}
          <span style={{ color: "#fecaca", whiteSpace: "pre-wrap" }}>{error}</span>
        </div>
      )}

      {/* Schedule */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Schedule a tour</h3>
        <div className="row" style={{ alignItems: "stretch" }}>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : "")}
            style={{ minWidth: 320, flex: 1 }}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} — {s.school?.name}
              </option>
            ))}
          </select>

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ width: 150 }}
          >
            {SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            style={{ minWidth: 220, flex: 1 }}
          />

          <button className="btn primary" onClick={onCreateTour} disabled={loading}>
            Schedule
          </button>
        </div>
        <small style={{ opacity: 0.8 }}>
          If you get “slot already booked”, pick another time.
        </small>
      </div>

      {/* List */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Tours for {date}</h3>

        {loading ? (
          <small>Loading…</small>
        ) : tours.length === 0 ? (
          <small>No tours scheduled.</small>
        ) : (
          <div className="tableWrap">
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((t) => {
                  const timeLabel = new Date(t.startsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={t.id}>
                      <td><strong>{timeLabel}</strong></td>
                      <td>{t.student.firstName} {t.student.lastName}</td>
                      <td>{t.student.school?.name ?? "-"}</td>
                      <td>
                        <small>
                          {t.student.email ?? "-"}<br />
                          {t.student.phone ?? "-"}
                        </small>
                      </td>
                      <td>
                        <span className="badge">
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{t.notes ?? "-"}</td>
                      <td>
                        <div className="row">
                          <button className="btn good" onClick={() => setStatus(t.id, "COMPLETED")}>
                            Completed
                          </button>
                          <button className="btn warn" onClick={() => setStatus(t.id, "NO_SHOW")}>
                            No-show
                          </button>
                          <button className="btn" onClick={() => setStatus(t.id, "CANCELED")}>
                            Cancel
                          </button>
                          <button className="btn bad" onClick={() => onDelete(t.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
