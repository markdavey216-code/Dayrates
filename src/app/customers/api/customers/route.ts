import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/app/customers/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get("search") || undefined;

  try {
    const customers = await getCustomers(searchQuery);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}