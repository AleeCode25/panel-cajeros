// app/api/casino/crear-usuario/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Config from "@/models/Config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { username, password } = await req.json();

    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/users/";
    const config = await Config.findOne({ key: "ZEUS_TOKEN" });

    if (!config || !config.value) {
      return NextResponse.json({ error: "Falta configurar el Token de Zeus en el panel de Admin" }, { status: 500 });
    }

    const token = config.value;
    
    const response = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        playerName: username,
        password: password,
        role: "player",
        agentId: 5380501, // Tu ID de agente
        agentName: "Clubprime2026" // Tu nombre de agente
      })
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({
        success: false,
        error: data.message || "Error al crear usuario en Zeus"
      }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}