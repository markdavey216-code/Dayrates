import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  is_cis_contractor: z.boolean(),
  is_vat_registered: z.boolean(),
  site_notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
