import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transferencia from "@/models/Transferencia";
import User from "@/models/User";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get('estado') || 'PENDIENTE';

  try {
    let query: any = { estado };

    if (estado === 'PENDIENTE') {
      query = { $or: [{ estado: 'PENDIENTE' }, { estado: 'EN_PROCESO' }] };
    }

    const trans = await Transferencia.find(query)
      .populate('cajeroAsignado', 'nombre') 
      .sort({ fechaIngreso: -1 });

    return NextResponse.json(trans);
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}