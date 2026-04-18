// components/CrearUsuarioModal.tsx
'use client';
import { useState } from 'react';

export default function CrearUsuarioModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCrear = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/casino/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setCreated(true);
      } else {
        alert(data.error || "Error al crear usuario");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const texto = `Te dejo tu nuevo usuario :\n\nUsuario: ${username}\nContraseña: ${password}\n\nLink de la plataforma: https://casino-zeus.eu\n\nCARGA MINIMA: $2.000\nRETIRO MINIMO: $5.000\nCARGAS & RETIROS 24HS SIN LIMITES`;
    navigator.clipboard.writeText(texto);
    alert("¡Copiado al portapapeles!");
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl">
        {!created ? (
          <>
            <h2 className="text-2xl font-black mb-6 text-white uppercase italic">Nuevo Jugador Zeus</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold"
                  placeholder="Ej: pepito2025"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Contraseña</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold"
                  placeholder="Ej: 123456"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-gray-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button 
                  onClick={handleCrear}
                  disabled={!username || !password || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-20 transition-all"
                >
                  {loading ? "CREANDO..." : "CREAR AHORA"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
            <h2 className="text-2xl font-black mb-2 text-white">¡USUARIO LISTO!</h2>
            <p className="text-gray-400 text-sm mb-6">El jugador ya fue dado de alta en Zeus.</p>
            
            <div className="bg-gray-800 p-6 rounded-2xl text-left mb-6 border border-gray-700">
              <p className="text-blue-400 font-mono text-sm mb-1">Te dejo tu nuevo usuario :</p>
              <p className="text-white font-mono font-bold">Usuario: {username}</p>
              <p className="text-white font-mono font-bold">Contraseña: {password}</p>
              <p className="text-gray-500 text-xs mt-2">Link de la plataforma: https://casino-zeus.eu</p>
              <p className="text-gray-500 text-xs mt-2">CARGA MINIMA: $2.000</p>
              <p className="text-gray-500 text-xs mt-2">RETIRO MINIMO: $5.000</p>
              <p className="text-gray-500 text-xs mt-2">CARGAS & RETIROS 24HS SIN LIMITES</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCopy}
                className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20"
              >
                Copiar Datos para WhatsApp
              </button>
              <button onClick={onClose} className="w-full text-gray-500 font-bold text-xs uppercase py-2">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}