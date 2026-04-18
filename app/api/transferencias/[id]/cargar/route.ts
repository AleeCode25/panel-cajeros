import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: any) {
  try {
    await dbConnect();
    
    // 1. Fix obligatorio para Next.js 16
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // 2. Buscamos la transferencia
    const transferencia = await Transferencia.findById(id);
    if (!transferencia) {
      return NextResponse.json({ error: "La transferencia no existe." }, { status: 404 });
    }

    // 3. BLINDAJE: Verificamos si tiene usuario de casino antes de seguir
    if (!transferencia.usuarioCasino) {
      return NextResponse.json({ 
        error: "Falta el Usuario de Casino. Editá la transferencia y agregalo antes de cargar." 
      }, { status: 400 });
    }

    if (transferencia.estado === "CARGADA") {
      return NextResponse.json({ error: "Esta transferencia ya figura como cargada." }, { status: 400 });
    }

    // 4. Llamada a Zeus con tu truco de Postman
    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

    console.log(`🚀 Intentando cargar a: ${transferencia.usuarioCasino}`);

    const zeusResponse = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0' // Tu solución mágica
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
      return NextResponse.json({ error: "El casino rechazó la carga. Revisá los logs." }, { status: 400 });
    }

    // 5. Todo OK: Actualizamos la base de datos
    transferencia.estado = "CARGADA";
    transferencia.fechaCarga = new Date();
    transferencia.cajeroAsignado = (session.user as any).id;
    await transferencia.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Error en la ruta de carga:", error.message);
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}