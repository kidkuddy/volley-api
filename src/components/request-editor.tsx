"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyValueEditor } from "@/components/key-value-editor";
import { ResponseViewer } from "@/components/response-viewer";
import { WebSocketPanel } from "@/components/websocket-panel";
import { useRequestStore } from "@/stores/request-store";
import type { HttpMethod, BodyType, SavedPayload, SavedAuth } from "@/types";
import { Send, Loader2, Plug, Unplug, Save } from "lucide-react";
import { v4 as uuid } from "uuid";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-green-400",
  POST: "text-yellow-400",
  PUT: "text-blue-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
  HEAD: "text-purple-400",
  OPTIONS: "text-teal-400",
};

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "form-data", label: "Form Data" },
  { value: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
  { value: "raw", label: "Raw" },
];

interface RequestEditorProps {
  workspaceId: string;
}

export function RequestEditor({ workspaceId }: RequestEditorProps) {
  const [wsConnecting, setWsConnecting] = useState(false);

  const tabs = useRequestStore((s) => s.tabs);
  const activeTabIndex = useRequestStore((s) => s.activeTabIndex);
  const setMethod = useRequestStore((s) => s.setMethod);
  const setUrl = useRequestStore((s) => s.setUrl);
  const setBodyType = useRequestStore((s) => s.setBodyType);
  const setBody = useRequestStore((s) => s.setBody);
  const setRequestType = useRequestStore((s) => s.setRequestType);
  const addHeader = useRequestStore((s) => s.addHeader);
  const updateHeader = useRequestStore((s) => s.updateHeader);
  const removeHeader = useRequestStore((s) => s.removeHeader);
  const addQueryParam = useRequestStore((s) => s.addQueryParam);
  const updateQueryParam = useRequestStore((s) => s.updateQueryParam);
  const removeQueryParam = useRequestStore((s) => s.removeQueryParam);
  const setResponse = useRequestStore((s) => s.setResponse);
  const setLoading = useRequestStore((s) => s.setLoading);
  const resolveUrl = useRequestStore((s) => s.resolveUrl);
  const applyPayload = useRequestStore((s) => s.applyPayload);
  const setActivePayload = useRequestStore((s) => s.setActivePayload);
  const setActiveAuth = useRequestStore((s) => s.setActiveAuth);
  const savedAuths = useRequestStore((s) => s.savedAuths);

  const tab = activeTabIndex >= 0 ? tabs[activeTabIndex] : null;
  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Open a request or create a new one to get started</p>
      </div>
    );
  }

  const { request, response, loading } = tab;
  const isWebSocket = request.type === "WEBSOCKET";

  async function handleSend() {
    if (loading) return;
    setLoading(true);
    setResponse(null);

    try {
      const resolvedUrl = resolveUrl(request.url);
      const enabledHeaders: Record<string, string> = {};
      for (const h of request.headers) {
        if (h.enabled && h.key) {
          enabledHeaders[resolveUrl(h.key)] = resolveUrl(h.value);
        }
      }

      const enabledParams: Record<string, string> = {};
      for (const p of request.queryParams) {
        if (p.enabled && p.key) {
          enabledParams[resolveUrl(p.key)] = resolveUrl(p.value);
        }
      }

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: request.method,
          url: resolvedUrl,
          headers: enabledHeaders,
          queryParams: enabledParams,
          bodyType: request.bodyType,
          body: request.body ? resolveUrl(request.body) : null,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: err instanceof Error ? err.message : "Request failed",
        time: 0,
        size: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* URL bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {!isWebSocket ? (
            <Select
              value={request.method}
              onValueChange={(v) => setMethod(v as HttpMethod)}
            >
              <SelectTrigger className="w-[100px] md:w-[120px] h-9 font-mono text-sm font-semibold bg-muted/50 shrink-0">
                <SelectValue>
                  <span className={METHOD_COLORS[request.method]}>{request.method}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className={`font-mono font-semibold ${METHOD_COLORS[m]}`}>{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="h-9 px-3 bg-purple-600/20 text-purple-400 border-purple-600/30 font-mono text-sm shrink-0">
              WS
            </Badge>
          )}

          <Input
            value={request.url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL or paste text"
            className="flex-1 h-9 font-mono text-sm bg-background"
          />
        </div>

        {!isWebSocket ? (
          <Button
            className="h-9 w-full md:w-auto px-5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-medium shrink-0"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Send
          </Button>
        ) : (
          <Button
            className={`h-9 w-full md:w-auto px-5 font-medium shrink-0 ${
              tab.wsConnected
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
            }`}
            onClick={() => {
              // ws connect/disconnect handled in WebSocketPanel
            }}
          >
            {tab.wsConnected ? (
              <>
                <Unplug className="mr-1.5 h-4 w-4" />
                Disconnect
              </>
            ) : (
              <>
                <Plug className="mr-1.5 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>

      {/* Request type toggle */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20">
        <button
          className={`text-xs px-2 py-0.5 rounded ${
            !isWebSocket ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRequestType("HTTP")}
        >
          HTTP
        </button>
        <button
          className={`text-xs px-2 py-0.5 rounded ${
            isWebSocket ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRequestType("WEBSOCKET")}
        >
          WebSocket
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="params" className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 bg-transparent border-b border-border rounded-none w-full justify-start px-3 shrink-0 overflow-x-auto scrollbar-none">
          <TabsTrigger value="params" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Params
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Headers
          </TabsTrigger>
          <TabsTrigger value="body" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Body
          </TabsTrigger>
          <TabsTrigger value="auth" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Auth
          </TabsTrigger>
          <TabsTrigger value="payloads" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Payloads
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="params" className="mt-0 p-3">
            <KeyValueEditor
              items={request.queryParams}
              onChange={(id, updates) => updateQueryParam(id, updates)}
              onAdd={addQueryParam}
              onRemove={(id) => removeQueryParam(id)}
            />
          </TabsContent>

          <TabsContent value="headers" className="mt-0 p-3">
            <KeyValueEditor
              items={request.headers}
              onChange={(id, updates) => updateHeader(id, updates)}
              onAdd={addHeader}
              onRemove={(id) => removeHeader(id)}
            />
          </TabsContent>

          <TabsContent value="body" className="mt-0 p-3">
            <BodyEditor
              bodyType={request.bodyType}
              body={request.body}
              onBodyTypeChange={setBodyType}
              onBodyChange={setBody}
              headers={request.headers}
              onHeaderChange={(id, updates) => updateHeader(id, updates)}
              onHeaderAdd={addHeader}
              onHeaderRemove={(id) => removeHeader(id)}
            />
          </TabsContent>

          <TabsContent value="auth" className="mt-0 p-3">
            <AuthEditor
              savedAuths={savedAuths}
              activeAuthId={tab.activeAuthId}
              onSetAuth={setActiveAuth}
            />
          </TabsContent>

          <TabsContent value="payloads" className="mt-0 p-3">
            <PayloadsEditor
              payloads={request.savedPayloads}
              activePayloadId={tab.activePayloadId}
              onApply={applyPayload}
              workspaceId={workspaceId}
              requestId={request.id}
              currentBody={request.body}
              currentBodyType={request.bodyType}
              currentHeaders={request.headers}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Response / WebSocket panel */}
      {isWebSocket ? (
        <WebSocketPanel />
      ) : (
        response && <ResponseViewer response={response} />
      )}
    </div>
  );
}

/* ---------- Body Editor sub-component ---------- */

function BodyEditor({
  bodyType,
  body,
  onBodyTypeChange,
  onBodyChange,
  headers,
  onHeaderChange,
  onHeaderAdd,
  onHeaderRemove,
}: {
  bodyType: BodyType | null;
  body: string | null;
  onBodyTypeChange: (bt: BodyType) => void;
  onBodyChange: (b: string) => void;
  headers: import("@/types").KeyValuePair[];
  onHeaderChange: (id: string, updates: Partial<import("@/types").KeyValuePair>) => void;
  onHeaderAdd: () => void;
  onHeaderRemove: (id: string) => void;
}) {
  const selectedType = bodyType ?? "none";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            onClick={() => onBodyTypeChange(bt.value)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedType === bt.value
                ? "bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {selectedType === "none" && (
        <p className="text-sm text-muted-foreground py-4">This request does not have a body.</p>
      )}

      {(selectedType === "json" || selectedType === "raw") && (
        <Textarea
          value={body ?? ""}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={selectedType === "json" ? '{\n  "key": "value"\n}' : "Enter raw body"}
          className="min-h-[200px] font-mono text-sm bg-background resize-y"
        />
      )}

      {selectedType === "form-data" && (
        <KeyValueEditor
          items={headers}
          onChange={onHeaderChange}
          onAdd={onHeaderAdd}
          onRemove={onHeaderRemove}
        />
      )}

      {selectedType === "x-www-form-urlencoded" && (
        <KeyValueEditor
          items={headers}
          onChange={onHeaderChange}
          onAdd={onHeaderAdd}
          onRemove={onHeaderRemove}
        />
      )}
    </div>
  );
}

/* ---------- Auth Editor sub-component ---------- */

function AuthEditor({
  savedAuths,
  activeAuthId,
  onSetAuth,
}: {
  savedAuths: SavedAuth[];
  activeAuthId: string | null;
  onSetAuth: (id: string | null) => void;
}) {
  if (savedAuths.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No saved auth profiles. Create auth profiles in workspace settings.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Select value={activeAuthId ?? ""} onValueChange={(v) => onSetAuth(v || null)}>
        <SelectTrigger className="w-full h-9 text-sm bg-background">
          <SelectValue placeholder="Select auth profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {savedAuths.map((auth) => (
            <SelectItem key={auth.id} value={auth.id}>
              {auth.name} ({auth.authType})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeAuthId && (() => {
        const auth = savedAuths.find((a) => a.id === activeAuthId);
        if (!auth) return null;
        return (
          <div className="space-y-2 p-3 rounded-md bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{auth.authType}</Badge>
              <span className="text-sm font-medium">{auth.name}</span>
            </div>
            {Object.entries(auth.credentials).map(([key, value]) => (
              <div key={key} className="text-xs font-mono">
                <span className="text-muted-foreground">{key}: </span>
                <span className="text-foreground">{value.substring(0, 20)}{value.length > 20 ? "..." : ""}</span>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="flex flex-wrap gap-2">
        {savedAuths.map((auth) => (
          <Button
            key={auth.id}
            variant={activeAuthId === auth.id ? "default" : "outline"}
            size="sm"
            className={`text-xs ${activeAuthId === auth.id ? "bg-[#FF6B35] hover:bg-[#e55a2b] text-white" : ""}`}
            onClick={() => onSetAuth(auth.id)}
          >
            Run as {auth.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Payloads Editor sub-component ---------- */

function PayloadsEditor({
  payloads,
  activePayloadId,
  onApply,
  workspaceId,
  requestId,
  currentBody,
  currentBodyType,
  currentHeaders,
}: {
  payloads: SavedPayload[];
  activePayloadId: string | null;
  onApply: (payload: SavedPayload) => void;
  workspaceId: string;
  requestId: string;
  currentBody: string | null;
  currentBodyType: BodyType | null;
  currentHeaders: import("@/types").KeyValuePair[];
}) {
  const [saving, setSaving] = useState(false);

  async function saveAsPayload() {
    const name = prompt("Payload name:");
    if (!name) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${workspaceId}/requests/${requestId}/payloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bodyType: currentBodyType ?? "none",
          body: currentBody ?? "",
          headers: currentHeaders,
          isShared: false,
        }),
      });
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Saved Payloads</span>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={saveAsPayload}
          disabled={saving}
        >
          <Save className="mr-1 h-3 w-3" />
          Save Current as Payload
        </Button>
      </div>

      {payloads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No saved payloads yet.</p>
      ) : (
        <div className="space-y-2">
          {payloads.map((payload) => (
            <button
              key={payload.id}
              onClick={() => onApply(payload)}
              className={`w-full text-left p-3 rounded-md border transition-colors ${
                activePayloadId === payload.id
                  ? "border-[#FF6B35]/50 bg-[#FF6B35]/5"
                  : "border-border hover:border-border/80 bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{payload.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{payload.bodyType}</Badge>
                  {payload.isShared && (
                    <Badge variant="secondary" className="text-[10px]">Shared</Badge>
                  )}
                </div>
              </div>
              {payload.body && (
                <p className="mt-1 text-xs font-mono text-muted-foreground truncate">
                  {payload.body.substring(0, 100)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
