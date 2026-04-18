import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Config from "@/models/Config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { username, amount } = body;

    if (!username || !amount || amount <= 0) {
      return NextResponse.json({ error: "Faltan datos o el monto es inválido" }, { status: 400 });
    }

    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const config = await Config.findOne({ key: "ZEUS_TOKEN" });

    if (!config || !config.value) {
      return NextResponse.json({ error: "Falta configurar el Token de Zeus en el panel de Admin" }, { status: 500 });
    }

    const token = config.value;
    
    const zeusResponse = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      },
      body: JSON.stringify({
        amount: Number(amount),
        operation: "OUTCOME",
        targetUserName: username.trim()
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      return NextResponse.json({ error: `Zeus rechazó el retiro: ${errorText}` }, { status: 400 });
    }

    // 👇 ACÁ ATRAPAMOS EL NUEVO SALDO QUE DEVUELVE ZEUS
    const data = await zeusResponse.json();

    return NextResponse.json({ 
      success: true, 
      amount, 
      username,
      newBalance: data.newBalance 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}