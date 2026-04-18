import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/models/Config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Obtener el token
export async function GET() {
  await dbConnect();
  const config = await Config.findOne({ key: "ZEUS_TOKEN" });
  return NextResponse.json({ token: config?.value || "" });
}

// Actualizar el token
export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { token } = await req.json();
    await Config.findOneAndUpdate(
      { key: "ZEUS_TOKEN" },
      { value: token, updatedAt: new Date() },
      { upsert: true } // Si no existe, lo crea
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}