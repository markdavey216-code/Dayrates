"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateInvoiceTotals } from "./calculation";
import { type InvoiceFormData } from "./schema";

// Get user profile with CIS and VAT settings
export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cis_number, vat_number")
    .eq("id", user.id)
    .single();

  return profile || { cis_number: null, vat_number: null };
}

// Get customers for dropdown
export async function getCustomers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, is_cis_contractor, is_vat_registered")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return customers || [];
}

// Get a single invoice with line items for editing
export async function getInvoice(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return null;

  const { data: lineItems } = await supabase
    .from("line_items")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: true });

  return { ...invoice, line_items: lineItems || [] };
}

// Get next invoice number
export async function getNextInvoiceNumber() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return "INV-0001";

  const { data: lastInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastInvoice) return "INV-0001";

  const lastNum = parseInt(lastInvoice.invoice_number.replace("INV-", ""), 10);
  return `INV-${String(lastNum + 1).padStart(4, "0")}`;
}

// Create invoice with line items
export async function createInvoice(formData: InvoiceFormData, userProfile: { cis_number?: string; vat_number?: string }, customer: { is_cis_contractor: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const invoiceNumber = await getNextInvoiceNumber();
  const calculations = calculateInvoiceTotals(formData, userProfile, customer);

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      customer_id: formData.customer_id,
      invoice_number: invoiceNumber,
      type: formData.type,
      status: formData.status,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      vat_reverse_charge: formData.use_vat_reverse_charge,
      reverse_charge_wording: formData.use_vat_reverse_charge
        ? "VAT Reverse Charge: Under the Construction Industry Scheme, the recipient is responsible for accounting for VAT to HMRC."
        : null,
      cis_rate: calculations.showCisOptions ? formData.cis_rate : null,
      labour_total: calculations.subtotalLabour,
      materials_total: calculations.subtotalMaterials,
      cis_deduction_amount: calculations.cisDeduction,
      vat_amount: calculations.totalVat,
      net_total: calculations.subtotalLabour + calculations.subtotalMaterials,
      gross_total: calculations.grandTotal,
      notes: formData.notes,
    })
    .select()
    .single();

  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError);
    return { error: invoiceError.message };
  }

  // Create line items
  const lineItemsToInsert = formData.line_items.map((item) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    type: item.type,
    vat_rate: item.vat_rate,
  }));

  const { error: lineItemsError } = await supabase
    .from("line_items")
    .insert(lineItemsToInsert);

  if (lineItemsError) {
    console.error("Error creating line items:", lineItemsError);
    // Rollback: delete the invoice
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: lineItemsError.message };
  }

  revalidatePath("/builder");
  return { success: true, invoiceId: invoice.id };
}

// Update invoice with line items
export async function updateInvoice(id: string, formData: InvoiceFormData, userProfile: { cis_number?: string; vat_number?: string }, customer: { is_cis_contractor: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const calculations = calculateInvoiceTotals(formData, userProfile, customer);

  // Update invoice
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      customer_id: formData.customer_id,
      type: formData.type,
      status: formData.status,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      vat_reverse_charge: formData.use_vat_reverse_charge,
      reverse_charge_wording: formData.use_vat_reverse_charge
        ? "VAT Reverse Charge: Under the Construction Industry Scheme, the recipient is responsible for accounting for VAT to HMRC."
        : null,
      cis_rate: calculations.showCisOptions ? formData.cis_rate : null,
      labour_total: calculations.subtotalLabour,
      materials_total: calculations.subtotalMaterials,
      cis_deduction_amount: calculations.cisDeduction,
      vat_amount: calculations.totalVat,
      net_total: calculations.subtotalLabour + calculations.subtotalMaterials,
      gross_total: calculations.grandTotal,
      notes: formData.notes,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (invoiceError) {
    console.error("Error updating invoice:", invoiceError);
    return { error: invoiceError.message };
  }

  // Delete existing line items and recreate
  await supabase.from("line_items").delete().eq("invoice_id", id);

  const lineItemsToInsert = formData.line_items.map((item) => ({
    invoice_id: id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    type: item.type,
    vat_rate: item.vat_rate,
  }));

  const { error: lineItemsError } = await supabase
    .from("line_items")
    .insert(lineItemsToInsert);

  if (lineItemsError) {
    console.error("Error updating line items:", lineItemsError);
    return { error: lineItemsError.message };
  }

  revalidatePath("/builder");
  return { success: true };
}

// Delete invoice
export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting invoice:", error);
    return { error: error.message };
  }

  revalidatePath("/builder");
  return { success: true };
}

// Get all invoices for list view
export async function getInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return invoices || [];
}