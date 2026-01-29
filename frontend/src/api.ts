const API_URL =
  (import.meta as any).env?.VITE_API_URL?.toString?.() || "http://localhost:4000";

/**
 * Runtime enum values (used in UI)
 */
export const AREA_OF_INTERESTS = [
  "COSMETOLOGY",
  "BARBER",
  "NAIL_TECHNICIAN",
] as const;

/**
 * Type derived from runtime constant
 */
export type AreaOfInterest = (typeof AREA_OF_INTERESTS)[number];

export const AREA_OF_INTEREST_LABEL: Record<AreaOfInterest, string> = {
  COSMETOLOGY: "Cosmetology",
  BARBER: "Barber",
  NAIL_TECHNICIAN: "Nail Technician",
};

/**
 * Shared types (import these with `import type { ... }` in TSX files)
 */
export type School = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
};

export type Campaign = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
};

export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  areaOfInterest?: AreaOfInterest | string | null;
  contacted?: boolean;
  visitCompleted?: boolean;
  school: School;
  campaign: Campaign;
};

async function jsonOrThrow(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Bad JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/**
 * Students
 */
export async function fetchStudents(params?: {
  schoolId?: number;
  campaignId?: number;
  areaOfInterest?: AreaOfInterest;
  contacted?: boolean;
  visitCompleted?: boolean;
}) {
  const query = new URLSearchParams();

  // ✅ IMPORTANT: don't use truthy checks; allow 0 and false
  if (params?.schoolId !== undefined) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId !== undefined) query.append("campaignId", String(params.campaignId));
  if (params?.areaOfInterest !== undefined) query.append("areaOfInterest", params.areaOfInterest);

  // ✅ allow sending false
  if (params?.contacted !== undefined) query.append("contacted", String(params.contacted));
  if (params?.visitCompleted !== undefined) query.append("visitCompleted", String(params.visitCompleted));

  const qs = query.toString();
  const res = await fetch(`${API_URL}/students${qs ? `?${qs}` : ""}`);
  return jsonOrThrow(res) as Promise<Student[]>;
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  schoolId: number;
  areaOfInterest: AreaOfInterest;
}) {
  const res = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

export async function updateStudent(
  id: number,
  data: Partial<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    schoolId: number;
    areaOfInterest: AreaOfInterest;
    contacted: boolean;
    visitCompleted: boolean;
  }>
) {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

export async function deleteStudent(id: number) {
  const res = await fetch(`${API_URL}/students/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to delete student (${res.status})`);
  }
}

/**
 * CSV export
 * (supports the same filters as fetchStudents)
 */
export function exportCSV(params?: {
  schoolId?: number;
  campaignId?: number;
  areaOfInterest?: AreaOfInterest;
  contacted?: boolean;
  visitCompleted?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.schoolId !== undefined) query.append("schoolId", String(params.schoolId));
  if (params?.campaignId !== undefined) query.append("campaignId", String(params.campaignId));
  if (params?.areaOfInterest !== undefined) query.append("areaOfInterest", params.areaOfInterest);
  if (params?.contacted !== undefined) query.append("contacted", String(params.contacted));
  if (params?.visitCompleted !== undefined) query.append("visitCompleted", String(params.visitCompleted));

  const qs = query.toString();
  window.open(`${API_URL}/students/export/csv${qs ? `?${qs}` : ""}`, "_blank");
}

/**
 * Schools
 */
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
  return jsonOrThrow(res);
}

export async function deleteSchool(id: number) {
  const res = await fetch(`${API_URL}/schools/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to delete school (${res.status})`);
  }
}

/**
 * Campaigns
 */
export async function fetchCampaigns() {
  const res = await fetch(`${API_URL}/campaigns`);
  return jsonOrThrow(res) as Promise<Campaign[]>;
}

export async function createCampaign(name: string) {
  const res = await fetch(`${API_URL}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return jsonOrThrow(res);
}

export async function activateCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}/activate`, { method: "POST" });
  return jsonOrThrow(res);
}

export async function deactivateCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}/deactivate`, { method: "POST" });
  return jsonOrThrow(res);
}

export async function deleteCampaign(id: number) {
  const res = await fetch(`${API_URL}/campaigns/${id}`, { method: "DELETE" });
  return jsonOrThrow(res);
}

export async function fetchActiveCampaign() {
  const res = await fetch(`${API_URL}/campaigns/active`);
  return jsonOrThrow(res) as Promise<Campaign>;
}

export type TourStatus = "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

export type TourVisit = {
  id: number;
  studentId: number;
  startsAt: string;
  status: TourStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student: Student;
};

export async function fetchToursByDate(date: string) {
  const query = new URLSearchParams();
  query.append("date", date);
  const res = await fetch(`${API_URL}/tours?${query.toString()}`);
  return jsonOrThrow(res) as Promise<TourVisit[]>;
}

export async function createTour(data: { studentId: number; startsAt: string; notes?: string }) {
  const res = await fetch(`${API_URL}/tours`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

export async function updateTour(
  id: number,
  data: Partial<{ startsAt: string; status: TourStatus; notes: string | null }>
) {
  const res = await fetch(`${API_URL}/tours/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

export async function deleteTour(id: number) {
  const res = await fetch(`${API_URL}/tours/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to delete tour (${res.status})`);
  }
}

function adminHeaders() {
  const pin = localStorage.getItem("ADMIN_PIN") || "";
  return {
    "Content-Type": "application/json",
    "x-admin-pin": pin,
  };
}

export async function sendBulkSMS(data: { studentIds: number[]; message: string }) {
  const res = await fetch(`${API_URL}/outreach/sms`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

