import { useEffect, useState } from "react";
import {
  fetchCampaigns,
  createCampaign,
  activateCampaign,
} from "./api";

interface Campaign {
  id: number;
  name: string;
  isActive: boolean;
}

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    await createCampaign({ name });
    setName("");
    load();
  }

  async function activate(id: number) {
    await activateCampaign(id);
    load();
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Campaigns</h2>

      <form onSubmit={submit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: 10 }}>
          Create
        </button>
      </form>

      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.isActive ? "ACTIVE" : "inactive"}</td>
              <td>
                {!c.isActive && (
                  <button onClick={() => activate(c.id)}>
                    Activate
                  </button>
                )}
              </td>
            </tr>
          ))}

          {campaigns.length === 0 && (
            <tr>
              <td colSpan={3}>No campaigns</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
