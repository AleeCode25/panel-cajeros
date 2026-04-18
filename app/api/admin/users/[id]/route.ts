import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    // 🔥 EL FIX: Hay que esperar a los params
    const { id } = await params; 
    
    const { nombre, usuario, password, canPay } = await req.json();

    const updateData: any = { nombre, usuario, canPay };
    
    // Solo hashear y actualizar si el admin escribió una clave nueva
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!usuarioActualizado) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en PATCH user:", error.message);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params; // 🔥 FIX también acá
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}