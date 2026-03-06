const BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  // Workspaces
  getWorkspaces: () => request<any[]>("/api/workspaces"),
  createWorkspace: (data: { name: string }) =>
    request<any>("/api/workspaces", { method: "POST", body: JSON.stringify(data) }),
  getWorkspace: (id: string) => request<any>(`/api/workspaces/${id}`),
  updateWorkspace: (id: string, data: any) =>
    request<any>(`/api/workspaces/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorkspace: (id: string) =>
    request<any>(`/api/workspaces/${id}`, { method: "DELETE" }),

  // Members
  getMembers: (wId: string) => request<any[]>(`/api/workspaces/${wId}/members`),
  inviteMember: (wId: string, data: { email: string; role: string }) =>
    request<any>(`/api/workspaces/${wId}/members`, { method: "POST", body: JSON.stringify(data) }),
  updateMember: (wId: string, mId: string, data: { role: string }) =>
    request<any>(`/api/workspaces/${wId}/members/${mId}`, { method: "PUT", body: JSON.stringify(data) }),
  removeMember: (wId: string, mId: string) =>
    request<any>(`/api/workspaces/${wId}/members/${mId}`, { method: "DELETE" }),

  // Folders
  getFolders: (wId: string) => request<any[]>(`/api/workspaces/${wId}/folders`),
  createFolder: (wId: string, data: { name: string; parentFolderId?: string }) =>
    request<any>(`/api/workspaces/${wId}/folders`, { method: "POST", body: JSON.stringify(data) }),
  updateFolder: (wId: string, fId: string, data: { name: string }) =>
    request<any>(`/api/workspaces/${wId}/folders/${fId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFolder: (wId: string, fId: string) =>
    request<any>(`/api/workspaces/${wId}/folders/${fId}`, { method: "DELETE" }),

  // Requests
  getRequests: (wId: string) => request<any[]>(`/api/workspaces/${wId}/requests`),
  createRequest: (wId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/requests`, { method: "POST", body: JSON.stringify(data) }),
  getRequest: (wId: string, rId: string) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}`),
  updateRequest: (wId: string, rId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRequest: (wId: string, rId: string) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}`, { method: "DELETE" }),

  // Saved Payloads
  getPayloads: (wId: string, rId: string) =>
    request<any[]>(`/api/workspaces/${wId}/requests/${rId}/payloads`),
  createPayload: (wId: string, rId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}/payloads`, { method: "POST", body: JSON.stringify(data) }),
  updatePayload: (wId: string, rId: string, pId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}/payloads/${pId}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePayload: (wId: string, rId: string, pId: string) =>
    request<any>(`/api/workspaces/${wId}/requests/${rId}/payloads/${pId}`, { method: "DELETE" }),

  // Environments
  getEnvironments: (wId: string) => request<any[]>(`/api/workspaces/${wId}/environments`),
  createEnvironment: (wId: string, data: { name: string }) =>
    request<any>(`/api/workspaces/${wId}/environments`, { method: "POST", body: JSON.stringify(data) }),
  updateEnvironment: (wId: string, eId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/environments/${eId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEnvironment: (wId: string, eId: string) =>
    request<any>(`/api/workspaces/${wId}/environments/${eId}`, { method: "DELETE" }),
  activateEnvironment: (wId: string, eId: string) =>
    request<any>(`/api/workspaces/${wId}/environments/${eId}/activate`, { method: "POST" }),

  // Saved Auths
  getAuths: (wId: string) => request<any[]>(`/api/workspaces/${wId}/auths`),
  createAuth: (wId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/auths`, { method: "POST", body: JSON.stringify(data) }),
  updateAuth: (wId: string, aId: string, data: any) =>
    request<any>(`/api/workspaces/${wId}/auths/${aId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAuth: (wId: string, aId: string) =>
    request<any>(`/api/workspaces/${wId}/auths/${aId}`, { method: "DELETE" }),
  syncToken: (wId: string, data: { token: string; environmentId?: string }) =>
    request<any>(`/api/workspaces/${wId}/auths/sync-token`, { method: "POST", body: JSON.stringify(data) }),

  // Proxy
  sendRequest: (data: { url: string; method: string; headers: any; body: any; queryParams: any }) =>
    request<any>("/api/proxy", { method: "POST", body: JSON.stringify(data) }),
};
