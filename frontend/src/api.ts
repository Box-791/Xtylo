const DEV_API = "http://localhost:4000";
const API_URL = import.meta.env.DEV ? DEV_API : "/api";

function getAdminPin() {
  return localStorage.getItem("ADMIN_PIN") || "";
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("x-admin-pin", getAdminPin());
  if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res;
}

/** PUBLIC */
export async function fetchSchools() {
  const res = await fetch(`${API_URL}/schools`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchActiveCampaign() {
  const res = await fetch(`${API_URL}/campaigns/active`);
  if (!res.ok) return null;
  return res.json();
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  schoolId: number;
  consent?: boolean;
}) {
  const res = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** ADMIN */
export async function fetchStudents(params?: { schoolId?: number; campaignId?: number }) {
  const query = new URLSearchParams();
  if (params?.schoolId) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId) query.append("campaignId", String(params.campaignId));

  const res = await adminFetch(`/students?${query.toString()}`);
  return res.json();
}

export async function updateStudent(
  id: number,
  data: { firstName?: string; lastName?: string; email?: string; phone?: string; schoolId?: number }
) {
  const res = await adminFetch(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteStudent(id: number) {
  await adminFetch(`/students/${id}`, { method: "DELETE" });
}

export async function fetchCampaigns() {
  const res = await adminFetch(`/campaigns`);
  return res.json();
}

export async function createCampaign(name: string) {
  const res = await adminFetch(`/campaigns`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function activateCampaign(id: number) {
  const res = await adminFetch(`/campaigns/${id}/activate`, { method: "POST" });
  return res.json();
}

export async function deactivateCampaign(id: number) {
  const res = await adminFetch(`/campaigns/${id}/deactivate`, { method: "POST" });
  return res.json();
}

export async function deactivateAllCampaigns() {
  const res = await adminFetch(`/campaigns/deactivate`, { method: "POST" });
  return res.json();
}

export async function deleteCampaign(id: number) {
  await adminFetch(`/campaigns/${id}`, { method: "DELETE" });
}

export async function createSchool(data: { name: string; city?: string; state?: string }) {
  const res = await adminFetch(`/schools`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSchool(id: number) {
  await adminFetch(`/schools/${id}`, { method: "DELETE" });
}

/**
 * ADMIN: Export CSV
 * If campaignId is provided -> exports ONLY that campaign
 */
export async function exportCSV(campaignId?: number) {
  const qs = campaignId ? `?campaignId=${campaignId}` : "";
  const res = await adminFetch(`/students/export/csv${qs}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = campaignId ? `students_campaign_${campaignId}.csv` : "students_all.csv";
  a.click();
  URL.revokeObjectURL(url);
}
