import { useEffect, useMemo, useState } from "react";
import {
  fetchStudents,
  fetchSchools,
  fetchCampaigns,
  createCampaign,
  activateCampaign,
  deactivateCampaign,
  deleteCampaign,
  createSchool,
  deleteSchool,
  deleteStudent,
  updateStudent,
  exportCSV,
  AreaOfInterest,
} from "./api";

interface School {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
}

interface Campaign {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: string;
  school: School;
  campaign: Campaign;
  areaOfInterest?: AreaOfInterest | string | null;
}

export default function App() {
  // PIN gate
  const [pin, setPin] = useState(localStorage.getItem("ADMIN_PIN") || "");
  const [pinOk, setPinOk] = useState(Boolean(localStorage.getItem("ADMIN_PIN")));
  const [error, setError] = useState<string | null>(null);

  // data
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // filters
  const [schoolId, setSchoolId] = useState<number | undefined>();
  const [campaignId, setCampaignId] = useState<number | undefined>();
  const [interest, setInterest] = useState<AreaOfInterest | undefined>();

  // create campaign
  const [newCampaignName, setNewCampaignName] = useState("");

  // create school
  const [newSchool, setNewSchool] = useState({ name: "", city: "", state: "" });

  // edit modal
  const [editing, setEditing] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    schoolId: 0,
    areaOfInterest: "COSMETOLOGY" as AreaOfInterest,
  });

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.isActive) || null,
    [campaigns]
  );

  async function loadAll() {
    setError(null);
    try {
      const [st, sc, cp] = await Promise.all([
        fetchStudents({ schoolId, campaignId, areaOfInterest: interest }),
        fetchSchools(),
        fetchCampaigns(),
      ]);
      setStudents(st);
      setSchools(sc);
      setCampaigns(cp);
    } catch (e: any) {
      setError(e?.message || "Failed to load admin data. Check ADMIN_PIN and backend.");
    }
  }

  useEffect(() => {
    if (pinOk) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinOk, schoolId, campaignId, interest]);

  function openEdit(s: Student) {
    setEditing(s);
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email ?? "",
      phone: s.phone ?? "",
      schoolId: s.school.id,
      areaOfInterest: (s.areaOfInterest as AreaOfInterest) || "COSMETOLOGY",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateStudent(editing.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        schoolId: editForm.schoolId,
        areaOfInterest: editForm.areaOfInterest,
      });
      setEditing(null);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to update student.");
    }
  }

  function interestLabel(v: any) {
    if (v === "COSMETOLOGY") return "Cosmetology";
    if (v === "BARBER") return "Barber";
    if (v === "NAIL_TECHNICIAN") return "Nail Technician";
    return v ?? "-";
  }

  if (!pinOk) {
    return (
      <div className="container">
        <div className="card" style={{ width: "min(520px, 100%)", margin: "0 auto" }}>
          <h1>Admin</h1>
          <small>Enter admin PIN to continue.</small>
          <div style={{ height: 12 }} />
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Admin PIN"
          />
          <div style={{ height: 12 }} />
          <button
            className="btn primary"
            style={{ width: "100%" }}
            onClick={() => {
              localStorage.setItem("ADMIN_PIN", pin);
              setPinOk(true);
            }}
          >
            Unlock
          </button>
          <div style={{ height: 10 }} />
          <small>Must match backend ADMIN_PIN.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="spread">
        <div>
          <h1>Admin – Xtylo Reach</h1>
          <small>
            Active campaign:{" "}
            {activeCampaign ? (
              <span className="badge good">{activeCampaign.name}</span>
            ) : (
              <span className="badge warn">NONE</span>
            )}
          </small>
        </div>

        <div className="row">
          <button className="btn" onClick={loadAll}>Refresh</button>
          <button
            className="btn"
            onClick={() => {
              localStorage.removeItem("ADMIN_PIN");
              setPinOk(false);
            }}
          >
            Lock
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

      {/* EXPORT */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="spread">
          <div>
            <h2>Export</h2>
            <small>Export respects your selection: choose a campaign filter, then export that campaign.</small>
          </div>
          <div className="row">
            <button className="btn" onClick={() => exportCSV()}>
              Export ALL
            </button>
            <button
              className="btn primary"
              disabled={!activeCampaign}
              onClick={() => activeCampaign && exportCSV(activeCampaign.id)}
            >
              Export ACTIVE
            </button>
            <button
              className="btn"
              disabled={!campaignId}
              onClick={() => campaignId && exportCSV(campaignId)}
            >
              Export FILTERED
            </button>
          </div>
        </div>
      </div>

      {/* CAMPAIGNS */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Campaigns</h2>

        <div className="row">
          <input
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            placeholder="New campaign name"
            style={{ flex: 1 }}
          />
          <button
            className="btn primary"
            onClick={async () => {
              if (!newCampaignName.trim()) return;
              await createCampaign(newCampaignName.trim());
              setNewCampaignName("");
              await loadAll();
            }}
          >
            Create
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="spread"
              style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <strong>{c.name}</strong>{" "}
                {c.isActive ? <span className="badge good">active</span> : <span className="badge">inactive</span>}
              </div>

              <div className="row">
                <button
                  className="btn good"
                  disabled={c.isActive}
                  onClick={async () => {
                    await activateCampaign(c.id);
                    await loadAll();
                  }}
                >
                  Activate
                </button>

                <button
                  className="btn warn"
                  disabled={!c.isActive}
                  onClick={async () => {
                    await deactivateCampaign(c.id);
                    await loadAll();
                  }}
                >
                  Deactivate
                </button>

                <button
                  className="btn bad"
                  onClick={async () => {
                    if (!confirm("Delete this campaign? (Only possible if it has NO students)")) return;
                    try {
                      await deleteCampaign(c.id);
                      await loadAll();
                    } catch (e: any) {
                      setError(e?.message || "Failed to delete campaign.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && <small>No campaigns yet.</small>}
        </div>
      </div>

      {/* SCHOOLS */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Schools</h2>
        <small>Add schools here so they appear on the iPad form.</small>

        <div style={{ height: 10 }} />

        <div className="row">
          <input
            value={newSchool.name}
            onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
            placeholder="School name"
            style={{ flex: 2 }}
          />
          <input
            value={newSchool.city}
            onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
            placeholder="City (optional)"
            style={{ flex: 1 }}
          />
          <input
            value={newSchool.state}
            onChange={(e) => setNewSchool({ ...newSchool, state: e.target.value })}
            placeholder="State (optional)"
            style={{ flex: 1 }}
          />
          <button
            className="btn primary"
            onClick={async () => {
              if (!newSchool.name.trim()) return;
              await createSchool({
                name: newSchool.name.trim(),
                city: newSchool.city.trim() || undefined,
                state: newSchool.state.trim() || undefined,
              });
              setNewSchool({ name: "", city: "", state: "" });
              await loadAll();
            }}
          >
            Add School
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {schools.map((s) => (
            <div
              key={s.id}
              className="spread"
              style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <strong>{s.name}</strong>{" "}
                <small>
                  {s.city ? s.city : ""}
                  {s.city && s.state ? ", " : ""}
                  {s.state ? s.state : ""}
                </small>
              </div>
              <button
                className="btn bad"
                onClick={async () => {
                  if (!confirm("Delete this school? (Only possible if no students reference it)")) return;
                  try {
                    await deleteSchool(s.id);
                    await loadAll();
                  } catch (e: any) {
                    setError(e?.message || "Failed to delete school.");
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS + STUDENTS */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="spread">
          <div>
            <h2>Students</h2>
            <small>Use filters to export or review a specific group.</small>
          </div>

          <div className="row">
            <select
              value={schoolId ?? ""}
              onChange={(e) => setSchoolId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ minWidth: 220 }}
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={campaignId ?? ""}
              onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ minWidth: 220 }}
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.isActive ? " (active)" : ""}
                </option>
              ))}
            </select>

            {/* NEW: Interest filter */}
            <select
              value={interest ?? ""}
              onChange={(e) => setInterest(e.target.value ? (e.target.value as AreaOfInterest) : undefined)}
              style={{ minWidth: 220 }}
            >
              <option value="">All Interests</option>
              <option value="COSMETOLOGY">Cosmetology</option>
              <option value="BARBER">Barber</option>
              <option value="NAIL_TECHNICIAN">Nail Technician</option>
            </select>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Campaign</th>
                <th>Interest</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.firstName} {s.lastName}</strong></td>
                  <td>{s.school.name}</td>
                  <td>
                    {s.campaign.name}{" "}
                    {s.campaign.isActive && <span className="badge good">active</span>}
                  </td>
                  <td>{interestLabel(s.areaOfInterest)}</td>
                  <td>{s.email ?? "-"}</td>
                  <td>{s.phone ?? "-"}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="row">
                      <button className="btn" onClick={() => openEdit(s)}>Edit</button>
                      <button
                        className="btn bad"
                        onClick={async () => {
                          if (!confirm("Delete this student?")) return;
                          await deleteStudent(s.id);
                          await loadAll();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan={8}><small>No students found.</small></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="modalBack" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="spread">
              <h2>Edit Student</h2>
              <button className="btn" onClick={() => setEditing(null)}>Close</button>
            </div>

            <hr />

            <div className="row">
              <input
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="First Name"
              />
              <input
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Last Name"
              />
            </div>

            <div className="row">
              <input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email"
              />
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Phone"
              />
            </div>

            <select
              value={editForm.schoolId}
              onChange={(e) => setEditForm({ ...editForm, schoolId: Number(e.target.value) })}
            >
              {schools.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>

            <select
              value={editForm.areaOfInterest}
              onChange={(e) => setEditForm({ ...editForm, areaOfInterest: e.target.value as AreaOfInterest })}
            >
              <option value="COSMETOLOGY">Cosmetology</option>
              <option value="BARBER">Barber</option>
              <option value="NAIL_TECHNICIAN">Nail Technician</option>
            </select>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
