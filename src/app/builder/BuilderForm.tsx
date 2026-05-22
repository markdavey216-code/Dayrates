"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculateInvoiceTotals } from "./calculation";
import { type InvoiceFormData, invoiceSchema } from "./schema";
import { createInvoice, updateInvoice } from "./actions";
import { Trash2, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Customer } from "./types";

interface BuilderFormProps {
  userProfile: { cis_number?: string; vat_number?: string };
  invoiceId?: string;
  initialData?: InvoiceFormData;
  customers: Customer[];
}

export default function BuilderForm({ userProfile, invoiceId, initialData, customers }: BuilderFormProps) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculations, setCalculations] = useState<ReturnType<typeof calculateInvoiceTotals> | null>(null);
  const [showInvoiceList, setShowInvoiceList] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      customer_id: "",
      type: "invoice",
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      use_vat_reverse_charge: false,
      cis_rate: 0.2,
      line_items: [{ description: "", quantity: 1, unit_price: 0, type: "labour", vat_rate: 0.2 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const watchedLineItems = watch("line_items");
  const watchedUseVatReverseCharge = watch("use_vat_reverse_charge");
  const watchedCisRate = watch("cis_rate");

  // Recalculate totals when relevant fields change
  useEffect(() => {
    const subscription = watch((data) => {
      if (data.line_items && selectedCustomer) {
        const formData = data as InvoiceFormData;
        const totals = calculateInvoiceTotals(
          formData,
          userProfile,
          { is_cis_contractor: selectedCustomer.is_cis_contractor }
        );
        setCalculations(totals);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedCustomer, userProfile]);

  // Update calculations when customer changes
  useEffect(() => {
    if (selectedCustomer && watchedLineItems) {
      const formData = { ...watch(), customer_id: selectedCustomer.id } as InvoiceFormData;
      const totals = calculateInvoiceTotals(
        formData,
        userProfile,
        { is_cis_contractor: selectedCustomer.is_cis_contractor }
      );
      setCalculations(totals);
    }
  }, [selectedCustomer, userProfile, watch, watchedLineItems, watchedCisRate, watchedUseVatReverseCharge]);

  // CIS and VAT toggle visibility
  const showCisOptions = !!userProfile.cis_number && selectedCustomer?.is_cis_contractor;
  const showVatReverseCharge = !!userProfile.vat_number;

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const customer = customers.find((c) => c.id === data.customer_id);
      if (!customer) {
        setError("Please select a customer");
        setIsSubmitting(false);
        return;
      }

      const result = invoiceId
        ? await updateInvoice(invoiceId, data, userProfile, { is_cis_contractor: customer.is_cis_contractor })
        : await createInvoice(data, userProfile, { is_cis_contractor: customer.is_cis_contractor });

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/builder");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const addLineItem = (type: "labour" | "materials") => {
    append({
      description: "",
      quantity: 1,
      unit_price: 0,
      type,
      vat_rate: 0.2,
    });
  };

  return (
    <div className="space-y-4">
      {/* Invoice List Toggle */}
      <div className="bg-card border rounded-lg">
        <button
          type="button"
          onClick={() => setShowInvoiceList(!showInvoiceList)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium">Invoice History</span>
          {showInvoiceList ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {showInvoiceList && (
          <div className="p-4 pt-0 space-y-2">
            {/* This would be populated with existing invoices */}
            <p className="text-sm text-muted-foreground">Loading invoices...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Customer Selection */}
        <div className="bg-card border rounded-lg p-4 space-y-2">
          <label className="block text-sm font-medium">Customer *</label>
          <select
            {...register("customer_id")}
            onChange={(e) => {
              const customer = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(customer || null);
            }}
            className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm"
          >
            <option value="">Select a customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.is_cis_contractor ? "(CIS)" : ""} {customer.is_vat_registered ? "(VAT)" : ""}
              </option>
            ))}
          </select>
          {errors.customer_id && (
            <p className="text-destructive text-xs">{errors.customer_id.message}</p>
          )}
        </div>

        {/* Document Type & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select {...register("type")} className="w-full px-3 py-2 border rounded-lg bg-background text-sm">
              <option value="quote">Quote</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select {...register("status")} className="w-full px-3 py-2 border rounded-lg bg-background text-sm">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Issue Date</label>
            <input
              type="date"
              {...register("issue_date")}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>
          <div className="bg-card border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="date"
              {...register("due_date")}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Line Items</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addLineItem("labour")}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
              >
                + Labour
              </button>
              <button
                type="button"
                onClick={() => addLineItem("materials")}
                className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
              >
                + Materials
              </button>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${watchedLineItems[index]?.type === "labour" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                    {watchedLineItems[index]?.type?.toUpperCase() || "LABOUR"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <input
                  {...register(`line_items.${index}.description`)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`line_items.${index}.quantity`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Unit Price (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`line_items.${index}.unit_price`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">VAT</label>
                    <select
                      {...register(`line_items.${index}.vat_rate`, { valueAsNumber: true })}
                      disabled={watchedUseVatReverseCharge}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm disabled:opacity-50"
                    >
                      <option value="0">0%</option>
                      <option value="0.2">20%</option>
                    </select>
                  </div>
                </div>

                <input type="hidden" {...register(`line_items.${index}.type`)} />
              </div>
            ))}
          </div>

          {errors.line_items && (
            <p className="text-destructive text-xs">{errors.line_items.message}</p>
          )}
        </div>

        {/* UK Tax Logic Section */}
        {selectedCustomer && (
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">UK Tax Settings</h3>

            {/* VAT Reverse Charge Toggle */}
            {showVatReverseCharge && (
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <span className="text-sm font-medium">VAT Domestic Reverse Charge</span>
                  <p className="text-xs text-muted-foreground">
                    Enable if customer is VAT registered and using reverse charge scheme
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("use_vat_reverse_charge")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            )}

            {/* Reverse Charge Notice */}
            {watchedUseVatReverseCharge && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>VAT Reverse Charge Notice:</strong><br />
                VAT Reverse Charge: Under the Construction Industry Scheme, the recipient is responsible for accounting for VAT to HMRC.
              </div>
            )}

            {/* CIS Deduction Rate */}
            {showCisOptions && (
              <div className="space-y-2 py-2 border-b">
                <label className="text-sm font-medium">CIS Deduction Rate</label>
                <p className="text-xs text-muted-foreground">
                  Applies to labour items only. CIS is shown because you have a CIS number and this customer is a CIS contractor.
                </p>
                <select
                  {...register("cis_rate", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value={0.2}>20% (Registered CIS contractor)</option>
                  <option value={0.3}>30% (Unregistered CIS contractor)</option>
                  <option value={0}>0% (Gross payment status)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Totals Summary */}
        {calculations && selectedCustomer && (
          <div className="bg-card border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={18} />
              <h3 className="font-medium">Totals</h3>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour Subtotal</span>
                <span>£{calculations.subtotalLabour.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials Subtotal</span>
                <span>£{calculations.subtotalMaterials.toFixed(2)}</span>
              </div>
              {!watchedUseVatReverseCharge && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span>£{calculations.totalVat.toFixed(2)}</span>
                </div>
              )}
              {watchedUseVatReverseCharge && (
                <div className="flex justify-between text-amber-600">
                  <span>VAT (Reverse Charge)</span>
                  <span>£0.00</span>
                </div>
              )}
              {calculations.showCisOptions && calculations.cisDeduction > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>CIS Deduction ({(watchedCisRate || 0) * 100}%)</span>
                  <span>-£{calculations.cisDeduction.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Grand Total</span>
                <span>£{calculations.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-card border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none"
            placeholder="Additional notes or terms..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : invoiceId ? "Update Invoice" : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}