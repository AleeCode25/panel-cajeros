import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    console.log("🚀 Iniciando carga especial...");
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { usuarioCasino, tipo } = body;

    if (!usuarioCasino || !tipo) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const cleanUser = usuarioCasino.trim();
    const MONTO_FIJO = 500;

    // 1. Verificamos si ya existe el premio
    const yaExiste = await Transferencia.findOne({ 
      usuarioCasino: cleanUser, 
      remitente: tipo 
    });

    if (yaExiste) {
      return NextResponse.json({ 
        error: `Este usuario ya recibió la carga de ${tipo} anteriormente.` 
      }, { status: 409 });
    }

    // 2. Llamada a Zeus
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

        amount: MONTO_FIJO,

        operation: "INCOME",

        targetUserName: cleanUser

      })

    });

    // 👇 ESTO ES LO NUEVO: CAPTURAR EL ERROR REAL 👇
    if (!zeusResponse.ok) {
      const errorStatus = zeusResponse.status;
      const errorText = await zeusResponse.text(); // Leemos el HTML o JSON que devuelve Zeus
      
      console.error(`❌ ZEUS RECHAZÓ (Status: ${errorStatus}):`, errorText);
      
      // Si devuelve HTML, seguro es el bloqueo de Cloudflare
      if (errorText.includes("<html") || errorText.includes("cloudflare")) {
         return NextResponse.json({ 
           error: "El casino bloqueó la IP de Vercel (Cloudflare 403)." 
         }, { status: 400 });
      }

      return NextResponse.json({ 
        error: `El casino rechazó la carga. Código: ${errorStatus}` 
      }, { status: 400 });
    }

    // 3. Crear el registro con los campos requeridos "dummy"
    // Generamos un ID único para que no choquen en la base de datos
    const timestamp = Date.now();

    try {
      await Transferencia.create({
        remitente: tipo, 
        monto: MONTO_FIJO,
        cuit: "00-00000000-0",
        // Llenamos los campos que te pedía la base de datos con valores genéricos
        coelsaCode: `ESPECIAL-${tipo}-${timestamp}`, 
        transaccionId: `TX-${tipo}-${timestamp}`,
        estado: "CARGADA",
        usuarioCasino: cleanUser,
        cajeroAsignado: (session.user as any).id,
        fechaCarga: new Date(),
        montoBono: 0,
        conBono: false
      });
      
      console.log("✅ Carga especial registrada exitosamente");
      return NextResponse.json({ success: true });

    } catch (dbError: any) {
      console.log("❌ Error de Validación:", dbError.message);
      return NextResponse.json({ error: "Error de validación en BD: " + dbError.message }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}