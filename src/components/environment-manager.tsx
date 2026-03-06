"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KeyValueEditor } from "@/components/key-value-editor";
import { useRequestStore } from "@/stores/request-store";
import type { Environment, EnvironmentVariable } from "@/types";
import { Settings2, Plus, Check, RefreshCw, Trash2 } from "lucide-react";
import { v4 as uuid } from "uuid";

interface EnvironmentManagerProps {
  workspaceId: string;
  trigger?: React.ReactNode;
}

const TOKEN_KEYS = ["token", "access_token", "bearer_token", "AUTH_TOKEN"];

export function EnvironmentManager({ workspaceId, trigger }: EnvironmentManagerProps) {
  const environments = useRequestStore((s) => s.environments);
  const setEnvironments = useRequestStore((s) => s.setEnvironments);
  const activeEnvironment = useRequestStore((s) => s.activeEnvironment);
  const setActiveEnvironment = useRequestStore((s) => s.setActiveEnvironment);

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVars, setEditVars] = useState<EnvironmentVariable[]>([]);
  const [syncToken, setSyncToken] = useState("");
  const [open, setOpen] = useState(false);

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  useEffect(() => {
    if (selectedEnv) {
      setEditName(selectedEnv.name);
      setEditVars([...selectedEnv.variables]);
    }
  }, [selectedEnvId]);

  async function fetchEnvironments() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/environments`);
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data);
      }
    } catch {
      // silently handle
    }
  }

  useEffect(() => {
    if (open) fetchEnvironments();
  }, [open]);

  async function handleCreate() {
    const name = prompt("Environment name:");
    if (!name) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await fetchEnvironments();
      }
    } catch {
      // silently handle
    }
  }

  async function handleSave() {
    if (!selectedEnvId) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/environments/${selectedEnvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, variables: editVars }),
      });
      await fetchEnvironments();
    } catch {
      // silently handle
    }
  }

  async function handleDelete(envId: string) {
    if (!confirm("Delete this environment?")) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/environments/${envId}`, {
        method: "DELETE",
      });
      if (selectedEnvId === envId) setSelectedEnvId(null);
      await fetchEnvironments();
    } catch {
      // silently handle
    }
  }

  async function handleActivate(envId: string) {
    try {
      await fetch(`/api/workspaces/${workspaceId}/environments/${envId}/activate`, {
        method: "POST",
      });
      await fetchEnvironments();
      const env = environments.find((e) => e.id === envId);
      if (env) setActiveEnvironment(env);
    } catch {
      // silently handle
    }
  }

  function handleSyncToken() {
    if (!syncToken.trim()) return;
    const updated = environments.map((env) => ({
      ...env,
      variables: env.variables.map((v) =>
        TOKEN_KEYS.includes(v.key) ? { ...v, value: syncToken.trim() } : v
      ),
    }));
    setEnvironments(updated);

    // Also update each environment via API
    for (const env of updated) {
      fetch(`/api/workspaces/${workspaceId}/environments/${env.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: env.name, variables: env.variables }),
      }).catch(() => {});
    }
    setSyncToken("");
  }

  function handleVarChange(id: string, updates: Partial<EnvironmentVariable>) {
    setEditVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  }

  function handleVarAdd() {
    setEditVars((prev) => [
      ...prev,
      { id: uuid(), key: "", value: "", enabled: true },
    ]);
  }

  function handleVarRemove(id: string) {
    setEditVars((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-xs">
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            Environments
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Environment Manager</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* Environment list */}
          <div className="w-[180px] border-r border-border flex flex-col">
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleCreate}
              >
                <Plus className="mr-1 h-3 w-3" />
                Create
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-0.5 p-1">
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-colors ${
                      selectedEnvId === env.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {env.isActive && (
                      <Check className="h-3 w-3 text-green-400 shrink-0" />
                    )}
                    <span className="truncate">{env.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Token sync */}
            <div className="p-2 border-t border-border space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Sync Token</Label>
              <Input
                value={syncToken}
                onChange={(e) => setSyncToken(e.target.value)}
                placeholder="Paste token..."
                className="h-7 text-xs bg-background"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={handleSyncToken}
                disabled={!syncToken.trim()}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Sync
              </Button>
            </div>
          </div>

          {/* Edit panel */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedEnv ? (
              <>
                <div className="p-3 space-y-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm font-medium bg-background w-40"
                      />
                      {selectedEnv.isActive && (
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!selectedEnv.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleActivate(selectedEnv.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(selectedEnv.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Variables</Label>
                  <KeyValueEditor
                    items={editVars}
                    onChange={handleVarChange}
                    onAdd={handleVarAdd}
                    onRemove={handleVarRemove}
                  />
                </ScrollArea>
                <div className="p-3 border-t border-border">
                  <Button
                    className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
                    size="sm"
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select an environment to edit
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
