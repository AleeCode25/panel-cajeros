import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { username } = await req.json();
    const nuevaClave = "12345678"; // La clave que pediste del 1 al 8

    const zeusUrl = `https://admin.casino-zeus.eu/api/operator/v1/users/${username}/reset-password`;
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

    const response = await fetch(zeusUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      },
      body: JSON.stringify({ password: nuevaClave })
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: errorData.message || "No se pudo encontrar al usuario o error en Zeus" 
      }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}