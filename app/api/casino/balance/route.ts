import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ error: "Falta el nombre de usuario" }, { status: 400 });

    const zeusUrl = `https://admin.casino-zeus.eu/api/operator/v1/users/balance?username=${username.trim()}`;
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

    const response = await fetch(zeusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Usuario no encontrado en Zeus" }, { status: 404 });
    }

    const data = await response.json();
    // Devolvemos el balance y el usuario para el frontend
    return NextResponse.json({
      username: username,
      balance: data.balance,
      currency: data.currency
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}