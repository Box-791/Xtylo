const API_URL =
  (import.meta as any).env?.VITE_API_URL?.trim?.() || "http://localhost:4000";

/**
 * IMPORTANT:
 * Use enum (runtime export) instead of `export type` so Vite can import it at runtime.
 */
export enum AreaOfInterest {
  COSMETOLOGY = "COSMETOLOGY",
  BARBER = "BARBER",
  NAIL_TECHNICIAN = "NAIL_TECHNICIAN",
}

export const AREA_OF_INTEREST_LABEL: Record<AreaOfInterest, string> = {
  [AreaOfInterest.COSMETOLOGY]: "Cosmetology",
  [AreaOfInterest.BARBER]: "Barber",
  [AreaOfInterest.NAIL_TECHNICIAN]: "Nail Technician",
};

// ---------- Students ----------

export async function fetchStudents(params?: {
  schoolId?: number;
  campaignId?: number;
  areaOfInterest?: AreaOfInterest;
}) {
  const query = new URLSearchParams();

  if (params?.schoolId) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId) query.append("campaignId", String(params.campaignId));
  if (params?.areaOfInterest)
    query.append("areaOfInterest", String(params.areaOfInterest));

  const res = await fetch(`${API_URL}/students?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  schoolId: number;
  areaOfInterest?: AreaOfInterest;
  consent?: boolean;
}) {
  const res = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create student");
  return res.json();
}

export async function updateStudent(
  id: number,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    schoolId: number;
    areaOfInterest: AreaOfInterest;
    consent: boolean;
    contacted: boolean;
    toured: boolean;
  }>
) {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
}

export async function deleteStudent(id: number) {
  const res = await fetch(`${API_URL}/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete student");
}

export function exportCSV(campaignId?: number) {
  const qs = campaignId ? `?campaignId=${campaignId}` : "";
  window.open(`${API_URL}/students/export/csv${qs}`, "_blank");
}

// ---------- Schools ----------

export async function fetchSchools() {
  const res = await fetch(`${API_URL}/schools`);
  if (!res.ok) throw new Error("Failed to fetch schools");
  return res.json();
}

export async function createSchool(data: {
  name: string;
  city?: string;
  state?: string;
}) {
  const res = await fetch(`${API_URL}/schools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create school");
  return res.json();
}

export async function deleteSchool(id: number) {
  const res = await fetch(`${API_URL}/schools/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete school");
}

// ---------- Campaigns ----------

export async function fetchCampaigns() {
  const res = await fetch(`${API_URL}/campaigns`);
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function fetchActiveCampaign() {
  const res = await fetch(`${API_URL}/campaigns/active`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch active campaign");
  return res.json();
}

export async function createCampaign(name: string) {
  const res = await fetch(`${API_URL}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}

export async function activateCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}/activate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to activate campaign");
  return res.json();
}

export async function deactivateCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}/deactivate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to deactivate campaign");
  return res.json();
}

export async function deleteCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete campaign");
}
