import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Solo los administradores pueden limpiar cargas atoradas
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    
    // Cambiamos el estado a CANCELADA para que desaparezca de pendientes y no sume en caja
    await Transferencia.findByIdAndUpdate(id, { estado: 'CANCELADA' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}