import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const cajeroId = (session.user as any).id;

    // Calculamos el inicio del día (00:00 hs)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const transferencias = await Transferencia.find({
      cajeroAsignado: cajeroId,
      estado: "CARGADA",
      fechaCarga: { $gte: hoy }
    });

    let totalReal = 0;
    let totalRegalos = 0;

    transferencias.forEach(t => {
      const base = parseFloat(t.monto?.toString() || "0");
      const esEspecial = ['CANAL', 'INSTAGRAM', 'AGENDAMIENTO'].includes(t.remitente) || t.coelsaCode?.startsWith("ESPECIAL-");

      if (esEspecial) {
        totalRegalos += base;
      } else {
        totalReal += base;
      }
    });

    return NextResponse.json({ 
      totalReal, 
      totalRegalos, 
      cantidad: transferencias.length, 
      cajero: session.user?.name 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}