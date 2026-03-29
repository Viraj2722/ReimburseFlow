"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ simple validation
    if (!form.name || !form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }

    // ✅ MOCK signup success
    alert("Signup successful!");

    // redirect to login
    router.push("/login");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form className="space-y-4 p-6 border rounded bg-white shadow-md w-80" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold text-center">Signup</h2>

        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

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

        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 w-full rounded">
          Signup
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}