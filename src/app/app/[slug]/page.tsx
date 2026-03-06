"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FolderTree } from "@/components/folder-tree";
import { RequestEditor } from "@/components/request-editor";
import { EnvironmentManager } from "@/components/environment-manager";
import { WorkspaceSettings } from "@/components/workspace-settings";
import { useRequestStore } from "@/stores/request-store";
import type {
  Folder,
  ApiRequest,
  Environment,
  HttpMethod,
  WorkspaceRole,
} from "@/types";
import {
  Plus,
  FolderPlus,
  Zap,
  LogOut,
  X,
  Loader2,
  ChevronLeft,
  Menu,
} from "lucide-react";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-green-400",
  POST: "text-yellow-400",
  PUT: "text-blue-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
  HEAD: "text-purple-400",
  OPTIONS: "text-teal-400",
};

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  environments: Environment[];
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rootRequests, setRootRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [resizing, setResizing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const tabs = useRequestStore((s) => s.tabs);
  const activeTabIndex = useRequestStore((s) => s.activeTabIndex);
  const setActiveTab = useRequestStore((s) => s.setActiveTab);
  const closeTab = useRequestStore((s) => s.closeTab);
  const newTab = useRequestStore((s) => s.newTab);
  const openTab = useRequestStore((s) => s.openTab);
  const setEnvironments = useRequestStore((s) => s.setEnvironments);
  const setActiveEnvironment = useRequestStore((s) => s.setActiveEnvironment);
  const environments = useRequestStore((s) => s.environments);
  const activeEnvironment = useRequestStore((s) => s.activeEnvironment);

  // Fetch workspace data
  useEffect(() => {
    async function load() {
      try {
        // First get workspace by slug
        const wsRes = await fetch("/api/workspaces");
        if (!wsRes.ok) return;
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) {
          router.push("/app");
          return;
        }

        // Get full workspace details
        const detailRes = await fetch(`/api/workspaces/${ws.id}`);
        if (!detailRes.ok) return;
        const detail = await detailRes.json();

        setWorkspace({
          id: detail.id,
          name: detail.name,
          slug: detail.slug,
          role: detail.role,
          environments: detail.environments ?? [],
        });

        // Set environments in store
        if (detail.environments) {
          setEnvironments(detail.environments);
          const active = detail.environments.find((e: Environment) => e.isActive);
          if (active) setActiveEnvironment(active);
        }

        // Fetch folders and requests
        await fetchFoldersAndRequests(ws.id);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function fetchFoldersAndRequests(workspaceId: string) {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/folders`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders ?? []);
        setRootRequests(data.rootRequests ?? []);
      }
    } catch {
      // silently handle
    }
  }

  // Sidebar resize
  const handleMouseDown = useCallback(() => {
    setResizing(true);
  }, []);

  useEffect(() => {
    if (!resizing) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = Math.max(180, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    }

    function handleMouseUp() {
      setResizing(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  // CRUD operations
  async function handleNewRequest() {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Request", method: "GET", type: "HTTP" }),
      });
      if (res.ok) {
        const req = await res.json();
        openTab(req);
        await fetchFoldersAndRequests(workspace.id);
      }
    } catch {
      newTab(workspace.id);
    }
  }

  async function handleNewFolder() {
    if (!workspace) return;
    const name = prompt("Folder name:");
    if (!name) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleRenameRequest(id: string, name: string) {
    if (!workspace) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleDeleteRequest(id: string) {
    if (!workspace) return;
    if (!confirm("Delete this request?")) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/requests/${id}`, {
        method: "DELETE",
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleDuplicateRequest(id: string) {
    if (!workspace) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/requests/${id}/duplicate`, {
        method: "POST",
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleMoveRequest(requestId: string, folderId: string | null) {
    if (!workspace) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleRenameFolder(id: string, name: string) {
    if (!workspace) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!workspace) return;
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await fetch(`/api/workspaces/${workspace.id}/folders/${id}`, {
        method: "DELETE",
      });
      await fetchFoldersAndRequests(workspace.id);
    } catch {
      // silently handle
    }
  }

  function handleEnvironmentChange(envId: string) {
    const env = environments.find((e) => e.id === envId);
    setActiveEnvironment(env ?? null);
  }

  // Flatten all folders for the move-to menu
  function flattenFolders(flds: Folder[]): Folder[] {
    const result: Folder[] = [];
    for (const f of flds) {
      result.push(f);
      if (f.subFolders.length > 0) {
        result.push(...flattenFolders(f.subFolders));
      }
    }
    return result;
  }

  const allFoldersFlat = flattenFolders(folders);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  // Sidebar content extracted for reuse in desktop and mobile sheet
  const sidebarContent = (
    <>
      <div className="flex items-center gap-1 p-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs justify-start"
          onClick={() => {
            handleNewRequest();
            setMobileSidebarOpen(false);
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Request
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            handleNewFolder();
            setMobileSidebarOpen(false);
          }}
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          <FolderTree
            folders={folders}
            allFolders={allFoldersFlat}
            onRenameRequest={handleRenameRequest}
            onDeleteRequest={handleDeleteRequest}
            onDuplicateRequest={handleDuplicateRequest}
            onMoveRequest={handleMoveRequest}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
          {/* Root-level requests (not in any folder) */}
          {rootRequests.map((req) => (
            <div
              key={req.id}
              className="group flex items-center gap-1.5 py-1 px-2 rounded-sm hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                openTab(req);
                setMobileSidebarOpen(false);
              }}
            >
              <span
                className={`shrink-0 px-1.5 py-0 text-[9px] font-bold font-mono rounded ${
                  req.method === "GET"
                    ? "bg-green-600/20 text-green-400"
                    : req.method === "POST"
                      ? "bg-yellow-600/20 text-yellow-400"
                      : req.method === "PUT"
                        ? "bg-blue-600/20 text-blue-400"
                        : req.method === "PATCH"
                          ? "bg-orange-600/20 text-orange-400"
                          : req.method === "DELETE"
                            ? "bg-red-600/20 text-red-400"
                            : "bg-purple-600/20 text-purple-400"
                }`}
              >
                {req.method.substring(0, 3)}
              </span>
              <span className="text-xs text-foreground/80 truncate">
                {req.name}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-border bg-card px-2 md:px-3 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile hamburger menu */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden text-muted-foreground hover:text-foreground p-1">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <button
            onClick={() => router.push("/app")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Zap className="h-4 w-4 text-[#FF6B35] hidden sm:block" />
          <span className="text-sm font-semibold truncate">{workspace.name}</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Environment selector */}
          <Select
            value={activeEnvironment?.id ?? ""}
            onValueChange={handleEnvironmentChange}
          >
            <SelectTrigger className="w-[100px] md:w-[160px] h-8 text-xs bg-muted/50">
              <SelectValue placeholder="No env" />
            </SelectTrigger>
            <SelectContent>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id} className="text-xs">
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <EnvironmentManager workspaceId={workspace.id} />

          <WorkspaceSettings
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            role={workspace.role}
          />

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {(session?.user?.name ?? session?.user?.email ?? "U")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - hidden on mobile, narrower on tablet */}
        <div
          className="hidden md:flex flex-col border-r border-border bg-card shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          {sidebarContent}
        </div>

        {/* Resize handle - hidden on mobile and tablet */}
        <div
          className={`hidden lg:block w-1 cursor-col-resize hover:bg-[#FF6B35]/30 transition-colors shrink-0 ${
            resizing ? "bg-[#FF6B35]/50" : ""
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Tabs - horizontally scrollable */}
          {tabs.length > 0 && (
            <div className="flex items-center border-b border-border bg-card shrink-0 overflow-x-auto scrollbar-none">
              {tabs.map((tab, i) => (
                <button
                  key={tab.request.id}
                  className={`group flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 text-xs border-r border-border shrink-0 max-w-[150px] md:max-w-[200px] ${
                    i === activeTabIndex
                      ? "bg-background text-foreground border-b-2 border-b-[#FF6B35]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                  onClick={() => setActiveTab(i)}
                >
                  <span className={`font-mono font-bold text-[10px] ${METHOD_COLORS[tab.request.method]}`}>
                    {tab.request.method}
                  </span>
                  <span className="truncate">{tab.request.name}</span>
                  {tab.dirty && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] shrink-0" />
                  )}
                  <button
                    className="ml-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(i);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Request editor */}
          <div className="flex-1 min-h-0 overflow-auto">
            <RequestEditor workspaceId={workspace.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
