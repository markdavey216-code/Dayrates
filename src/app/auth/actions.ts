"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const businessName = formData.get("businessName") as string;
  const tradeType = formData.get("tradeType") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName,
        trade_type: tradeType,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Manually update the profile to ensure business_name and trade_type are set
  // because the current trigger only handles full_name.
  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        business_name: businessName,
        trade_type: tradeType,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const isCisRegistered = formData.get("isCisRegistered") === "true";
  const isVatRegistered = formData.get("isVatRegistered") === "true";
  const accreditationNumber = formData.get("accreditationNumber") as string;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get trade type to know which field to update
  const { data: profile } = await supabase
    .from("profiles")
    .select("trade_type")
    .eq("id", user.id)
    .single();

  const updateData: any = {
    subscription_status: "trialing",
    onboarding_completed: true,
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // We could also add is_cis_registered/is_vat_registered to profiles if we want, 
  // but for now let's just handle the accreditation numbers.
  if (profile?.trade_type === "plumber") {
    updateData.gas_safe_number = accreditationNumber;
  } else {
    updateData.niceic_number = accreditationNumber;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
