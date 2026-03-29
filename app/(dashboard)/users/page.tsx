"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Shield } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Role = "admin" | "manager" | "employee";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  manager_id: string | null;
};

export default function UsersPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
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
        .select("company_id, role")
        .eq("id", user.id)
        .single();

      if (meError || !me) {
        setError("Could not load your profile.");
        setLoading(false);
        return;
      }

      setCurrentRole(me.role as Role);

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

      setUsers((companyUsers ?? []) as UserRow[]);
      setLoading(false);
    };

    loadUsers();
  }, [supabase]);

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
        <p className="text-slate-600 mt-1">View roles and users created in Supabase.</p>
      </div>

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
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const manager = users.find((item) => item.id === user.manager_id);

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
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize flex items-center w-max space-x-1 ${
                            user.role === "admin"
                              ? "bg-primary-100 text-primary-700"
                              : user.role === "manager"
                                ? "bg-warning-100 text-warning-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role === "admin" && <Shield className="w-3 h-3" />}
                          <span>{user.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {manager ? (
                          <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            {manager.full_name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">None assigned</span>
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
