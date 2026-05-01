import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Config from "@/models/Config";

export async function POST(req: Request, { params }: any) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    
    const { usuarioCasino: usuarioDelModal, conBono, montoBono, apiSecret } = body; 

    // --- LÓGICA DE AUTENTICACIÓN DUAL ---
    const session = await getServerSession(authOptions);
    const CLAVE_SECRETA_BACKEND = "ReySanto2026_AutoCargaSegura"; 
    
    let cajeroId = null;

    if (apiSecret && apiSecret === CLAVE_SECRETA_BACKEND) {
        // ASIGNAMOS EL ID DEL USUARIO "AUTOCARGA" QUE CREASTE
        cajeroId = "69f3fdfc26d70c5c586f746f";
    } else if (session && session.user) {
        cajeroId = (session.user as any).id;
    } else {
        return NextResponse.json({ error: "No autorizado. Sesión expirada o clave inválida." }, { status: 401 });
    }
    // ------------------------------------

    const transferencia = await Transferencia.findById(id);
    if (!transferencia) return NextResponse.json({ error: "No se encontró la transferencia en la base de datos." }, { status: 404 });

    const usuarioFinal = usuarioDelModal || transferencia.usuarioCasino;
    if (!usuarioFinal) return NextResponse.json({ error: "Debes ingresar un Usuario de Casino." }, { status: 400 });

    const safeUsername = usuarioFinal.trim().toLowerCase();

    const montoBase = Number(transferencia.monto);
    const extraBono = conBono ? Number(montoBono) : 0;
    const totalAAcreditar = montoBase + extraBono;

    if (totalAAcreditar < 10) {
      return NextResponse.json({ error: "El casino no permite cargas menores a $10 ARS." }, { status: 400 });
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
        amount: totalAAcreditar, 
        operation: "INCOME",
        targetUserName: safeUsername
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      return NextResponse.json({ error: `Zeus rechazó: ${errorText}` }, { status: 400 });
    }

    transferencia.estado = "CARGADA";
    transferencia.usuarioCasino = safeUsername;
    transferencia.fechaCarga = new Date();
    transferencia.cajeroAsignado = cajeroId; // <-- Ahora Mongoose va a guardar el ObjectId sin chistar
    transferencia.montoBono = extraBono;
    transferencia.conBono = conBono;
    
    await transferencia.save();

    return NextResponse.json({ success: true, acreditado: totalAAcreditar });
  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}