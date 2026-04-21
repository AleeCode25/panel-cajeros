import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/models/Config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Función para CARGAR los datos cuando abris la pantalla
export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const zeus = await Config.findOne({ key: "ZEUS_TOKEN" });
    const wallet = await Config.findOne({ key: "WALLET_TOKEN" });
    const account = await Config.findOne({ key: "WALLET_ACCOUNT_ID" });

    return NextResponse.json({
      zeusToken: zeus?.value || "",
      walletToken: wallet?.value || "",
      walletAccountId: account?.value || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Función para GUARDAR los datos
export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { zeusToken, walletToken, walletAccountId } = await req.json();

    if (zeusToken !== undefined) await Config.findOneAndUpdate({ key: "ZEUS_TOKEN" }, { value: zeusToken }, { upsert: true });
    if (walletToken !== undefined) await Config.findOneAndUpdate({ key: "WALLET_TOKEN" }, { value: walletToken }, { upsert: true });
    if (walletAccountId !== undefined) await Config.findOneAndUpdate({ key: "WALLET_ACCOUNT_ID" }, { value: walletAccountId }, { upsert: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}