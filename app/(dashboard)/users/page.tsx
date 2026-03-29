"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Shield } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Role = "admin" | "manager" | "employee";
type InviteRole = "manager" | "employee";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  manager_id: string | null;
};

type PendingInviteRow = {
  id: string;
  email: string;
  full_name: string;
  role: InviteRole;
  manager_id: string | null;
  accepted_at: string | null;
  created_at: string;
};

type EditableUser = {
  role: Role;
  managerId: string;
};

export default function UsersPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRow[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [savingUserId, setSavingUserId] = useState("");
  const [editingUsers, setEditingUsers] = useState<Record<string, EditableUser>>({});
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    role: "employee" as InviteRole,
    managerId: "",
  });

  const managerOptions = users.filter((user) => user.role === "manager" || user.role === "admin");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    const { data: me, error: meError } = await supabase
      .from("users")
      .select("id, company_id, role")
      .eq("id", user.id)
      .single();

    if (meError || !me) {
      setError("Could not load your profile.");
      setLoading(false);
      return;
    }

    setCurrentRole(me.role as Role);
    setCurrentUserId(me.id);
    setCompanyId(me.company_id);

    const { data: companyUsers, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role, manager_id")
      .eq("company_id", me.company_id)
      .order("created_at", { ascending: true });

    if (usersError) {
      setError(usersError.message);
      setLoading(false);
      return;
    }

    const { data: inviteRows, error: invitesError } = await supabase
      .from("pending_invites")
      .select("id, email, full_name, role, manager_id, accepted_at, created_at")
      .eq("company_id", me.company_id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (invitesError) {
      setError(invitesError.message);
      setLoading(false);
      return;
    }

    setUsers((companyUsers ?? []) as UserRow[]);
    setPendingInvites((inviteRows ?? []) as PendingInviteRow[]);

    const userEditMap: Record<string, EditableUser> = {};
    (companyUsers ?? []).forEach((companyUser) => {
      const typed = companyUser as UserRow;
      userEditMap[typed.id] = {
        role: typed.role,
        managerId: typed.manager_id ?? "",
      };
    });
    setEditingUsers(userEditMap);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!inviteForm.fullName || !inviteForm.email) {
      setError("Please fill name and email.");
      return;
    }

    if (inviteForm.role === "employee" && !inviteForm.managerId) {
      setError("Please select a manager for the employee.");
      return;
    }

    setSubmittingInvite(true);

    const { error: inviteError } = await supabase.from("pending_invites").upsert(
      {
        company_id: companyId,
        email: inviteForm.email.toLowerCase(),
        full_name: inviteForm.fullName,
        role: inviteForm.role,
        manager_id: inviteForm.role === "employee" ? inviteForm.managerId : null,
        invited_by: currentUserId,
        accepted_at: null,
      },
      { onConflict: "email" },
    );

    if (inviteError) {
      setError(inviteError.message);
      setSubmittingInvite(false);
      return;
    }

    setMessage(
      `Invite saved for ${inviteForm.email}. Share /invite/accept?email=${inviteForm.email.toLowerCase()} with them.`,
    );
    setInviteForm({
      fullName: "",
      email: "",
      role: "employee",
      managerId: "",
    });
    await loadUsers();
    setSubmittingInvite(false);
  };

  const handleCancelInvite = async (inviteId: string) => {
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("pending_invites")
      .delete()
      .eq("id", inviteId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("Invite cancelled.");
    await loadUsers();
  };

  const handleUserEditChange = (userId: string, key: keyof EditableUser, value: string) => {
    setEditingUsers((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? { role: "employee", managerId: "" }),
        [key]: value,
      },
    }));
  };

  const handleSaveUser = async (userId: string) => {
    const nextState = editingUsers[userId];
    if (!nextState) return;

    if (nextState.role === "employee" && !nextState.managerId) {
      setError("Employee must have a manager assigned.");
      return;
    }

    setSavingUserId(userId);
    setError("");
    setMessage("");

    const managerId = nextState.role === "employee" ? nextState.managerId : null;

    const { error: updateError } = await supabase
      .from("users")
      .update({
        role: nextState.role,
        manager_id: managerId,
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setSavingUserId("");
      return;
    }

    setMessage("User updated successfully.");
    await loadUsers();
    setSavingUserId("");
  };

  if (loading) {
    return <p className="text-slate-600">Loading users...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (currentRole !== "admin") {
    return <p className="text-slate-700">Only admins can access user management.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-1">Add managers/employees and view current team members.</p>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {message ? <p className="text-green-600">{message}</p> : null}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Manager / Employee</h2>

          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={inviteForm.fullName}
                onChange={handleInviteChange}
                placeholder="Enter full name"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={inviteForm.email}
                onChange={handleInviteChange}
                placeholder="user@company.com"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleInviteChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Manager (required for employee)</label>
              <select
                name="managerId"
                value={inviteForm.managerId}
                onChange={handleInviteChange}
                disabled={inviteForm.role !== "employee"}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
              >
                <option value="">Select manager</option>
                {managerOptions.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name} ({manager.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingInvite}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium disabled:opacity-60"
              >
                {submittingInvite ? "Saving..." : "Add User Invite"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Invites</h2>

          {pendingInvites.length === 0 ? (
            <p className="text-slate-600 text-sm">No pending invites.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Invite Link</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-900">{invite.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{invite.email}</td>
                      <td className="py-3 px-4 text-slate-600 capitalize">{invite.role}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <button
                          type="button"
                          onClick={async () => {
                            const invitePath = `/invite/accept?email=${encodeURIComponent(invite.email)}`;
                            const inviteUrl = `${window.location.origin}${invitePath}`;
                            await navigator.clipboard.writeText(inviteUrl);
                            setMessage(`Copied invite link for ${invite.email}`);
                          }}
                          className="px-2 py-1 rounded border border-slate-300 text-xs hover:bg-slate-50"
                        >
                          Copy Link
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(invite.id)}
                          className="px-2 py-1 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Direct Manager</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const manager = users.find((item) => item.id === user.manager_id);
                  const editable = editingUsers[user.id] ?? {
                    role: user.role,
                    managerId: user.manager_id ?? "",
                  };
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {user.full_name?.charAt(0) || "U"}
                          </div>
                          <span className="font-medium text-slate-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <select
                          value={editable.role}
                          onChange={(e) => handleUserEditChange(user.id, "role", e.target.value)}
                          disabled={isSelf}
                          className="border border-slate-200 rounded px-2 py-1 text-sm disabled:bg-slate-100"
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="employee">employee</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        {editable.role === "employee" ? (
                          <select
                            value={editable.managerId}
                            onChange={(e) => handleUserEditChange(user.id, "managerId", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select manager</option>
                            {managerOptions
                              .filter((opt) => opt.id !== user.id)
                              .map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.full_name} ({opt.role})
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            {manager ? manager.full_name : "No manager required"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isSelf ? (
                          <span className="text-xs text-slate-500">Current user</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveUser(user.id)}
                            disabled={savingUserId === user.id}
                            className="px-3 py-1 rounded bg-primary-600 text-white text-xs hover:bg-primary-700 disabled:opacity-60"
                          >
                            {savingUserId === user.id ? "Saving..." : "Save"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
