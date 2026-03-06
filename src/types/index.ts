export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type RequestType = "HTTP" | "WEBSOCKET";
export type BodyType = "none" | "json" | "form-data" | "x-www-form-urlencoded" | "raw";
export type AuthType = "bearer" | "basic" | "api-key" | "custom";
export type WorkspaceRole = "MANAGER" | "CONSUMER";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface SavedPayload {
  id: string;
  name: string;
  bodyType: BodyType;
  body: string;
  headers: KeyValuePair[];
  isShared: boolean;
  userId?: string | null;
}

export interface SavedAuth {
  id: string;
  name: string;
  authType: AuthType;
  credentials: Record<string, string>;
  environmentId?: string | null;
}

export interface ApiRequest {
  id: string;
  name: string;
  type: RequestType;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyType: BodyType | null;
  body: string | null;
  folderId: string | null;
  workspaceId: string;
  savedPayloads: SavedPayload[];
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
  sortOrder: number;
  subFolders: Folder[];
  requests: ApiRequest[];
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  user: { name: string | null; email: string; image: string | null };
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export interface WebSocketMessage {
  id: string;
  direction: "sent" | "received";
  data: string;
  timestamp: number;
}
