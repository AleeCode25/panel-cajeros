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

    // Calculamos los totales separados
    let totalEntrado = 0;   // Monto + Bono + Regalos (Todo lo que entró a Zeus)
    let totalSinBono = 0;   // Solo PLATA REAL (lo que entró por transferencia)
    let totalBonos = 0;     // Solo los regalos de bonos en transferencias
    let totalEspeciales = 0;// Fichas regaladas por Canal, Instagram, etc.

    transferencias.forEach(t => {
      const montoBase = parseFloat(t.monto.toString()) || 0;
      const montoBono = parseFloat(t.montoBono?.toString() || "0");
      
      // Verificamos si es una carga de promoción/regalo
      const esEspecial = t.coelsaCode && t.coelsaCode.startsWith("ESPECIAL-");

      if (esEspecial) {
        totalEspeciales += montoBase; // Suma a la caja de regalos
        totalEntrado += montoBase;    // También suma al total de Zeus
      } else {
        totalSinBono += montoBase;    // Plata Real
        totalBonos += montoBono;      // Bonos
        totalEntrado += (montoBase + montoBono); // Suma al total de Zeus
      }
    });

    return NextResponse.json({
      resumen: {
        totalEntrado,
        totalSinBono,
        totalBonos,
        totalEspeciales,
        cantidad: transferencias.length
      },
      movimientos: transferencias
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}