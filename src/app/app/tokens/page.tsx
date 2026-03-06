"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  Zap,
  Loader2,
  Terminal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface ProxyToken {
  id: string;
  name: string;
  token: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<ProxyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchTokens() {
    try {
      const res = await fetch("/api/proxy-tokens");
      if (res.ok) setTokens(await res.json());
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTokens();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/proxy-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewToken(data.token);
        setNewName("");
        await fetchTokens();
      }
    } catch {
      // silently handle
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await fetch(`/api/proxy-tokens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      await fetchTokens();
    } catch {
      // silently handle
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this token? The CLI using it will stop working.")) return;
    try {
      await fetch(`/api/proxy-tokens/${id}`, { method: "DELETE" });
      await fetchTokens();
    } catch {
      // silently handle
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-surface-1/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/app")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-volley">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold">Proxy Tokens</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 md:px-6 py-8">
        {/* CLI info banner */}
        <div className="mb-6 rounded-xl border border-border/40 bg-surface-1 p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Local Proxy CLI</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate a token below, then use the Volley CLI to proxy requests to your localhost.
                Install and run:
              </p>
              <div className="mt-2 rounded-md bg-surface-2 border border-border/30 p-3 font-mono text-xs text-foreground/80">
                <div>npx volley-proxy --token YOUR_TOKEN --port 3000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Tokens</h2>
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setNewToken(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-volley hover:bg-volley-hover text-white font-medium text-sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Generate Token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{newToken ? "Token Created" : "Generate Proxy Token"}</DialogTitle>
              </DialogHeader>

              {newToken ? (
                <div className="space-y-4 mt-2">
                  <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
                    Copy this token now. You won&apos;t be able to see it again.
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newToken}
                      readOnly
                      className="font-mono text-xs bg-surface-2 border-border/30"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-border/30"
                      onClick={() => copyToClipboard(newToken)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border/30"
                    onClick={() => { setDialogOpen(false); setNewToken(null); }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Token Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. MacBook Dev"
                      className="bg-surface-2 border-border/30"
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      autoFocus
                    />
                  </div>
                  <Button
                    className="w-full bg-volley hover:bg-volley-hover text-white font-medium"
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                  >
                    {creating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Generate
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Token list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-surface-2 border border-border/30 flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-medium mb-1">No tokens yet</h3>
            <p className="text-xs text-muted-foreground">Generate a token to start proxying localhost requests.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center gap-4 rounded-lg border border-border/30 bg-surface-1 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 shrink-0">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{token.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${token.isActive ? "text-green-400 border-green-500/20" : "text-muted-foreground border-border/30"}`}
                    >
                      {token.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] font-mono text-muted-foreground">{token.token}</span>
                    {token.lastUsed && (
                      <span className="text-[10px] text-muted-foreground/60">
                        Last used {new Date(token.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(token.id, token.isActive)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                    title={token.isActive ? "Deactivate" : "Activate"}
                  >
                    {token.isActive ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(token.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-surface-3 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
