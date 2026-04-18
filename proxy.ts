// middleware.ts
export { default } from "next-auth/middleware";

export const config = { 
  // Protegemos todas las rutas excepto el login y la api de setup (por ahora)
  matcher: ["/((?!api/setup-admin|login).*)"] 
};