import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json();

  const response = NextResponse.json({ message: "Token saved" });
  response.cookies.set("access_token", token, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 60, // 1 روز
    sameSite: "lax",
  });

  return response;
}
