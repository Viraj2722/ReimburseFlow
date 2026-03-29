"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ExpenseFormData = {
  merchantName: string;
  expenseType: string;
  description: string;
  expenseLines: string;
  amount: string;
  currency: string;
  date: string;
  receipt: File | null;
};

const expenseTypes = [
  "Meals",
  "Travel",
  "Transport",
  "Accommodation",
  "Office Supplies",
  "Medical",
  "Entertainment",
  "Other",
];

export default function NewExpensePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<ExpenseFormData>({
    merchantName: "",
    expenseType: "Other",
    description: "",
    expenseLines: "",
    amount: "",
    currency: "INR",
    date: "",
    receipt: null,
  });

  const [receiptName, setReceiptName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      receipt: file,
    }));

    setReceiptName(file ? file.name : "");
  };

  const handleScanReceipt = async () => {
    if (!formData.receipt) {
      setMessage("Please upload a receipt first.");
      return;
    }

    try {
      setIsScanning(true);
      setMessage("Scanning receipt...");

      // Temporary mock OCR autofill
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setFormData((prev) => ({
        ...prev,
        merchantName: prev.merchantName || "McDonald's",
        expenseType: prev.expenseType || "Meals",
        description: prev.description || "Meal expense from scanned receipt",
        expenseLines: prev.expenseLines || "Burger Meal\nFries\nCoke",
        amount: prev.amount || "450",
        currency: prev.currency || "INR",
        date: prev.date || new Date().toISOString().split("T")[0],
      }));

      setMessage("Receipt scanned successfully. Please verify the details.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to scan receipt.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.merchantName ||
      !formData.description ||
      !formData.amount ||
      !formData.date
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      console.log("Submitted expense:", {
        ...formData,
        receipt: formData.receipt?.name || null,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage("Expense submitted successfully.");

      setTimeout(() => {
        router.push("/expenses");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to submit expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0f172a]">New Expense</h1>
            <p className="mt-1 text-sm text-[#64748b]">
              Upload a receipt or manually add expense details
            </p>
          </div>

          <Link
            href="/expenses"
            className="rounded-lg border border-[#dbe3f0] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm hover:bg-[#f8fafc]"
          >
            Back to Expenses
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-[#0f172a]">
                Receipt Upload
              </h2>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Upload Receipt Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="block w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#334155] file:mr-4 file:rounded-md file:border-0 file:bg-[#ede9fe] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#5b4ce6]"
                  />
                  {receiptName && (
                    <p className="mt-2 text-sm text-[#64748b]">
                      Selected: {receiptName}
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleScanReceipt}
                    disabled={isScanning}
                    className="w-full rounded-lg bg-[#5b4ce6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4c3fd1] disabled:opacity-70"
                  >
                    {isScanning ? "Scanning..." : "Scan Receipt"}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] pt-6">
              <h2 className="mb-4 text-lg font-semibold text-[#0f172a]">
                Expense Details
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Merchant / Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="merchantName"
                    value={formData.merchantName}
                    onChange={handleChange}
                    placeholder="Enter merchant name"
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Expense Type
                  </label>
                  <select
                    name="expenseType"
                    value={formData.expenseType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  >
                    {expenseTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter short expense description"
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Expense Lines
                  </label>
                  <textarea
                    name="expenseLines"
                    value={formData.expenseLines}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Itemized lines from receipt"
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#dbe3f0] px-3 py-2 text-sm text-[#0f172a] focus:border-[#5b4ce6] outline-none"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {message && (
              <div className="rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-3 text-sm text-[#5b21b6]">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[#e2e8f0] pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/expenses"
                className="rounded-lg border border-[#dbe3f0] bg-white px-5 py-2.5 text-center text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#5b4ce6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4c3fd1] disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}