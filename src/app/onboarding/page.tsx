import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/auth/actions";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if onboarding is already done
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_status === "trialing") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1a365d]">Welcome, {profile?.full_name}!</h1>
          <p className="text-gray-500 mt-2">Let's get your account set up</p>
        </div>

        <OnboardingForm tradeType={profile?.trade_type || "electrician"} />
      </div>
    </div>
  );
}
