import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import Config from "@/models/Config"; // <-- Token dinámico

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { username, amount } = body;

    if (!username || !amount || amount <= 0) {
      return NextResponse.json({ error: "Faltan datos o el monto es inválido" }, { status: 400 });
    }

    // Buscamos el token en la base de datos
    const config = await Config.findOne({ key: "ZEUS_TOKEN" });
    if (!config || !config.value) {
      return NextResponse.json({ error: "Falta configurar el Token de Zeus en el panel de Admin" }, { status: 500 });
    }
    const token = config.value;

    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const zeusResponse = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      },
      body: JSON.stringify({
        amount: Number(amount),
        operation: "OUTCOME", // OPERACIÓN DE RETIRO
        targetUserName: username.trim()
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      return NextResponse.json({ error: `Zeus rechazó el retiro: ${errorText}` }, { status: 400 });
    }

    const data = await zeusResponse.json();

    // 👇 ACÁ CREAMOS EL REGISTRO EN LA BASE DE DATOS
    const timestamp = Date.now();
    await Transferencia.create({
      remitente: "RETIRO", // Identificador clave
      monto: Number(amount),
      cuit: "00-00000000-0",
      coelsaCode: `RETIRO-${timestamp}`,
      estado: "CARGADA", // Lo marcamos como completado
      usuarioCasino: username.trim(),
      cajeroAsignado: (session.user as any).id,
      fechaCarga: new Date(),
      montoBono: 0,
      conBono: false
    });

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