import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GRAPHQL_URL =
  process.env.GRAPHQL_URL_SERVER ||
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  "http://localhost:3000/graphql";

const ADMIN_LOGIN = `
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      accessToken
      user { id name email }
    }
  }
`;

export async function POST(req: Request) {
  let body: { email?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const pin = (body.pin || "").trim();

  if (!email || !pin) {
    return NextResponse.json(
      { error: "Email y PIN son obligatorios" },
      { status: 400 }
    );
  }

  // Validate the credentials against the backend (PIN is verified against the
  // hashed value, and the account must have panel access).
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ADMIN_LOGIN,
        variables: { input: { email, pin } },
      }),
    });
    const json = await res.json();

    const token = json?.data?.adminLogin?.accessToken;
    if (!token) {
      const message = json?.errors?.[0]?.message || "Email o PIN incorrecto";
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar con el servidor" },
      { status: 502 }
    );
  }
}
