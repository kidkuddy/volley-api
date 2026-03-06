"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Clock,
  CheckCircle,
  Layers,
  Send,
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Trash2,
  ArrowLeft,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  isApproved: boolean;
  isAdmin: boolean;
  createdAt: string;
  image: string | null;
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  totalWorkspaces: number;
  totalRequests: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        setUsersData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateUser(userId: string, data: Partial<Pick<User, "isApproved" | "isAdmin">>) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await Promise.all([fetchUsers(), fetchStats()]);
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteDialog(null);
        await Promise.all([fetchUsers(), fetchStats()]);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
    }
  }

  function getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? "-", icon: Users, color: "text-[#FF6B35]" },
    { label: "Pending Approval", value: stats?.pendingUsers ?? "-", icon: Clock, color: "text-yellow-500" },
    { label: "Approved", value: stats?.approvedUsers ?? "-", icon: CheckCircle, color: "text-green-500" },
    { label: "Total Workspaces", value: stats?.totalWorkspaces ?? "-", icon: Layers, color: "text-blue-500" },
    { label: "Total Requests", value: stats?.totalRequests ?? "-", icon: Send, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Nav */}
      <header className="border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to App</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <h1 className="text-lg font-semibold">
              <span className="text-[#FF6B35]">Volley</span>{" "}
              <span className="text-zinc-400 font-normal">Admin</span>
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-zinc-400 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Management */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">User Management</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <TabsList className="bg-zinc-800 border border-zinc-700">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
                >
                  Approved
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Created</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {usersData?.users.map((user) => (
                        <tr key={user.id} className="group hover:bg-zinc-800/50">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image ?? undefined} />
                                <AvatarFallback className="bg-zinc-700 text-xs">
                                  {getInitials(user.name, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {user.name || "No name"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-zinc-400">{user.email}</td>
                          <td className="py-3">
                            {user.isApproved ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/10">
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-3">
                            {user.isAdmin ? (
                              <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20 hover:bg-[#FF6B35]/10">
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                                User
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 text-zinc-400 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            <UserActions
                              user={user}
                              actionLoading={actionLoading}
                              onApprove={() => updateUser(user.id, { isApproved: true })}
                              onRevoke={() => updateUser(user.id, { isApproved: false })}
                              onToggleAdmin={() =>
                                updateUser(user.id, { isAdmin: !user.isAdmin })
                              }
                              onDelete={() => setDeleteDialog(user)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-3">
                  {usersData?.users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-zinc-800/50 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback className="bg-zinc-700 text-sm">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <UserActions
                          user={user}
                          actionLoading={actionLoading}
                          onApprove={() => updateUser(user.id, { isApproved: true })}
                          onRevoke={() => updateUser(user.id, { isApproved: false })}
                          onToggleAdmin={() =>
                            updateUser(user.id, { isAdmin: !user.isAdmin })
                          }
                          onDelete={() => setDeleteDialog(user)}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.isApproved ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/10">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10">
                            Pending
                          </Badge>
                        )}
                        {user.isAdmin ? (
                          <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20 hover:bg-[#FF6B35]/10">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            User
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-500 ml-auto">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {usersData?.users.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    No users found.
                  </div>
                )}

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-zinc-400">
                      Showing {(usersData.page - 1) * usersData.limit + 1} to{" "}
                      {Math.min(usersData.page * usersData.limit, usersData.total)} of{" "}
                      {usersData.total} users
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="border-zinc-700 text-zinc-400 hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-zinc-400 px-2">
                        {usersData.page} / {usersData.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= usersData.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="border-zinc-700 text-zinc-400 hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">
                {deleteDialog?.name || deleteDialog?.email}
              </span>
              ? This action cannot be undone and will remove all their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && deleteUser(deleteDialog.id)}
              disabled={actionLoading === deleteDialog?.id}
            >
              {actionLoading === deleteDialog?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserActions({
  user,
  actionLoading,
  onApprove,
  onRevoke,
  onToggleAdmin,
  onDelete,
}: {
  user: User;
  actionLoading: string | null;
  onApprove: () => void;
  onRevoke: () => void;
  onToggleAdmin: () => void;
  onDelete: () => void;
}) {
  const isLoading = actionLoading === user.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-zinc-900 border-zinc-700 text-white"
      >
        {user.isApproved ? (
          <DropdownMenuItem
            onClick={onRevoke}
            className="cursor-pointer focus:bg-zinc-800 focus:text-white"
          >
            <UserX className="h-4 w-4 mr-2" />
            Revoke Approval
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onApprove}
            className="cursor-pointer focus:bg-zinc-800 focus:text-white"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Approve
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onToggleAdmin}
          className="cursor-pointer focus:bg-zinc-800 focus:text-white"
        >
          {user.isAdmin ? (
            <>
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Admin
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Make Admin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-700" />
        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
