import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { usuarioCasino, conBono, montoBono } = body;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const transfer = await Transferencia.findById(id);
    if (!transfer || transfer.estado !== "EN_PROCESO") {
      return NextResponse.json({ error: "Transferencia no disponible" }, { status: 400 });
    }

    // El montoBono ya viene calculado en pesos desde el Modal
    const montoTotalZeus = parseFloat(transfer.monto.toString()) + (conBono ? parseFloat(montoBono) : 0);

    // LLAMADA A ZEUS
    const zeusUrl = "https://admin.casino-zeus.eu/api/operator/v1/account-transfers";
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIwMTljYjc3OC1jYjY2LTcxNmMtYTM4OC1jY2NmYjBjMzliZWYiLCJzdWIiOjUzMzM2OTYsInVzZXJuYW1lIjoiUE9SLVRPRE8yNiIsImlhdCI6MTc3MjYwNDY3MiwiZXhwIjoxODA0MTQwNjcyfQ.vsdKI9mdaUhnwSEd8hNOfTogqnAZk_UdXZgysUHEfzI";

    const zeusRes = await fetch(zeusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0'
      },
      body: JSON.stringify({
        amount: montoTotalZeus,
        operation: "INCOME",
        targetUserName: usuarioCasino
      })
    });

    if (zeusRes.ok) {
      transfer.estado = "CARGADA";
      transfer.usuarioCasino = usuarioCasino;
      transfer.conBono = conBono;
      transfer.montoBono = conBono ? parseFloat(montoBono) : 0;
      transfer.fechaCarga = new Date();
      await transfer.save();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Error en Zeus" }, { status: 400 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}