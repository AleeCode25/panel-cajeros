// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // Acá definimos cómo se llaman los campos que vienen del formulario
        usuario: { label: "Usuario", type: "text" }, 
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Si el form manda "usuario", NextAuth lo pone en credentials.usuario
          const nombreDeUsuario = credentials?.usuario; 
          
          console.log("🔑 Intentando login para:", nombreDeUsuario);
          await dbConnect();

          // Buscamos específicamente por el campo 'usuario' de tu DB
          const user = await User.findOne({ usuario: nombreDeUsuario });

          if (!user) {
            console.log("❌ Usuario no encontrado en la base de datos:", nombreDeUsuario);
            return null;
          }

          const isValid = await bcrypt.compare(credentials!.password, user.password);

          if (!isValid) {
            console.log("❌ Contraseña incorrecta para:", nombreDeUsuario);
            return null;
          }

          return { 
            id: user._id.toString(), 
            name: user.nombre, 
            role: user.role, 
            canPay: user.canPay || false
          };
        } catch (error) {
          console.error("🔥 Error en authorize:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.canPay = user.canPay;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.canPay = token.canPay;
        session.user.name = token.name;
      }
      return session;
    }
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
};