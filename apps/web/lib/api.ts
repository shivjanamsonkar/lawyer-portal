export type Client = {
  id: string;
  advocate_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
};

export type Advocate = { id: string; full_name: string; email: string; phone: string; created_at: string };

export type CaseRecord = {
  id: string;
  advocate_id: string;
  client_id: string | null;
  cnr_number: string | null;
  case_number: string;
  court_name: string;
  court_room: string | null;
  judge_name: string | null;
  petitioner: string;
  respondent: string;
  case_type: string;
  stage: string;
  next_hearing_date: string | null;
  agreed_fee: string;
  preparation_notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  case_id: string;
  amount_paid: string;
  payment_mode: string;
  payment_date: string;
  notes: string | null;
};

export type LedgerRecord = {
  case_id: string;
  case_number: string;
  petitioner: string;
  respondent: string;
  client_name: string | null;
  client_phone: string | null;
  agreed_fee: string;
  received_amount: string;
  pending_balance: string;
};

const apiBase = "/api/backend";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${window.location.origin}${apiBase}${path}`, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API request failed (${response.status}): ${detail || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const listCases = (): Promise<CaseRecord[]> => request<CaseRecord[]>("/cases");
export const listClients = (): Promise<Client[]> => request<Client[]>("/clients");
export const listPayments = (caseId: string): Promise<Payment[]> => request<Payment[]>(`/cases/${caseId}/payments`);
export const listLedger = (): Promise<LedgerRecord[]> => request<LedgerRecord[]>("/ledger");
export type AccountStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISABLED";
export type AdminUser = { id: string; full_name: string; phone: string; email: string; role: string; status: AccountStatus; created_at: string };

export type SessionUser = { id: string; full_name: string; phone: string; email: string; role: string; status: AccountStatus };

export async function signUp(payload: { full_name: string; phone: string; email: string; chamber_address: string; password: string }): Promise<{ message: string; status: AccountStatus }> {
  const response = await fetch(`${window.location.origin}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error((await response.json()).detail ?? "Could not create account.");
  return response.json();
}

export async function logIn(payload: { phone: string; password: string }): Promise<{ user: SessionUser; must_change_password: boolean }> {
  const response = await fetch(`${window.location.origin}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail ?? "Could not sign in.");
  return data;
}

export async function logOut(): Promise<void> {
  await fetch(`${window.location.origin}/api/auth/logout`, { method: "POST" });
}

export const listAdminUsers = (): Promise<AdminUser[]> => request<AdminUser[]>("/admin/users");
export const updateUserStatus = (id: string, status: AccountStatus): Promise<AdminUser> => request<AdminUser>(`/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
export const resetUserPassword = (id: string): Promise<{ temporary_password: string }> => request(`/admin/users/${id}/reset-password`, { method: "POST" });
export type ClientPayload = Omit<Client, "id" | "created_at" | "advocate_id">;
export type CasePayload = Omit<CaseRecord, "id" | "created_at" | "advocate_id">;
export const createClient = (payload: ClientPayload): Promise<Client> => request<Client>("/clients", { method: "POST", body: JSON.stringify(payload) });
export const updateClient = (id: string, payload: ClientPayload): Promise<Client> => request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteClient = (id: string): Promise<void> => request<void>(`/clients/${id}`, { method: "DELETE" });
export const createCase = (payload: CasePayload): Promise<CaseRecord> => request<CaseRecord>("/cases", { method: "POST", body: JSON.stringify(payload) });
export const updateCase = (id: string, payload: CasePayload): Promise<CaseRecord> => request<CaseRecord>(`/cases/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteCase = (id: string): Promise<void> => request<void>(`/cases/${id}`, { method: "DELETE" });
export const createPayment = (caseId: string, payload: { amount_paid: string; payment_mode: string; notes?: string }): Promise<Payment> => request<Payment>(`/cases/${caseId}/payments`, { method: "POST", body: JSON.stringify(payload) });