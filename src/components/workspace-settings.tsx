"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkspaceMember, WorkspaceRole } from "@/types";
import { Settings, UserPlus, Trash2, Shield, User } from "lucide-react";

interface WorkspaceSettingsProps {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  trigger?: React.ReactNode;
}

export function WorkspaceSettings({
  workspaceId,
  workspaceName,
  role,
  trigger,
}: WorkspaceSettingsProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(workspaceName);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("CONSUMER");
  const [saving, setSaving] = useState(false);

  if (role !== "MANAGER") return null;

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch {
      // silently handle
    }
  }

  useEffect(() => {
    if (open) fetchMembers();
  }, [open]);

  async function handleSaveName() {
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail("");
      await fetchMembers();
    } catch {
      // silently handle
    }
  }

  async function handleChangeRole(memberId: string, newRole: WorkspaceRole) {
    try {
      await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      await fetchMembers();
    } catch {
      // silently handle
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });
      await fetchMembers();
    } catch {
      // silently handle
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-xs">
            <Settings className="mr-1 h-3.5 w-3.5" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm">Workspace Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saving || name === workspaceName}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            {/* Invite */}
            <div className="space-y-2">
              <Label className="text-sm">Invite Member</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-background flex-1"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as WorkspaceRole)}
                  >
                    <SelectTrigger className="w-full sm:w-[120px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSUMER">Consumer</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleInvite}
                    className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white shrink-0"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Member list */}
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 rounded-md border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={member.user.image ?? undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user.name ?? member.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-11 sm:pl-0 shrink-0">
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleChangeRole(member.id, v as WorkspaceRole)}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSUMER">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3" />
                              Consumer
                            </div>
                          </SelectItem>
                          <SelectItem value="MANAGER">
                            <div className="flex items-center gap-1.5">
                              <Shield className="h-3 w-3" />
                              Manager
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
