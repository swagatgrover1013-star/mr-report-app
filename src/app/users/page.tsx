"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useUsers } from "@/lib/hooks/use-users";
import { Plus, MoreVertical, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const roleBadge = {
  admin: "ink" as const,
  manager: "brass" as const,
  mr: "default" as const,
};

export default function UsersPage() {
  const { users, loading, refetch } = useUsers();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(typeof users)[number] | null>(null);
  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.employeeId.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = async (id: string, status: string) => {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "inactive" : "active" }),
    });
    await refetch();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await refetch();
  };

  return (
    <AppShell>
      <TopBar
        title="Users"
        subtitle={`${users.length} team members`}
        action={
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add User</Button>
        }
      />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <div className="flex items-center justify-between lg:hidden">
          <PageHeaderMobile title="Users" subtitle={`${users.length} members`} />
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add</Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
            <Input placeholder="Search by name or employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </Card>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-porcelain-dim/60">
                    <th className="text-left font-medium text-slate px-5 py-3.5">Name</th>
                    <th className="text-left font-medium text-slate px-5 py-3.5">Employee ID</th>
                    <th className="text-left font-medium text-slate px-5 py-3.5">Role</th>
                    <th className="text-left font-medium text-slate px-5 py-3.5">Territory</th>
                    <th className="text-left font-medium text-slate px-5 py-3.5">Joined</th>
                    <th className="text-left font-medium text-slate px-5 py-3.5">Status</th>
                    <th className="text-right font-medium text-slate px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const initials = u.name.split(" ").map((n) => n[0]).join("");
                    return (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.04, 0.3) }} className="border-b border-border last:border-0 hover:bg-porcelain-dim/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback style={{ background: u.avatarColor }}>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ink">{u.name}</p>
                              <p className="text-xs text-slate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate">{u.employeeId}</td>
                        <td className="px-5 py-3.5"><Badge variant={roleBadge[u.role]} className="capitalize">{u.role}</Badge></td>
                        <td className="px-5 py-3.5 text-ink-soft">{u.territory}</td>
                        <td className="px-5 py-3.5 text-slate whitespace-nowrap">{format(new Date(u.joinedAt), "MMM yyyy")}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={u.status === "active" ? "default" : "secondary"} className="capitalize">{u.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4 text-slate" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingUser(u)}>Edit User</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(u.id, u.status)}>{u.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                              <DropdownMenuItem className="text-signal-rose focus:bg-signal-rose-soft" onClick={() => handleDelete(u.id)}>Delete User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <AddUserDialog onClose={() => setOpen(false)} onSaved={refetch} />
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        {editingUser && (
          <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} onSaved={refetch} />
        )}
      </Dialog>
    </AppShell>
  );
}

function AddUserDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", employeeId: "", role: "mr", email: "", territory: "", phone: "", password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.employeeId || !form.email || !form.password) {
      setError("Name, employee ID, email, and password are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add user.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add User</DialogTitle>
        <DialogDescription>Invite a new team member to Aurel Derma.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Name</Label>
          <Input placeholder="Full name" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Employee ID</Label>
          <Input placeholder="MR-XXXX" value={form.employeeId} onChange={set("employeeId")} />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="mr">Medical Representative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input type="email" placeholder="name@aurelderma.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="space-y-1.5">
          <Label>Territory</Label>
          <Input placeholder="e.g. Mumbai West" value={form.territory} onChange={set("territory")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Temporary Password</Label>
          <Input type="password" placeholder="At least 6 characters" value={form.password} onChange={set("password")} />
        </div>
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Add User"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditUserDialog({ user, onClose, onSaved }: { user: { id: string; name: string; employeeId: string; role: string; email: string; territory: string; phone: string }; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: user.name, employeeId: user.employeeId, role: user.role, email: user.email, territory: user.territory, phone: user.phone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.employeeId || !form.email) {
      setError("Name, employee ID, and email are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to update user.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>Update this team member's details.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Name</Label>
          <Input placeholder="Full name" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Employee ID</Label>
          <Input placeholder="MR-XXXX" value={form.employeeId} onChange={set("employeeId")} />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="mr">Medical Representative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input type="email" placeholder="name@aurelderma.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="space-y-1.5">
          <Label>Territory</Label>
          <Input placeholder="e.g. Mumbai West" value={form.territory} onChange={set("territory")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} />
        </div>
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
