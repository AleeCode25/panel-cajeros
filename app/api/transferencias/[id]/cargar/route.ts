import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Config from "@/models/Config";

export async function POST(req: Request, { params }: any) {
  try {
    await dbConnect();
    const { id } = await params; // En Next.js 14+ a veces no hace falta el await en params, pero lo dejamos como lo tenías.
    const body = await req.json();
    
    // Agregamos "apiSecret" a lo que recibimos del body
    const { usuarioCasino: usuarioDelModal, conBono, montoBono, apiSecret } = body; 

    // --- LÓGICA DE AUTENTICACIÓN DUAL ---
    const session = await getServerSession(authOptions);
    const CLAVE_SECRETA_BACKEND = "ReySanto2026_AutoCargaSegura"; // Podés cambiar esta contraseña
    let cajeroId = "";

    // 1. Verificamos si es una Autocarga desde Render
    if (apiSecret && apiSecret === CLAVE_SECRETA_BACKEND) {
        cajeroId = "AUTOCARGA";
    } 
    // 2. Si no es Autocarga, verificamos que haya un cajero logueado
    else if (session && session.user) {
        cajeroId = (session.user as any).id;
    } 
    // 3. Si no hay ni clave ni sesión, bloqueamos
    else {
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
    transferencia.cajeroAsignado = cajeroId; // <-- ACÁ GUARDA "AUTOCARGA" O EL ID DEL CAJERO
    transferencia.montoBono = extraBono;
    transferencia.conBono = conBono;
    
    await transferencia.save();

    return NextResponse.json({ success: true, acreditado: totalAAcreditar });
  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}