"use client";

import { useState } from "react";
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

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_CLASSES: Record<HttpMethod, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  PATCH: "method-patch",
  DELETE: "method-delete",
  HEAD: "method-head",
  OPTIONS: "method-options",
};

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "form-data", label: "Form Data" },
  { value: "x-www-form-urlencoded", label: "URL Encoded" },
  { value: "raw", label: "Raw" },
];

interface RequestEditorProps {
  workspaceId: string;
}

export function RequestEditor({ workspaceId }: RequestEditorProps) {
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
  const setActiveAuth = useRequestStore((s) => s.setActiveAuth);
  const savedAuths = useRequestStore((s) => s.savedAuths);

  const tab = activeTabIndex >= 0 ? tabs[activeTabIndex] : null;
  if (!tab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-20">
        <div className="h-12 w-12 rounded-xl bg-surface-2 border border-border/30 flex items-center justify-center">
          <Send className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm">Open a request or create a new one</p>
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
      <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 border-b border-border/50">
        <div className="flex items-center gap-1.5 w-full">
          {!isWebSocket ? (
            <Select
              value={request.method}
              onValueChange={(v) => setMethod(v as HttpMethod)}
            >
              <SelectTrigger className="w-[90px] md:w-[100px] h-9 font-mono text-xs font-bold bg-surface-2 border-border/30 shrink-0">
                <SelectValue>
                  <span className={METHOD_CLASSES[request.method]}>{request.method}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className={`font-mono font-bold text-xs ${METHOD_CLASSES[m]}`}>{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="h-9 px-3 bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono text-xs shrink-0">
              WS
            </Badge>
          )}

          <Input
            value={request.url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 h-9 font-mono text-xs bg-surface-2 border-border/30 focus:border-volley/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isWebSocket) handleSend();
            }}
          />

          {!isWebSocket ? (
            <Button
              className="h-9 px-4 bg-volley hover:bg-volley-hover text-white font-medium text-xs shrink-0"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5 hidden sm:inline">Send</span>
            </Button>
          ) : (
            <Button
              className={`h-9 px-4 font-medium text-xs shrink-0 ${
                tab.wsConnected
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  : "bg-volley hover:bg-volley-hover text-white"
              }`}
            >
              {tab.wsConnected ? (
                <><Unplug className="h-3.5 w-3.5 mr-1.5" />Disconnect</>
              ) : (
                <><Plug className="h-3.5 w-3.5 mr-1.5" />Connect</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Protocol toggle */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30 bg-surface-1/30">
        <button
          className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
            !isWebSocket ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRequestType("HTTP")}
        >
          HTTP
        </button>
        <button
          className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
            isWebSocket ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRequestType("WEBSOCKET")}
        >
          WebSocket
        </button>
      </div>

      {/* Request config tabs */}
      <Tabs defaultValue="params" className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 bg-transparent border-b border-border/30 rounded-none w-full justify-start px-3 shrink-0 overflow-x-auto scrollbar-none gap-0">
          {["params", "headers", "body", "auth", "payloads"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="text-[11px] font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-volley rounded-none px-3 capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
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

/* ---------- Body Editor ---------- */

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
      <div className="flex flex-wrap items-center gap-1">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            onClick={() => onBodyTypeChange(bt.value)}
            className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${
              selectedType === bt.value
                ? "bg-volley/10 text-volley border border-volley/20"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-3 border border-transparent"
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {selectedType === "none" && (
        <p className="text-xs text-muted-foreground py-6 text-center">No body for this request.</p>
      )}

      {(selectedType === "json" || selectedType === "raw") && (
        <Textarea
          value={body ?? ""}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={selectedType === "json" ? '{\n  "key": "value"\n}' : "Enter raw body"}
          className="min-h-[200px] font-mono text-xs bg-surface-2 border-border/30 resize-y"
        />
      )}

      {(selectedType === "form-data" || selectedType === "x-www-form-urlencoded") && (
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

/* ---------- Auth Editor ---------- */

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
      <p className="text-xs text-muted-foreground py-6 text-center">
        No saved auth profiles. Create profiles in workspace settings.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Select value={activeAuthId ?? ""} onValueChange={(v) => onSetAuth(v || null)}>
        <SelectTrigger className="w-full h-8 text-xs bg-surface-2 border-border/30">
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
          <div className="space-y-2 p-3 rounded-lg bg-surface-2/50 border border-border/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-border/30">{auth.authType}</Badge>
              <span className="text-xs font-medium">{auth.name}</span>
            </div>
            {Object.entries(auth.credentials).map(([key, value]) => (
              <div key={key} className="text-[11px] font-mono">
                <span className="text-muted-foreground">{key}: </span>
                <span className="text-foreground">{value.substring(0, 20)}{value.length > 20 ? "..." : ""}</span>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="flex flex-wrap gap-1.5">
        {savedAuths.map((auth) => (
          <Button
            key={auth.id}
            variant={activeAuthId === auth.id ? "default" : "outline"}
            size="sm"
            className={`text-[11px] h-7 ${activeAuthId === auth.id ? "bg-volley hover:bg-volley-hover text-white" : "border-border/30"}`}
            onClick={() => onSetAuth(auth.id)}
          >
            {auth.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Payloads Editor ---------- */

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
        <span className="text-xs font-medium text-muted-foreground">Saved Payloads</span>
        <Button
          variant="outline"
          size="sm"
          className="text-[11px] h-7 border-border/30"
          onClick={saveAsPayload}
          disabled={saving}
        >
          <Save className="mr-1 h-3 w-3" />
          Save Current
        </Button>
      </div>

      {payloads.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No saved payloads yet.</p>
      ) : (
        <div className="space-y-1.5">
          {payloads.map((payload) => (
            <button
              key={payload.id}
              onClick={() => onApply(payload)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                activePayloadId === payload.id
                  ? "border-volley/30 bg-volley/5"
                  : "border-border/30 hover:border-border/60 bg-surface-2/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{payload.name}</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] border-border/30">{payload.bodyType}</Badge>
                  {payload.isShared && (
                    <Badge variant="secondary" className="text-[9px]">Shared</Badge>
                  )}
                </div>
              </div>
              {payload.body && (
                <p className="mt-1 text-[11px] font-mono text-muted-foreground truncate">
                  {payload.body.substring(0, 80)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
