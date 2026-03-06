"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRequestStore } from "@/stores/request-store";
import type { Folder, ApiRequest, HttpMethod } from "@/types";
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FolderIcon,
  FolderOpen,
  Pencil,
  Trash2,
  Copy,
  FolderInput,
} from "lucide-react";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-green-600/20 text-green-400",
  POST: "bg-yellow-600/20 text-yellow-400",
  PUT: "bg-blue-600/20 text-blue-400",
  PATCH: "bg-orange-600/20 text-orange-400",
  DELETE: "bg-red-600/20 text-red-400",
  HEAD: "bg-purple-600/20 text-purple-400",
  OPTIONS: "bg-teal-600/20 text-teal-400",
};

interface FolderTreeProps {
  folders: Folder[];
  allFolders: Folder[];
  onRenameRequest: (id: string, name: string) => void;
  onDeleteRequest: (id: string) => void;
  onDuplicateRequest: (id: string) => void;
  onMoveRequest: (requestId: string, folderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderTree({
  folders,
  allFolders,
  onRenameRequest,
  onDeleteRequest,
  onDuplicateRequest,
  onMoveRequest,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          allFolders={allFolders}
          depth={0}
          onRenameRequest={onRenameRequest}
          onDeleteRequest={onDeleteRequest}
          onDuplicateRequest={onDuplicateRequest}
          onMoveRequest={onMoveRequest}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}

function FolderNode({
  folder,
  allFolders,
  depth,
  onRenameRequest,
  onDeleteRequest,
  onDuplicateRequest,
  onMoveRequest,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: Folder;
  allFolders: Folder[];
  depth: number;
  onRenameRequest: (id: string, name: string) => void;
  onDeleteRequest: (id: string) => void;
  onDuplicateRequest: (id: string) => void;
  onMoveRequest: (requestId: string, folderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(folder.name);

  function handleRenameSubmit() {
    if (renamingValue.trim()) {
      onRenameFolder(folder.id, renamingValue.trim());
    }
    setRenaming(false);
  }

  return (
    <div>
      <div
        className="group flex items-center gap-1 py-1 px-1 rounded-sm hover:bg-muted/50 cursor-pointer"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {expanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-[#FF6B35] shrink-0" />
        ) : (
          <FolderIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        {renaming ? (
          <Input
            value={renamingValue}
            onChange={(e) => setRenamingValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="h-5 text-xs bg-background flex-1"
            autoFocus
          />
        ) : (
          <span
            className="text-xs font-medium text-foreground truncate flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            {folder.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => {
              setRenamingValue(folder.name);
              setRenaming(true);
            }}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteFolder(folder.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <div>
          {folder.subFolders.map((sub) => (
            <FolderNode
              key={sub.id}
              folder={sub}
              allFolders={allFolders}
              depth={depth + 1}
              onRenameRequest={onRenameRequest}
              onDeleteRequest={onDeleteRequest}
              onDuplicateRequest={onDuplicateRequest}
              onMoveRequest={onMoveRequest}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
          {folder.requests.map((req) => (
            <RequestNode
              key={req.id}
              request={req}
              allFolders={allFolders}
              depth={depth + 1}
              onRename={onRenameRequest}
              onDelete={onDeleteRequest}
              onDuplicate={onDuplicateRequest}
              onMove={onMoveRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestNode({
  request,
  allFolders,
  depth,
  onRename,
  onDelete,
  onDuplicate,
  onMove,
}: {
  request: ApiRequest;
  allFolders: Folder[];
  depth: number;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (requestId: string, folderId: string | null) => void;
}) {
  const openTab = useRequestStore((s) => s.openTab);
  const [renaming, setRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(request.name);

  function handleRenameSubmit() {
    if (renamingValue.trim()) {
      onRename(request.id, renamingValue.trim());
    }
    setRenaming(false);
  }

  return (
    <div
      className="group flex items-center gap-1.5 py-1 px-1 rounded-sm hover:bg-muted/50 cursor-pointer"
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
      onClick={() => {
        if (!renaming) openTab(request);
      }}
    >
      <span
        className={`shrink-0 px-1.5 py-0 text-[9px] font-bold font-mono rounded ${METHOD_COLORS[request.method]}`}
      >
        {request.method.substring(0, 3)}
      </span>

      {renaming ? (
        <Input
          value={renamingValue}
          onChange={(e) => setRenamingValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-5 text-xs bg-background flex-1"
          autoFocus
        />
      ) : (
        <span className="text-xs text-foreground/80 truncate flex-1">
          {request.name}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            setRenamingValue(request.name);
            setRenaming(true);
          }}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onDuplicate(request.id);
          }}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="mr-2 h-3.5 w-3.5" />
              Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onMove(request.id, null)}>
                Root (no folder)
              </DropdownMenuItem>
              {allFolders.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => onMove(request.id, f.id)}
                  disabled={f.id === request.folderId}
                >
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(request.id);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
