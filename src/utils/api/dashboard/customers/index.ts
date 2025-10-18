import { AdminCustomersResponse } from "@/utils/types/dashboard/customers";
import { OrdersResponse } from "@/utils/types/dashboard/order";

import { createApiClient } from "../../api-client";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const api = createApiClient({
  baseUrl,
  defaultHeaders: { Accept: "application/json" },
  onError: (err, ctx) => {
    console.error("API Error:", ctx, err);
  },
});

export async function getCustomers(
  Token: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "id",
  order: string = "asc",
) {
  try {
    const res = await api.get<AdminCustomersResponse>(
      `admin/customers?page=${page}&limit=${limit}&sort=${sort}&order=${order}`,
      {
        headers: { Authorization: `Bearer ${Token}` },
      },
    );
    return res;
  } catch (err: any) {
    console.error("❌ getCustomers failed:", err.message ?? err);
    return null;
  }
}
export async function getCustomerID(Token: string, id: string) {
  try {
    const res = await api.get<AdminCustomersResponse>(`admin/customers/${id}`, {
      headers: { Authorization: `Bearer ${Token}` },
    });
    return res;
  } catch (err: any) {
    console.error("❌ getCustomers failed:", err.message ?? err);
    return null;
  }
}
export async function getCustomerOrders(Token: string, id: string) {
  try {
    const res = await api.get<OrdersResponse>(`admin/customers/${id}/orders`, {
      headers: { Authorization: `Bearer ${Token}` },
    });
    return res;
  } catch (err: any) {
    console.error("❌ getCustomers failed:", err.message ?? err);
    return null;
  }
}
export async function getCustomerInvoices(Token: string, id: string) {
  try {
    const res = await api.get<OrdersResponse>(`admin/customers/${id}/invoices`, {
      headers: { Authorization: `Bearer ${Token}` },
    });
    return res;
  } catch (err: any) {
    console.error("❌ getCustomers failed:", err.message ?? err);
    return null;
  }
}
export async function DeleteCustomer(Token: string, id: string) {
  try {
    const res = await api.delete<AdminCustomersResponse>(`admin/customers/${id}`, {
      headers: { Authorization: `Bearer ${Token}` },
    });
    return res;
  } catch (err: any) {
    console.error("❌ getCustomers failed:", err.message ?? err);
    return null;
  }
}
