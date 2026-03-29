"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading invite...</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const presetEmail = searchParams.get("email") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password || !fullName) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage("Account created. Please confirm your email if confirmation is enabled, then log in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded bg-white shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold text-center">Accept Invite</h2>

        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
          Use this page only if your admin invited your email. Your role and manager assignment come from your invite.
        </p>

        {error ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</p> : null}
        {message ? <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">{message}</p> : null}

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="border p-2 w-full rounded"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full rounded"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full rounded"
        />

        <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 w-full rounded disabled:opacity-60">
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-sm text-center text-slate-600">
          Already have an account? <Link href="/login" className="text-blue-600 underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
