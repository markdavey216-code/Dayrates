"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormData } from "./actions";
import { createCustomer, updateCustomer } from "./actions";
import { X } from "lucide-react";
import { useState } from "react";

interface CustomerFormProps {
  customer?: CustomerFormData;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onCancel }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: "",
      email: "",
      phone: "",
      address: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postcode: "",
      is_cis_contractor: false,
      is_vat_registered: false,
      site_notes: "",
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = customer?.id
        ? await updateCustomer(customer.id, data)
        : await createCustomer(data);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/customers");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-lg shadow-lg border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {customer?.id ? "Edit Customer" : "Add Customer"}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="John Smith"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="07700 900 000"
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium mb-1">Address Line 1</label>
              <input
                {...register("address_line1")}
                type="text"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="123 High Street"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium mb-1">Address Line 2</label>
              <input
                {...register("address_line2")}
                type="text"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="Flat 4"
              />
            </div>

            {/* City and Postcode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  {...register("city")}
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  placeholder="London"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postcode</label>
                <input
                  {...register("postcode")}
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  placeholder="SW1A 1AA"
                />
              </div>
            </div>

            {/* UK-Specific Flags */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">UK-Specific Settings</h3>
              
              {/* CIS Contractor */}
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">CIS Contractor</span>
                  <p className="text-xs text-muted-foreground">
                    Construction Industry Scheme registered
                  </p>
                </div>
                <div className="relative">
                  <input
                    {...register("is_cis_contractor")}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors cursor-pointer" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 cursor-pointer" />
                </div>
              </label>

              {/* VAT Registered */}
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">VAT Registered</span>
                  <p className="text-xs text-muted-foreground">
                    Registered for UK VAT
                  </p>
                </div>
                <div className="relative">
                  <input
                    {...register("is_vat_registered")}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors cursor-pointer" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 cursor-pointer" />
                </div>
              </label>
            </div>

            {/* Site Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Site Notes</label>
              <textarea
                {...register("site_notes")}
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
                placeholder="Access via side gate, dog in garden..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? "Saving..." : customer?.id ? "Update Customer" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}