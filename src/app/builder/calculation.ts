import { type InvoiceFormData } from "./schema";

// Calculation logic (UK Specific)
export function calculateInvoiceTotals(
  data: InvoiceFormData,
  userProfile: { cis_number?: string | null; vat_number?: string | null },
  customer: { is_cis_contractor: boolean }
) {
  let subtotalLabour = 0;
  let subtotalMaterials = 0;
  let totalVat = 0;

  data.line_items.forEach((item) => {
    const itemTotal = item.quantity * item.unit_price;
    if (item.type === "labour") subtotalLabour += itemTotal;
    else subtotalMaterials += itemTotal;

    // VAT logic - only apply if not using reverse charge
    if (!data.use_vat_reverse_charge) {
      totalVat += itemTotal * (item.vat_rate || 0);
    }
  });

  // CIS logic: Only trigger if owner has CIS number AND customer is a CIS contractor
  let cisDeduction = 0;
  const canApplyCis = !!userProfile.cis_number && customer.is_cis_contractor;

  if (canApplyCis && data.cis_rate) {
    cisDeduction = subtotalLabour * data.cis_rate;
  }

  const grandTotal = subtotalLabour + subtotalMaterials + totalVat - cisDeduction;

  return {
    subtotalLabour,
    subtotalMaterials,
    totalVat,
    cisDeduction,
    grandTotal,
    showReverseChargeToggle: !!userProfile.vat_number,
    showCisOptions: canApplyCis,
  };
}
