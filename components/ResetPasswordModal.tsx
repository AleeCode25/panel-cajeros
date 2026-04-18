'use client';
import { useState } from 'react';

export default function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/casino/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.error || "Error al restablecer");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const texto = `Te dejo tu usuario y contraseña :\n\nUsuario : ${username}\nContraseña : 12345678\n\nLink de la plataforma: https://casino-zeus.eu \n\nCARGA MINIMA: $2.000\nRETIRO MINIMO: $5.000\nCARGAS & RETIROS 24HS SIN LIMITES`;
    navigator.clipboard.writeText(texto);
    alert("¡Copiado para enviar por WhatsApp!");
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
        {!success ? (
          <>
            <h2 className="text-xl font-black mb-1 text-white uppercase italic">Restablecer Clave</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-6 tracking-widest">La clave será: 12345678</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Usuario a restablecer..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 bg-gray-800 py-4 rounded-2xl font-black text-xs uppercase text-gray-400">Cancelar</button>
                <button 
                  onClick={handleReset}
                  disabled={!username || loading}
                  className="flex-[2] bg-orange-600 hover:bg-orange-700 py-4 rounded-2xl font-black text-xs uppercase disabled:opacity-20"
                >
                  {loading ? "PROCESANDO..." : "RESTABLECER"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="text-xl font-black mb-6 text-white uppercase">¡CLAVE CAMBIADA!</h2>
            
            <div className="bg-gray-800 p-4 rounded-2xl text-left mb-6 border border-gray-700 text-xs font-mono">
                <p className="text-gray-400">Usuario : <span className="text-white font-bold">{username}</span></p>
                <p className="text-gray-400">Contraseña : <span className="text-white font-bold">12345678</span></p>
                <p className="text-gray-500 text-xs mt-2">Link de la plataforma: https://casino-zeus.eu</p>
                <p className="text-gray-500 text-xs mt-2">CARGA MINIMA: $2.000</p>
                <p className="text-gray-500 text-xs mt-2">RETIRO MINIMO: $5.000</p>
                <p className="text-gray-500 text-xs mt-2">CARGAS & RETIROS 24HS SIN LIMITES</p>
            </div>

            <button 
              onClick={handleCopy}
              className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-black text-xs uppercase mb-3"
            >
              COPIAR PARA WHATSAPP
            </button>
            <button onClick={onClose} className="text-gray-500 font-bold text-[10px] uppercase">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}