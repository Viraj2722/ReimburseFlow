"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ FRONTEND MOCK LOGIN (no backend needed)
    if (!form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }

    const fakeUser = {
      name: "Ishita",
      role: "admin",
    };

    // store mock auth
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem("user", JSON.stringify(fakeUser));

    alert("Login successful!");

    // redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 border rounded bg-white shadow-md w-80"
      >
        <h2 className="text-xl font-bold text-center">Login</h2>

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
          Login
        </button>

        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-500 underline">
            Signup
          </a>
        </p>
      </form>
    </div>
  );
}