import { useEffect, useState } from "react";
import { createCampaign, deleteCampaign, fetchCampaigns, setActiveCampaign, deactivateCampaign } from "./api";

type Campaign = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const data = await fetchCampaigns();
    setCampaigns(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createCampaign(name.trim());
    setName("");
    await load();
  }

  async function onActivate(id: number) {
    await setActiveCampaign(id);
    await load();
  }

  async function onDeactivate() {
    await deactivateCampaign();
    await load();
  }

  async function onDelete(id: number) {
    const ok = confirm("Delete this campaign? This cannot be undone.");
    if (!ok) return;
    await deleteCampaign(id);
    await load();
  }

  return (
    <div className="card">
      <h2>Campaigns</h2>

      <form onSubmit={onCreate} className="row" style={{ marginBottom: 12 }}>
        <input
          placeholder="New campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn primary" type="submit">
          Add Campaign
        </button>
      </form>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th style={{ width: 300 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.isActive ? <span className="badge good">Active</span> : <span className="badge">Inactive</span>}</td>
                <td>{c.name}</td>
                <td>
                  <div className="row">
                    {!c.isActive ? (
                      <button className="btn good" type="button" onClick={() => onActivate(c.id)}>
                        Activate
                      </button>
                    ) : (
                      <button className="btn warn" type="button" onClick={onDeactivate}>
                        Deactivate
                      </button>
                    )}
                    <button className="btn bad" type="button" onClick={() => onDelete(c.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <small>No campaigns yet.</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
