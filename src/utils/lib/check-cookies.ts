import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function getAuthToken(type: "user" | "seller", request?: NextRequest): Promise<string | null> {
  const cookieName = type === "seller" ? "access_token_seller" : "access_token";

  if (request) {
    return request.cookies.get(cookieName)?.value ?? null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value ?? null;
}
