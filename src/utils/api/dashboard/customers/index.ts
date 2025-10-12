import { AdminCustomersResponse } from "@/utils/types/dashboard/customers";

import { createApiClient } from "../../api-client";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const api = createApiClient({
  baseUrl,
  defaultHeaders: { Accept: "application/json" },
  onError: (err, ctx) => {
    console.error("API Error:", ctx, err);
  },
});

export async function getCustomers(Token: string) {
  try {
    const res = await api.get<AdminCustomersResponse>("admin/customers", {
      headers: { Authorization: `Bearer ${Token}` },
    });
    return res;
  } catch (err: any) {
    console.error("❌ Login failed:", err.message ?? err);
    throw err;
  }
}
