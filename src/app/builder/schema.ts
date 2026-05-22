import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be at least 0.01"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  type: z.enum(["labour", "materials"]),
  vat_rate: z.number(),
});

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid("Please select a customer"),
  invoice_number: z.string().optional(),
  type: z.enum(["quote", "invoice"]),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  issue_date: z.string(),
  due_date: z.string(),
  use_vat_reverse_charge: z.boolean(),
  cis_rate: z.number().optional(),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
