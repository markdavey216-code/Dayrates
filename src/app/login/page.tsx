"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#1a365d] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
    >
      {pending ? "Logging in..." : "Log in"}
    </button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1a365d]">Dayrates</h1>
          <p className="text-gray-500 mt-2">Welcome back</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent outline-none transition-all"
            />
          </div>

          <SubmitButton />
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          <Link href="/signup" className="text-[#1a365d] font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
