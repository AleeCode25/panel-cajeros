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
    
    // Recibimos los datos nuevos del modal
    const { usuarioCasino: usuarioDelModal, conBono, montoBono } = body; 

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Sesión expirada. Volvé a loguearte." }, { status: 401 });

    const transferencia = await Transferencia.findById(id);
    if (!transferencia) return NextResponse.json({ error: "No se encontró la transferencia en la base de datos." }, { status: 404 });

    const usuarioFinal = usuarioDelModal || transferencia.usuarioCasino;
    if (!usuarioFinal) return NextResponse.json({ error: "Debes ingresar un Usuario de Casino." }, { status: 400 });

    // Calculamos el total (Base de la transferencia + Bono si aplica)
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
    
    // Enviamos el TOTAL (Base + Bono) a Zeus
    const zeusResponse = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      },
      body: JSON.stringify({
        amount: totalAAcreditar, // <--- AHORA SÍ LLEGA EL BONO A ZEUS
        operation: "INCOME",
        targetUserName: usuarioFinal.trim()
      })
    });

    if (!zeusResponse.ok) {
      const errorText = await zeusResponse.text();
      return NextResponse.json({ error: `Zeus rechazó: ${errorText}` }, { status: 400 });
    }

    // Actualizamos nuestra base de datos con toda la info
    transferencia.estado = "CARGADA";
    transferencia.usuarioCasino = usuarioFinal;
    transferencia.fechaCarga = new Date();
    transferencia.cajeroAsignado = (session.user as any).id;
    transferencia.montoBono = extraBono; // Guardamos el bono para las estadísticas
    transferencia.conBono = conBono;
    
    await transferencia.save();

    return NextResponse.json({ success: true, acreditado: totalAAcreditar });
  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}