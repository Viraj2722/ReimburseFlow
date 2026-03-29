import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/login", "/signup"];
type Role = "admin" | "manager" | "employee";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/approval-rules") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings")
  );
}

function getDefaultRouteForRole(role: Role) {
  if (role === "manager") {
    return "/approvals";
  }

  return "/dashboard";
}

function isRouteAllowedForRole(pathname: string, role: Role) {
  if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/expenses")) {
    return true;
  }

  if (pathname.startsWith("/approvals")) {
    return role === "admin" || role === "manager";
  }

  if (pathname.startsWith("/users") || pathname.startsWith("/approval-rules") || pathname.startsWith("/settings")) {
    return role === "admin";
  }

  return true;
}

export async function proxy(request: NextRequest) {
  const { user, response, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role: Role =
      profile?.role === "admin" || profile?.role === "manager" || profile?.role === "employee"
        ? profile.role
        : "employee";

    if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
    }

    if (isProtectedPath(pathname) && !isRouteAllowedForRole(pathname, role)) {
      return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};