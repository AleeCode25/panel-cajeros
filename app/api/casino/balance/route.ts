import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Config from "@/models/Config";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ error: "Falta el nombre de usuario" }, { status: 400 });

    const zeusUrl = `https://admin.casino-zeus.eu/api/operator/v1/users/balance?username=${username.trim()}`;
    const config = await Config.findOne({ key: "ZEUS_TOKEN" });

    if (!config || !config.value) {
      return NextResponse.json({ error: "Falta configurar el Token de Zeus en el panel de Admin" }, { status: 500 });
    }

    const token = config.value;

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