"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { fetchCountriesWithCurrencies } from "@/lib/api";
import { Country } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    countryCode: "",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCountries = async () => {
      const allCountries = await fetchCountriesWithCurrencies();
      setCountries(allCountries);

      if (allCountries.length > 0) {
        setForm((prev) => ({ ...prev, countryCode: allCountries[0].code }));
      }

      setLoadingCountries(false);
    };

    loadCountries();
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === form.countryCode),
    [countries, form.countryCode],
  );

  const selectedCurrency = selectedCountry?.currencies[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password || !form.countryCode) {
      setError("Please fill all required fields.");
      return;
    }

    if (!selectedCurrency) {
      setError("Please pick a valid country with a currency.");
      return;
    }

    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          company_name: form.companyName || `${form.fullName}'s Company`,
          country_code: form.countryCode,
          company_currency: selectedCurrency.code,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already has a company")) {
        setError("Admin signup is disabled for this workspace. Ask your admin to share login credentials.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (!signUpData.session) {
      setError("Signup completed. Please check your email confirmation settings, then log in.");
      router.push("/login");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form className="space-y-4 p-6 border rounded bg-white shadow-md w-80" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold text-center">Admin Signup</h2>

        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
          Use this only to create the first company admin. Managers and employees should log in with credentials created by admin.
        </p>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</p>
        ) : null}

        <input
          name="fullName"
          placeholder="Your Name"
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          name="companyName"
          placeholder="Company Name"
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

        <select
          name="countryCode"
          onChange={handleChange}
          value={form.countryCode}
          className="border p-2 w-full rounded"
          disabled={loadingCountries}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>

        {selectedCurrency ? (
          <p className="text-xs text-slate-600">
            Company base currency will be set to {selectedCurrency.code}.
          </p>
        ) : null}

        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 w-full rounded">
          {loading ? "Creating account..." : "Signup"}
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}