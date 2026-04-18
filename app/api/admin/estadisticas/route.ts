import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Seguridad: Solo el ADMIN entra acá
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const cajeroId = searchParams.get("cajeroId");

    // Construimos el filtro
    let query: any = { estado: "CARGADA" };

    // Filtro por fecha (fechaCarga es cuando se confirmó el dinero en Zeus)
    if (from && to) {
      query.fechaCarga = { 
        $gte: new Date(from), 
        $lte: new Date(to) 
      };
    }

    // Filtro por cajero específico
    if (cajeroId && cajeroId !== "todos") {
      query.cajeroAsignado = cajeroId;
    }

    const transferencias = await Transferencia.find(query)
      .populate("cajeroAsignado", "nombre")
      .sort({ fechaCarga: -1 });

    // Calculamos los totales
    let totalEntrado = 0; // Monto + Bono
    let totalSinBono = 0; // Solo lo que entró por transferencia
    let totalBonos = 0;   // Solo los regalos de bonos

    transferencias.forEach(t => {
      const montoBase = parseFloat(t.monto.toString()) || 0;
      const montoBono = parseFloat(t.montoBono?.toString() || "0");
      
      totalSinBono += montoBase;
      totalBonos += montoBono;
      totalEntrado += (montoBase + montoBono);
    });

    return NextResponse.json({
      resumen: {
        totalEntrado,
        totalSinBono,
        totalBonos,
        cantidad: transferencias.length
      },
      movimientos: transferencias
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}