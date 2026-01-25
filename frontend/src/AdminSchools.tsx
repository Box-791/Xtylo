import { useEffect, useState } from "react";
import { fetchSchools, createSchool, deleteSchool, School } from "./api";

export default function AdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchools();
      setSchools(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("School name is required.");
      return;
    }

    setSaving(true);
    try {
      await createSchool({
        name: trimmed,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });

      setName("");
      setCity("");
      setState("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create school");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this school?")) return;
    setError(null);

    try {
      await deleteSchool(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete school");
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Schools</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input
          placeholder="School name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} />
          <input placeholder="State (optional)" value={state} onChange={(e) => setState(e.target.value)} />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Adding..." : "Add School"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? (
        <p>Loading schools...</p>
      ) : schools.length === 0 ? (
        <p>No schools yet.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Name</th>
              <th align="left">City</th>
              <th align="left">State</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.city ?? "-"}</td>
                <td>{s.state ?? "-"}</td>
                <td>
                  <button onClick={() => onDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
