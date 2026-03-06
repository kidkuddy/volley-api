import { create } from "zustand";
import type {
  ApiRequest,
  HttpMethod,
  RequestType,
  BodyType,
  KeyValuePair,
  ResponseData,
  WebSocketMessage,
  SavedPayload,
  SavedAuth,
  Environment,
} from "@/types";
import { v4 as uuid } from "uuid";

interface RequestTab {
  request: ApiRequest;
  response: ResponseData | null;
  loading: boolean;
  wsConnected: boolean;
  wsMessages: WebSocketMessage[];
  activePayloadId: string | null;
  activeAuthId: string | null;
  dirty: boolean;
}

interface RequestStore {
  tabs: RequestTab[];
  activeTabIndex: number;
  activeEnvironment: Environment | null;
  environments: Environment[];
  savedAuths: SavedAuth[];

  // Tab management
  openTab: (request: ApiRequest) => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  newTab: (workspaceId: string) => void;

  // Request editing
  updateRequest: (updates: Partial<ApiRequest>) => void;
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setRequestType: (type: RequestType) => void;
  setBodyType: (bodyType: BodyType) => void;
  setBody: (body: string) => void;
  addHeader: () => void;
  updateHeader: (id: string, updates: Partial<KeyValuePair>) => void;
  removeHeader: (id: string) => void;
  addQueryParam: () => void;
  updateQueryParam: (id: string, updates: Partial<KeyValuePair>) => void;
  removeQueryParam: (id: string) => void;

  // Response
  setResponse: (response: ResponseData | null) => void;
  setLoading: (loading: boolean) => void;

  // WebSocket
  setWsConnected: (connected: boolean) => void;
  addWsMessage: (message: WebSocketMessage) => void;
  clearWsMessages: () => void;

  // Payloads
  setActivePayload: (payloadId: string | null) => void;
  applyPayload: (payload: SavedPayload) => void;

  // Auth
  setActiveAuth: (authId: string | null) => void;
  setSavedAuths: (auths: SavedAuth[]) => void;

  // Environment
  setActiveEnvironment: (env: Environment | null) => void;
  setEnvironments: (envs: Environment[]) => void;
  resolveUrl: (url: string) => string;
}

function createEmptyRequest(workspaceId: string): ApiRequest {
  return {
    id: `new-${uuid()}`,
    name: "New Request",
    type: "HTTP",
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    bodyType: null,
    body: null,
    folderId: null,
    workspaceId,
    savedPayloads: [],
  };
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  tabs: [],
  activeTabIndex: -1,
  activeEnvironment: null,
  environments: [],
  savedAuths: [],

  openTab: (request) => {
    const { tabs } = get();
    const existingIndex = tabs.findIndex((t) => t.request.id === request.id);
    if (existingIndex !== -1) {
      set({ activeTabIndex: existingIndex });
      return;
    }
    const newTab: RequestTab = {
      request,
      response: null,
      loading: false,
      wsConnected: false,
      wsMessages: [],
      activePayloadId: null,
      activeAuthId: null,
      dirty: false,
    };
    set({ tabs: [...tabs, newTab], activeTabIndex: tabs.length });
  },

  closeTab: (index) => {
    const { tabs, activeTabIndex } = get();
    const newTabs = tabs.filter((_, i) => i !== index);
    let newActiveIndex = activeTabIndex;
    if (index === activeTabIndex) {
      newActiveIndex = Math.min(index, newTabs.length - 1);
    } else if (index < activeTabIndex) {
      newActiveIndex = activeTabIndex - 1;
    }
    set({ tabs: newTabs, activeTabIndex: newActiveIndex });
  },

  setActiveTab: (index) => set({ activeTabIndex: index }),

  newTab: (workspaceId) => {
    const { tabs } = get();
    const newTab: RequestTab = {
      request: createEmptyRequest(workspaceId),
      response: null,
      loading: false,
      wsConnected: false,
      wsMessages: [],
      activePayloadId: null,
      activeAuthId: null,
      dirty: true,
    };
    set({ tabs: [...tabs, newTab], activeTabIndex: tabs.length });
  },

  updateRequest: (updates) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = {
      ...newTabs[activeTabIndex],
      request: { ...newTabs[activeTabIndex].request, ...updates },
      dirty: true,
    };
    set({ tabs: newTabs });
  },

  setMethod: (method) => get().updateRequest({ method }),
  setUrl: (url) => get().updateRequest({ url }),
  setRequestType: (type) => get().updateRequest({ type }),
  setBodyType: (bodyType) => get().updateRequest({ bodyType }),
  setBody: (body) => get().updateRequest({ body }),

  addHeader: () => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      headers: [...req.headers, { id: uuid(), key: "", value: "", enabled: true }],
    });
  },

  updateHeader: (id, updates) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      headers: req.headers.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    });
  },

  removeHeader: (id) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      headers: req.headers.filter((h) => h.id !== id),
    });
  },

  addQueryParam: () => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      queryParams: [...req.queryParams, { id: uuid(), key: "", value: "", enabled: true }],
    });
  },

  updateQueryParam: (id, updates) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      queryParams: req.queryParams.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  },

  removeQueryParam: (id) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const req = tabs[activeTabIndex].request;
    get().updateRequest({
      queryParams: req.queryParams.filter((p) => p.id !== id),
    });
  },

  setResponse: (response) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], response };
    set({ tabs: newTabs });
  },

  setLoading: (loading) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], loading };
    set({ tabs: newTabs });
  },

  setWsConnected: (connected) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], wsConnected: connected };
    set({ tabs: newTabs });
  },

  addWsMessage: (message) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = {
      ...newTabs[activeTabIndex],
      wsMessages: [...newTabs[activeTabIndex].wsMessages, message],
    };
    set({ tabs: newTabs });
  },

  clearWsMessages: () => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], wsMessages: [] };
    set({ tabs: newTabs });
  },

  setActivePayload: (payloadId) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], activePayloadId: payloadId };
    set({ tabs: newTabs });
  },

  applyPayload: (payload) => {
    get().updateRequest({
      bodyType: payload.bodyType,
      body: payload.body,
      headers: payload.headers.length > 0 ? payload.headers : get().tabs[get().activeTabIndex]?.request.headers || [],
    });
    get().setActivePayload(payload.id);
  },

  setActiveAuth: (authId) => {
    const { tabs, activeTabIndex } = get();
    if (activeTabIndex < 0) return;
    const newTabs = [...tabs];
    newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], activeAuthId: authId };
    set({ tabs: newTabs });
  },

  setSavedAuths: (auths) => set({ savedAuths: auths }),

  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  setEnvironments: (envs) => set({ environments: envs }),

  resolveUrl: (url) => {
    const { activeEnvironment } = get();
    if (!activeEnvironment) return url;
    let resolved = url;
    for (const v of activeEnvironment.variables as { key: string; value: string; enabled: boolean }[]) {
      if (v.enabled) {
        resolved = resolved.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, "g"), v.value);
      }
    }
    return resolved;
  },
}));
