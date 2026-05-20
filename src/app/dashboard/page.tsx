import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1a365d]">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-red-500 font-medium hover:underline">
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
          <p className="text-2xl font-bold text-[#1a365d]">0</p>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Unpaid Invoices</h3>
          <p className="text-2xl font-bold text-[#1a365d]">£0.00</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h2 className="font-bold text-blue-900">Get Started</h2>
        <p className="text-blue-700 text-sm mt-1">
          Complete your first job to see how Dayrates can save you hours every week.
        </p>
        <button className="mt-4 bg-[#1a365d] text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Create New Quote
        </button>
      </div>
    </div>
  );
}
