"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchBar } from "@/components/ui/search-bar";
import { formatDate, getInitials } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import type { EntityStatus, User } from "@/types";
import { ShieldAlert, Plus } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

export default function UsersPage() {
  const { getUsers, createUser, updateUser, deactivateUser } = useCRMStore();
  const { canManageUsers } = usePermissions();
  const users = getUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>();
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "salesperson" as User["role"],
    department: "Sales",
    status: "active" as EntityStatus,
  });

  if (!canManageUsers) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators can manage users."
      />
    );
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function openCreate() {
    setEditUser(undefined);
    setForm({ name: "", email: "", role: "salesperson", department: "Sales", status: "active" });
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (editUser) {
      updateUser(editUser.id, form);
      toast.success("User updated successfully");
    } else {
      createUser(form);
      toast.success("User created successfully");
    }
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members, roles, and access permissions."
        actions={
          <Button variant="accent" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 p-4 sm:flex-row">
        <SearchBar placeholder="Search users..." value={search} onChange={setSearch} className="flex-1" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sales_manager">Sales Manager</SelectItem>
            <SelectItem value="salesperson">Salesperson</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{roleLabels[user.role]}</Badge></TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell><Badge variant={user.status === "active" ? "success" : "secondary"}>{user.status}</Badge></TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeactivateId(user.id)}>
                        Deactivate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as User["role"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="salesperson">Salesperson</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editUser ? "Save" : "Create User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateId}
        onOpenChange={() => setDeactivateId(null)}
        title="Deactivate user?"
        description="The user will lose access to operational features."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={() => {
          if (deactivateId) {
            deactivateUser(deactivateId);
            toast.success("User deactivated");
          }
        }}
      />
    </div>
  );
}
