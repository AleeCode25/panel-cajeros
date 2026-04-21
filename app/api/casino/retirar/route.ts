import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import Config from "@/models/Config";

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

    const safeUsername = username.trim().toLowerCase(); // Filtro backend de minúscula

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
        targetUserName: safeUsername
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      return NextResponse.json({ error: `Zeus rechazó el retiro: ${errorText}` }, { status: 400 });
    }

    // A veces Zeus devuelve texto vacío en lugar de JSON al ser exitoso, esto lo previene:
    let data: any = {};
    try {
      data = await zeusResponse.json();
    } catch (e) {
      console.log("Zeus no devolvió JSON, pero el retiro fue exitoso");
    }

    // ACÁ CREAMOS EL REGISTRO CON EL TRANSACCION_ID AGREGADO
    const timestamp = Date.now();
    await Transferencia.create({
      remitente: "RETIRO",
      monto: Number(amount),
      cuit: "00-00000000-0",
      coelsaCode: `RETIRO-${timestamp}`,
      estado: "CARGADA", 
      usuarioCasino: safeUsername,
      cajeroAsignado: (session.user as any).id,
      fechaCarga: new Date(),
      montoBono: 0,
      conBono: false,
      banco: "SISTEMA",       
      comprobante: "RETIRO",   
      transaccionId: `RETIRO-${timestamp}`
    });

    return NextResponse.json({ 
      success: true, 
      amount, 
      username: safeUsername,
      newBalance: data.newBalance || 0 
    });

  } catch (error: any) {
    console.error("ERROR EN RETIRO:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}