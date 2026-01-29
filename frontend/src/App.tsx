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
  AREA_OF_INTEREST_LABEL,
  // ✅ Twilio bulk SMS (make sure you added this in api.ts)
  sendBulkSMS,
} from "./api";

import type { AreaOfInterest, Student, School, Campaign } from "./api";
import AdminTours from "./AdminTours";

export default function App() {
  // ✅ Page switch (Students / Tours)
  const [page, setPage] = useState<"students" | "tours">("students");

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
  const [contacted, setContacted] = useState<boolean | undefined>();
  const [visitCompleted, setVisitCompleted] = useState<boolean | undefined>();

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
    contacted: false,
    visitCompleted: false,
  });

  // ✅ Bulk SMS state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsReport, setSmsReport] = useState<null | {
    ok: boolean;
    results: Array<{ studentId: number; ok: boolean; error?: string }>;
  }>(null);

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.isActive) || null,
    [campaigns]
  );

  const selectedCount = selectedIds.length;

  const allVisibleSelected =
    students.length > 0 && students.every((s) => selectedIds.includes(s.id));

  function toggleSelected(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearSelected() {
    setSelectedIds([]);
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      for (const s of students) set.add(s.id);
      return Array.from(set);
    });
  }

  function unselectAllVisible() {
    setSelectedIds((prev) => prev.filter((id) => !students.some((s) => s.id === id)));
  }

  async function loadAll() {
    setError(null);
    try {
      const [st, sc, cp] = await Promise.all([
        fetchStudents({
          schoolId,
          campaignId,
          areaOfInterest: interest,
          contacted,
          visitCompleted,
        }),
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
    // ✅ only reload student data when we are on students page
    if (pinOk && page === "students") loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinOk, page, schoolId, campaignId, interest, contacted, visitCompleted]);

  // ✅ If filters change, keep selections that still exist on the screen (optional but nicer)
  useEffect(() => {
    if (page !== "students") return;
    setSelectedIds((prev) => prev.filter((id) => students.some((s) => s.id === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, page]);

  function openEdit(s: Student) {
    setEditing(s);
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email ?? "",
      phone: s.phone ?? "",
      schoolId: s.school.id,
      areaOfInterest: s.areaOfInterest as AreaOfInterest,
      contacted: (s as any).contacted ?? false,
      visitCompleted: (s as any).visitCompleted ?? false,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateStudent(editing.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim() ? editForm.email.trim() : null,
        phone: editForm.phone.trim() ? editForm.phone.trim() : null,
        schoolId: editForm.schoolId,
        areaOfInterest: editForm.areaOfInterest,
        contacted: editForm.contacted,
        visitCompleted: editForm.visitCompleted,
      });
      setEditing(null);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to update student.");
    }
  }

  async function quickToggleStudent(
    id: number,
    patch: Partial<{ contacted: boolean; visitCompleted: boolean }>
  ) {
    try {
      await updateStudent(id, patch as any);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to update student.");
    }
  }

  async function doSendBulkSMS() {
    setError(null);
    setSmsReport(null);

    const msg = smsMessage.trim();
    if (!selectedIds.length) {
      setError("Select at least one student to send SMS.");
      return;
    }
    if (!msg) {
      setError("Type an SMS message first.");
      return;
    }

    setSmsSending(true);
    try {
      const resp = await sendBulkSMS({ studentIds: selectedIds, message: msg });
      setSmsReport(resp);
      // Optional: keep selectedIds, or clear them after success
      // clearSelected();
      await loadAll(); // refresh to show contacted=true if backend marks contacted on SMS success
    } catch (e: any) {
      setError(e?.message || "Failed to send SMS.");
    } finally {
      setSmsSending(false);
    }
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

        {/* ✅ TOP NAV BUTTONS */}
        <div className="row">
          <button
            className={page === "students" ? "btn primary" : "btn"}
            onClick={() => setPage("students")}
          >
            Students
          </button>

          <button
            className={page === "tours" ? "btn primary" : "btn"}
            onClick={() => setPage("tours")}
          >
            Tour Manager
          </button>

          <button
            className="btn"
            onClick={loadAll}
            disabled={page !== "students"}
            title={page !== "students" ? "Switch to Students to refresh student data" : "Refresh"}
          >
            Refresh
          </button>

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

      {/* ✅ PAGE SWITCH */}
      {page === "tours" ? (
        <AdminTours />
      ) : (
        <>
          {/* EXPORT */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="spread">
              <div>
                <h2>Export</h2>
                <small>Export respects your current filters. Use filters below, then export filtered list.</small>
              </div>
              <div className="row">
                <button className="btn" onClick={() => exportCSV()} title="Exports all students">
                  Export ALL
                </button>

                <button
                  className="btn"
                  onClick={() =>
                    exportCSV({
                      schoolId,
                      campaignId,
                      areaOfInterest: interest,
                      contacted,
                      visitCompleted,
                    })
                  }
                  title="Exports only what you are filtering"
                >
                  Export FILTERED
                </button>

                <button
                  className="btn primary"
                  disabled={!activeCampaign}
                  onClick={() => activeCampaign && exportCSV({ campaignId: activeCampaign.id })}
                  title="Exports only active campaign"
                >
                  Export ACTIVE
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
                    {c.isActive ? (
                      <span className="badge good">active</span>
                    ) : (
                      <span className="badge">inactive</span>
                    )}
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
                        if (!confirm("Delete this campaign? (Only possible if it has NO students)"))
                          return;
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
                      if (!confirm("Delete this school? (Only possible if no students reference it)"))
                        return;
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

          {/* ✅ BULK SMS */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="spread">
              <div>
                <h2>Bulk SMS</h2>
                <small>
                  Select students in the table below, type a message, then send. Students without valid phone will fail.
                </small>
              </div>

              <div className="row">
                <span className="badge">{selectedCount} selected</span>

                <button className="btn" onClick={clearSelected} disabled={!selectedCount}>
                  Clear
                </button>

                <button
                  className="btn"
                  onClick={() => (allVisibleSelected ? unselectAllVisible() : selectAllVisible())}
                  disabled={students.length === 0}
                  title="Select/unselect everyone on the current filtered page"
                >
                  {allVisibleSelected ? "Unselect Page" : "Select Page"}
                </button>
              </div>
            </div>

            <div style={{ height: 10 }} />

            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type SMS message…"
              rows={3}
            />

            <div style={{ height: 10 }} />

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn primary"
                onClick={doSendBulkSMS}
                disabled={smsSending || !selectedCount || !smsMessage.trim()}
                title={!selectedCount ? "Select at least one student" : ""}
              >
                {smsSending ? "Sending…" : "Send SMS"}
              </button>
            </div>

            {smsReport && (
              <div style={{ marginTop: 10 }}>
                <div className="spread">
                  <strong>Send report</strong>
                  <button className="btn" onClick={() => setSmsReport(null)}>
                    Hide
                  </button>
                </div>

                <div style={{ height: 8 }} />

                {(() => {
                  const ok = smsReport.results.filter((r) => r.ok).length;
                  const fail = smsReport.results.filter((r) => !r.ok).length;
                  return (
                    <small style={{ opacity: 0.9 }}>
                      Sent: <strong>{ok}</strong> • Failed: <strong>{fail}</strong>
                    </small>
                  );
                })()}

                {smsReport.results.some((r) => !r.ok) && (
                  <div style={{ marginTop: 10 }}>
                    <small style={{ opacity: 0.9 }}>Failures:</small>
                    <div style={{ height: 6 }} />
                    <div style={{ display: "grid", gap: 6 }}>
                      {smsReport.results
                        .filter((r) => !r.ok)
                        .slice(0, 20)
                        .map((r) => (
                          <div
                            key={r.studentId}
                            style={{
                              padding: 10,
                              borderRadius: 12,
                              border: "1px solid rgba(239,68,68,0.35)",
                              background: "rgba(239,68,68,0.08)",
                            }}
                          >
                            <small>
                              <strong>Student #{r.studentId}</strong>: {r.error || "Failed"}
                            </small>
                          </div>
                        ))}
                    </div>
                    {smsReport.results.filter((r) => !r.ok).length > 20 && (
                      <div style={{ height: 8 }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FILTERS + STUDENTS */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="spread">
              <div>
                <h2>Students</h2>
                <small>Use filters to review/export specific groups.</small>
              </div>

              {/* ✅ ONE ROW FILTERS */}
              <div className="filtersRow">
                <select
                  value={schoolId ?? ""}
                  onChange={(e) => setSchoolId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Schools</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={campaignId ?? ""}
                  onChange={(e) =>
                    setCampaignId(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isActive ? " (active)" : ""}
                    </option>
                  ))}
                </select>

                <select
                  value={interest ?? ""}
                  onChange={(e) =>
                    setInterest(e.target.value ? (e.target.value as AreaOfInterest) : undefined)
                  }
                >
                  <option value="">All Interests</option>
                  <option value="COSMETOLOGY">Cosmetology</option>
                  <option value="BARBER">Barber</option>
                  <option value="NAIL_TECHNICIAN">Nail Technician</option>
                </select>

                <select
                  value={contacted === undefined ? "" : contacted ? "true" : "false"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setContacted(v === "" ? undefined : v === "true");
                  }}
                >
                  <option value="">Contacted: Any</option>
                  <option value="true">Contacted: YES</option>
                  <option value="false">Contacted: NO</option>
                </select>

                <select
                  value={visitCompleted === undefined ? "" : visitCompleted ? "true" : "false"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVisitCompleted(v === "" ? undefined : v === "true");
                  }}
                >
                  <option value="">Had Visit: Any</option>
                  <option value="true">Had Visit: YES</option>
                  <option value="false">Had Visit: NO</option>
                </select>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={() => (allVisibleSelected ? unselectAllVisible() : selectAllVisible())}
                        />
                        <span>Select</span>
                      </label>
                    </th>
                    <th>Name</th>
                    <th>School</th>
                    <th>Campaign</th>
                    <th>Interest</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Contacted</th>
                    <th>Had Visit</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelected(s.id)}
                        />
                      </td>

                      <td>
                        <strong>
                          {s.firstName} {s.lastName}
                        </strong>
                      </td>
                      <td>{s.school.name}</td>
                      <td>
                        {s.campaign.name}{" "}
                        {s.campaign.isActive && <span className="badge good">active</span>}
                      </td>
                      <td>{AREA_OF_INTEREST_LABEL[s.areaOfInterest as AreaOfInterest]}</td>
                      <td>{s.email ?? "-"}</td>
                      <td>{s.phone ?? "-"}</td>

                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={(s as any).contacted ?? false}
                            onChange={(e) =>
                              quickToggleStudent(s.id, { contacted: e.target.checked })
                            }
                          />
                          <span>{(s as any).contacted ? "Yes" : "No"}</span>
                        </label>
                      </td>

                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={(s as any).visitCompleted ?? false}
                            onChange={(e) =>
                              quickToggleStudent(s.id, { visitCompleted: e.target.checked })
                            }
                          />
                          <span>{(s as any).visitCompleted ? "Yes" : "No"}</span>
                        </label>
                      </td>

                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="row">
                          <button className="btn" onClick={() => openEdit(s)}>
                            Edit
                          </button>
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
                      <td colSpan={11}>
                        <small>No students found.</small>
                      </td>
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
                  <button className="btn" onClick={() => setEditing(null)}>
                    Close
                  </button>
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

                <div className="row">
                  <select
                    value={editForm.schoolId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, schoolId: Number(e.target.value) })
                    }
                    style={{ flex: 1 }}
                  >
                    {schools.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={editForm.areaOfInterest}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        areaOfInterest: e.target.value as AreaOfInterest,
                      })
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="COSMETOLOGY">Cosmetology</option>
                    <option value="BARBER">Barber</option>
                    <option value="NAIL_TECHNICIAN">Nail Technician</option>
                  </select>
                </div>

                <div className="row" style={{ alignItems: "center", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editForm.contacted}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contacted: e.target.checked })
                      }
                    />
                    <span>Contacted</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editForm.visitCompleted}
                      onChange={(e) =>
                        setEditForm({ ...editForm, visitCompleted: e.target.checked })
                      }
                    />
                    <span>Had Visit</span>
                  </label>
                </div>

                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button className="btn primary" onClick={saveEdit}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
