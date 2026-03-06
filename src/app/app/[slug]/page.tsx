"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { OpenApiImporter } from "@/components/openapi-importer";
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
  PanelLeft,
  FileUp,
  Globe,
  Settings,
} from "lucide-react";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  PATCH: "method-patch",
  DELETE: "method-delete",
  HEAD: "method-head",
  OPTIONS: "method-options",
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  useEffect(() => {
    async function load() {
      try {
        const wsRes = await fetch("/api/workspaces");
        if (!wsRes.ok) return;
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) {
          router.push("/app");
          return;
        }

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

        if (detail.environments) {
          setEnvironments(detail.environments);
          const active = detail.environments.find((e: Environment) => e.isActive);
          if (active) setActiveEnvironment(active);
        }

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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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

  const sidebarContent = (
    <>
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requests</span>
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    handleNewRequest();
                    setMobileSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">New Request</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    handleNewFolder();
                    setMobileSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">New Folder</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1 px-1">
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
          {rootRequests.map((req) => (
            <div
              key={req.id}
              className="group flex items-center gap-2 py-1.5 px-2.5 rounded-md hover:bg-surface-3/50 cursor-pointer transition-colors"
              onClick={() => {
                openTab(req);
                setMobileSidebarOpen(false);
              }}
            >
              <span className={`shrink-0 px-1.5 py-px text-[9px] font-bold font-mono rounded ${METHOD_COLORS[req.method]}`}>
                {req.method.substring(0, 3)}
              </span>
              <span className="text-xs text-foreground/70 truncate group-hover:text-foreground transition-colors">
                {req.name}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar footer */}
      <div className="border-t border-border/50 p-2 space-y-1">
        {workspace && (
          <OpenApiImporter
            workspaceId={workspace.id}
            onImport={() => fetchFoldersAndRequests(workspace.id)}
            trigger={
              <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                <FileUp className="h-3.5 w-3.5" />
                Import OpenAPI
              </button>
            }
          />
        )}
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        {/* Top bar */}
        <header className="flex h-11 items-center justify-between border-b border-border/50 bg-surface-1 px-2 md:px-3 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Mobile sidebar toggle */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                  <PanelLeft className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-surface-1">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <button
              onClick={() => router.push("/app")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Desktop sidebar collapse */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />
            <span className="text-sm font-medium truncate">{workspace.name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Environment selector */}
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-muted-foreground hidden sm:block" />
              <Select
                value={activeEnvironment?.id ?? "none"}
                onValueChange={(v) => handleEnvironmentChange(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-[110px] md:w-[140px] h-7 text-[11px] bg-surface-2 border-border/30">
                  <SelectValue placeholder="No environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No environment</SelectItem>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id} className="text-xs">
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-px bg-border/30 mx-0.5 hidden sm:block" />

            <EnvironmentManager
              workspaceId={workspace.id}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Environments</TooltipContent>
                </Tooltip>
              }
            />

            <WorkspaceSettings
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              role={workspace.role}
            />

            <div className="h-4 w-px bg-border/30 mx-0.5 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center p-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-surface-3 text-muted-foreground">
                      {(session?.user?.name ?? session?.user?.email ?? "U")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <div className="px-3 py-1.5 text-[11px] text-muted-foreground truncate">
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
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <div
              className="hidden md:flex flex-col border-r border-border/50 bg-surface-1 shrink-0"
              style={{ width: `${sidebarWidth}px` }}
            >
              {sidebarContent}
            </div>
          )}

          {/* Resize handle */}
          {!sidebarCollapsed && (
            <div
              className={`hidden lg:block w-px cursor-col-resize hover:bg-volley/40 transition-colors shrink-0 ${
                resizing ? "bg-volley/60" : "bg-border/30"
              }`}
              onMouseDown={handleMouseDown}
            />
          )}

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Tabs */}
            {tabs.length > 0 && (
              <div className="flex items-center border-b border-border/50 bg-surface-1/50 shrink-0 overflow-x-auto scrollbar-none">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.request.id}
                    className={`group flex items-center gap-1.5 px-3 py-2 text-[11px] border-r border-border/30 shrink-0 max-w-[180px] transition-colors ${
                      i === activeTabIndex
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50"
                    }`}
                    onClick={() => setActiveTab(i)}
                  >
                    {i === activeTabIndex && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-volley" />
                    )}
                    <span className={`font-mono font-bold text-[9px] px-1 rounded ${METHOD_COLORS[tab.request.method]}`}>
                      {tab.request.method.substring(0, 3)}
                    </span>
                    <span className="truncate">{tab.request.name}</span>
                    {tab.dirty && (
                      <span className="h-1.5 w-1.5 rounded-full bg-volley shrink-0" />
                    )}
                    <button
                      className="ml-auto p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
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
    </TooltipProvider>
  );
}
