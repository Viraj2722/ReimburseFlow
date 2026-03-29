"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setError("Could not load your profile. Please contact your admin.");
      setLoading(false);
      return;
    }

    if (profile?.role === "manager") {
      router.push("/approvals");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 border rounded bg-white shadow-md w-80"
      >
        <h2 className="text-xl font-bold text-center">Login</h2>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</p>
        ) : null}

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 w-full rounded">
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-xs text-slate-600 text-center leading-relaxed">
          If you are setting up the first admin, use{" "}
          <Link href="/signup" className="text-blue-600 underline">
            Admin Signup
          </Link>
          . Managers and employees should only log in.
        </p>
      </form>
    </div>
  );
}