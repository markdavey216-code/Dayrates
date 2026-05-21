export interface Customer {
  id: string;
  name: string;
  is_cis_contractor: boolean;
  is_vat_registered: boolean;
}

export interface LineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  type: "labour" | "materials";
  vat_rate: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string;
  job_id: string | null;
  invoice_number: string;
  type: "quote" | "invoice";
  status: "draft" | "sent" | "paid" | "overdue";
  issue_date: string;
  due_date: string;
  vat_reverse_charge: boolean;
  reverse_charge_wording: string | null;
  cis_rate: number | null;
  labour_total: number;
  materials_total: number;
  cis_deduction_amount: number;
  vat_amount: number;
  net_total: number;
  gross_total: number;
  notes: string | null;
  created_at: string;
  customers?: { name: string };
}

export interface UserProfile {
  cis_number: string | null;
  vat_number: string | null;
}