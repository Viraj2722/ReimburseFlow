import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UserRole = "admin" | "manager" | "employee";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const safeRole: UserRole =
    profile?.role === "admin" || profile?.role === "manager" || profile?.role === "employee"
      ? profile.role
      : "employee";

  const safeName = profile?.full_name || user.email?.split("@")[0] || "User";

  return <DashboardLayout user={{ name: safeName, role: safeRole }}>{children}</DashboardLayout>;
}
