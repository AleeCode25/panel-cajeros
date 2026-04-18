import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: any) {
  try {
    await dbConnect();
    
    // ✅ FIX CRÍTICO NEXT.JS 16: Hay que esperar a los params o da Error 500
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Buscamos la transferencia
    const transferencia = await Transferencia.findById(id);
    if (!transferencia) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    if (transferencia.estado === "CARGADA") {
      return NextResponse.json({ error: "Esta transferencia ya fue cargada" }, { status: 400 });
    }

    // Datos de Zeus
    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

    console.log(`🚀 Cargando transferencia ID: ${id} para ${transferencia.usuarioCasino}`);

    // Usamos tu solución de Postman que te funcionó en las especiales
    const zeusResponse = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0' 
      },
      body: JSON.stringify({
        amount: transferencia.monto,
        operation: "INCOME",
        targetUserName: transferencia.usuarioCasino.trim()
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      console.error("❌ ZEUS RECHAZÓ:", errorText);
      
      // Si acá te vuelve a salir el error de Cloudflare en el log, 
      // vas a tener que volver a poner el ProxyAgent sí o sí.
      return NextResponse.json({ error: "El casino rechazó la carga." }, { status: 400 });
    }

    // Si todo salió bien, actualizamos la base de datos
    transferencia.estado = "CARGADA";
    transferencia.fechaCarga = new Date();
    transferencia.cajeroAsignado = (session.user as any).id;
    await transferencia.save();

    console.log("✅ Carga exitosa");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Error interno:", error.message);
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}