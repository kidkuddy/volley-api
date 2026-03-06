"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Users,
  Zap,
  LogOut,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Shield,
  Clock,
  Key,
} from "lucide-react";

interface WorkspaceWithRole {
  id: string;
  name: string;
  slug: string;
  role: string;
  _count?: { members: number; requests: number };
  members?: unknown[];
  createdAt?: string;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  async function fetchWorkspaces() {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        setWorkspaces(await res.json());
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        setDialogOpen(false);
        await fetchWorkspaces();
      }
    } catch {
      // silently handle
    } finally {
      setCreating(false);
    }
  }

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-surface-1/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-volley">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">Volley</span>
            </div>
            <div className="hidden sm:block h-5 w-px bg-border" />
            <span className="hidden sm:block text-sm text-muted-foreground">Workspaces</span>
          </div>

          <div className="flex items-center gap-2">
            {session?.user?.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/admin")}
              >
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/app/tokens")}
            >
              <Key className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Proxy Tokens</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-surface-3 text-muted-foreground">
                      {(session?.user?.name ?? session?.user?.email ?? "U")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-xs text-muted-foreground max-w-[120px] truncate">
                    {session?.user?.name ?? session?.user?.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {session?.user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Header row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Workspaces</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-volley hover:bg-volley-hover text-white font-medium">
                <Plus className="mr-1.5 h-4 w-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My API Project"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="bg-surface-2"
                    autoFocus
                  />
                </div>
                <Button
                  className="w-full bg-volley hover:bg-volley-hover text-white font-medium"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                >
                  {creating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search + view toggle */}
        {workspaces.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-9 h-9 bg-surface-1 border-border/50 text-sm"
              />
            </div>
            <div className="flex items-center border border-border/50 rounded-md overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 transition-colors ${view === "list" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 rounded-2xl bg-surface-2 border border-border/50 flex items-center justify-center mb-5">
              <Zap className="h-7 w-7 text-volley" />
            </div>
            <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first workspace to start testing APIs with your team.
            </p>
            <Button
              className="bg-volley hover:bg-volley-hover text-white font-medium"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ws) => (
              <button
                key={ws.id}
                className="group text-left rounded-xl border border-border/40 bg-surface-1 p-5 transition-all hover:border-volley/30 hover:bg-surface-1/80 hover:shadow-[0_0_24px_-8px_#FF6B3520]"
                onClick={() => router.push(`/app/${ws.slug}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-3 group-hover:bg-volley-muted transition-colors">
                    <Zap className="h-4 w-4 text-muted-foreground group-hover:text-volley transition-colors" />
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    ws.role === "MANAGER"
                      ? "bg-volley-muted text-volley"
                      : "bg-surface-3 text-muted-foreground"
                  }`}>
                    {ws.role === "MANAGER" ? "Manager" : "Consumer"}
                  </span>
                </div>
                <h3 className="text-sm font-medium mb-1 truncate">{ws.name}</h3>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {ws._count?.members ?? ws.members?.length ?? 1}
                  </span>
                  {ws._count?.requests !== undefined && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ws._count.requests} req{ws._count.requests !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((ws) => (
              <button
                key={ws.id}
                className="group w-full text-left flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-all hover:border-border/40 hover:bg-surface-1"
                onClick={() => router.push(`/app/${ws.slug}`)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 group-hover:bg-volley-muted transition-colors shrink-0">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-volley transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{ws.name}</h3>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  ws.role === "MANAGER"
                    ? "bg-volley-muted text-volley"
                    : "bg-surface-3 text-muted-foreground"
                }`}>
                  {ws.role === "MANAGER" ? "Manager" : "Consumer"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Users className="h-3 w-3" />
                  {ws._count?.members ?? 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
