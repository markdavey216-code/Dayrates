"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/auth/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#1a365d] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
    >
      {pending ? "Setting up..." : "Complete Setup"}
    </button>
  );
}

interface OnboardingFormProps {
  tradeType: string;
}

export default function OnboardingForm({ tradeType }: OnboardingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCisRegistered, setIsCisRegistered] = useState(false);
  const [isVatRegistered, setIsVatRegistered] = useState(false);

  async function handleSubmit(formData: FormData) {
    // Add the toggle values to formData manually as they are handled by react state here
    formData.append("isCisRegistered", isCisRegistered.toString());
    formData.append("isVatRegistered", isVatRegistered.toString());
    
    const result = await completeOnboarding(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
          <div>
            <label className="font-semibold text-[#1a365d]">CIS Registered?</label>
            <p className="text-xs text-gray-500">Construction Industry Scheme</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCisRegistered(!isCisRegistered)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isCisRegistered ? "bg-[#1a365d]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isCisRegistered ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
          <div>
            <label className="font-semibold text-[#1a365d]">VAT Registered?</label>
            <p className="text-xs text-gray-500">Standard 20% or Reverse Charge</p>
          </div>
          <button
            type="button"
            onClick={() => setIsVatRegistered(!isVatRegistered)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isVatRegistered ? "bg-[#1a365d]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isVatRegistered ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {tradeType === "plumber" ? "Gas Safe Register Number" : "NICEIC / Accreditation Number"}
          </label>
          <input
            name="accreditationNumber"
            type="text"
            required
            placeholder={tradeType === "plumber" ? "e.g. 123456" : "e.g. D123456"}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <p className="text-xs text-center text-gray-400">
        Starting your 14-day free trial. Then £39/month. Cancel anytime.
      </p>
    </form>
  );
}
