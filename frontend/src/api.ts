// Use localhost in dev, nginx proxy (/api) in production docker.
const API_URL = import.meta.env.DEV ? "http://localhost:4000" : "/api";

export interface School {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
}

export interface Campaign {
  id: number;
  name: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  school: { id: number; name: string };
  campaign: { id: number; name: string };
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

/* =========================
   STUDENTS
   ========================= */
export async function fetchStudents(params?: { schoolId?: number; campaignId?: number }) {
  const query = new URLSearchParams();
  if (params?.schoolId) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId) query.append("campaignId", String(params.campaignId));

  const res = await fetch(`${API_URL}/students?${query.toString()}`);
  return jsonOrThrow(res) as Promise<Student[]>;
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  schoolId: number;
  // NOTE: kiosk/public intake should not pass campaignId; backend assigns active campaign
  campaignId?: number;
}) {
  const res = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return jsonOrThrow(res);
}

export async function updateStudent(id: number, data: Partial<{ firstName: string; lastName: string; email: string | null; phone: string | null }>) {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return jsonOrThrow(res);
}

export async function deleteStudent(id: number) {
  const res = await fetch(`${API_URL}/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete student (${res.status})`);
}

/* =========================
   SCHOOLS
   ========================= */
export async function fetchSchools() {
  const res = await fetch(`${API_URL}/schools`);
  return jsonOrThrow(res) as Promise<School[]>;
}

export async function createSchool(data: { name: string; city?: string; state?: string }) {
  const res = await fetch(`${API_URL}/schools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return jsonOrThrow(res) as Promise<School>;
}

export async function deleteSchool(id: number) {
  const res = await fetch(`${API_URL}/schools/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete school (${res.status})`);
}

/* =========================
   CAMPAIGNS
   ========================= */
export async function fetchCampaigns() {
  const res = await fetch(`${API_URL}/campaigns`);
  return jsonOrThrow(res) as Promise<Campaign[]>;
}

export async function fetchActiveCampaign() {
  const res = await fetch(`${API_URL}/campaigns/active`);
  return jsonOrThrow(res) as Promise<Campaign>;
}

export async function activateCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}/activate`, { method: "POST" });
  return jsonOrThrow(res) as Promise<Campaign>;
}

export async function deactivateAllCampaigns() {
  // Optional helper if you implement it on backend later.
  // Leaving here for compatibility; you can remove if unused.
  return;
}

export function exportCSV(params?: { schoolId?: number; campaignId?: number }) {
  const query = new URLSearchParams();
  if (params?.schoolId) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId) query.append("campaignId", String(params.campaignId));
  window.open(`${API_URL}/students/export/csv?${query.toString()}`, "_blank");
}
