import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 1. OBTENER LISTA DE USUARIOS (GET)
export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Seguridad: Solo el ADMIN puede ver la lista
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// 2. CREAR NUEVO USUARIO (POST)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Seguridad: Solo el ADMIN puede crear
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, usuario, password, canPay } = body;

    // Validaciones básicas
    if (!nombre || !usuario || !password) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existe = await User.findOne({ usuario });
    if (existe) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario con el nuevo campo canPay
    const nuevoUsuario = await User.create({
      nombre,
      usuario,
      password: hashedPassword,
      role: "CAJERO",
      canPay: canPay || false // Si no viene, por defecto es false
    });

    console.log("✅ Usuario creado:", nuevoUsuario.usuario);
    return NextResponse.json({ success: true, user: { id: nuevoUsuario._id, usuario: nuevoUsuario.usuario } });

  } catch (error: any) {
    console.error("❌ ERROR AL CREAR USUARIO:", error.message);
    return NextResponse.json({ error: "Error interno al crear usuario" }, { status: 500 });
  }
}