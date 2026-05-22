"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type CustomerFormData } from "./schema";

export async function getCustomers(searchQuery?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,postcode.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
  
  return data || [];
}

export async function getCustomer(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  
  if (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
  
  return data;
}

export async function createCustomer(formData: CustomerFormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("customers").insert({
    user_id: user.id,
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    address: formData.address || null,
    address_line1: formData.address_line1 || null,
    address_line2: formData.address_line2 || null,
    city: formData.city || null,
    postcode: formData.postcode || null,
    is_cis_contractor: formData.is_cis_contractor,
    is_vat_registered: formData.is_vat_registered,
    site_notes: formData.site_notes || null,
  });

  if (error) {
    console.error("Error creating customer:", error);
    return { error: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomer(id: string, formData: CustomerFormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("customers")
    .update({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      address_line1: formData.address_line1 || null,
      address_line2: formData.address_line2 || null,
      city: formData.city || null,
      postcode: formData.postcode || null,
      is_cis_contractor: formData.is_cis_contractor,
      is_vat_registered: formData.is_vat_registered,
      site_notes: formData.site_notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating customer:", error);
    return { error: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting customer:", error);
    return { error: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}