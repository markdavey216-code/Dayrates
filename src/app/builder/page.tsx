import { getUserProfile, getCustomers, getInvoice } from "./actions";
import BuilderForm from "./BuilderForm";
import type { Invoice, LineItem } from "./types";

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function BuilderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [userProfile, customers] = await Promise.all([
    getUserProfile(),
    getCustomers(),
  ]);

  let initialData;
  if (params.edit) {
    const invoice = await getInvoice(params.edit) as (Invoice & { line_items: LineItem[] }) | null;
    if (invoice) {
      initialData = {
        customer_id: invoice.customer_id,
        type: invoice.type,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        use_vat_reverse_charge: invoice.vat_reverse_charge,
        cis_rate: invoice.cis_rate || 0.2,
        notes: invoice.notes || "",
        line_items: invoice.line_items.map((item: LineItem) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          type: item.type,
          vat_rate: Number(item.vat_rate),
        })),
      };
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold">
          {params.edit ? "Edit Invoice" : "Quote & Invoice Builder"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {params.edit ? "Update your invoice" : "Create professional quotes and invoices"}
        </p>
      </div>

      <BuilderForm
        userProfile={userProfile}
        invoiceId={params.edit}
        initialData={initialData}
        customers={customers}
      />
    </div>
  );
}