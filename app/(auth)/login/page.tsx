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
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const isEmailNotConfirmed = error.toLowerCase().includes("email not confirmed");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

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

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "manager") {
      router.push("/approvals");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!form.email) {
      setError("Enter your email first.");
      return;
    }

    setResending(true);
    setInfo("");

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: form.email.toLowerCase(),
    });

    if (resendError) {
      setError(resendError.message);
      setResending(false);
      return;
    }

    setInfo("Confirmation email sent. Please verify your inbox, then login.");
    setResending(false);
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

        {info ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">{info}</p>
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

        {isEmailNotConfirmed ? (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resending}
            className="w-full border border-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-50 disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend Confirmation Email"}
          </button>
        ) : null}

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