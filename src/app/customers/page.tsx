import CustomerList from "./CustomerList";

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your client database
        </p>
      </div>
      <CustomerList />
    </div>
  );
}