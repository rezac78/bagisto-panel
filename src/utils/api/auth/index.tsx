import { LoginResponse } from "@/utils/types/Login";

import { createApiClient } from "../api-client";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const api = createApiClient({
  baseUrl,
  defaultHeaders: { Accept: "application/json" },
  onError: (err, ctx) => {
    console.error("API Error:", ctx, err);
  },
});

export async function loginAdmin(email: string, password: string, device_name?: string) {
  try {
    // ساخت FormData
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    if (device_name) formData.append("device_name", device_name);

    // ارسال فرم دیتا
    const res = await api.post<LoginResponse>("admin/login", undefined, {
      rawBody: formData,
      headers: { Accept: "application/json" },
    });

    return res;
  } catch (err: any) {
    console.error("❌ Login failed:", err.message ?? err);
    throw err;
  }
}
