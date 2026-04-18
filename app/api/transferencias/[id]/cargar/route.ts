import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: any) {
  try {
    await dbConnect();
    const { id } = await params;

    // 1. LEER LO QUE VIENE DEL MODAL
    const body = await req.json();
    const { usuarioCasino: usuarioDelModal } = body; 

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const transferencia = await Transferencia.findById(id);
    if (!transferencia) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    // 2. ELEGIR QUÉ USUARIO USAR
    // Prioridad: 1. Lo que escribiste en el modal | 2. Lo que ya estaba en DB
    const usuarioFinal = usuarioDelModal || transferencia.usuarioCasino;

    if (!usuarioFinal) {
      return NextResponse.json({ error: "Falta el Usuario de Casino." }, { status: 400 });
    }

    const montoACargar = transferencia.monto;

    if (montoACargar < 10) {
      return NextResponse.json({ 
        error: "El monto mínimo de carga en el casino es de $10 ARS." 
      }, { status: 400 });
    }

    // 3. LLAMADA A ZEUS (con el usuario del modal)
    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

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
        targetUserName: usuarioFinal.trim() // <--- USAMOS EL DEL MODAL
      })
    });

    if (!zeusResponse.ok) {
      const errorStatus = zeusResponse.status;
      const errorText = await zeusResponse.text(); 
      
      console.error(`❌ ZEUS RECHAZÓ (Status: ${errorStatus}):`, errorText);
      
      // Si es un error de Cloudflare, lo sabremos por el HTML
      if (errorText.includes("<html") || errorText.includes("cloudflare")) {
         return NextResponse.json({ error: "Bloqueo de Cloudflare (IP quemada)." }, { status: 403 });
      }

      // Si es un error de Zeus (ej: usuario no existe), nos va a dar un JSON
      return NextResponse.json({ 
        error: `Error de Zeus: ${errorText}` 
      }, { status: 400 });
    }

    // 4. ACTUALIZAR DB (y guardar el nombre que escribiste para que no sea más null)
    transferencia.estado = "CARGADA";
    transferencia.usuarioCasino = usuarioFinal; // Guardamos el nombre del modal
    transferencia.fechaCarga = new Date();
    transferencia.cajeroAsignado = (session.user as any).id;
    await transferencia.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Error: " + error.message }, { status: 500 });
  }
}