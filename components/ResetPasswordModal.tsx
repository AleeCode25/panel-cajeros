'use client';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    // 📢 Alert de Cargando
    Swal.fire({
      title: 'Cambiando clave...',
      text: 'Se establecerá 12345678 como nueva contraseña',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch('/api/casino/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.close();
        setSuccess(true);
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo resetear', text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Revisá tu conexión a internet' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const texto = `Te dejo tu usuario y contraseña :\n\nUsuario : ${username}\nContraseña : 12345678\n\nLink de la plataforma: https://casino-zeus.eu \n\nCARGA MINIMA: $2.000\nRETIRO MINIMO: $5.000\nCARGAS & RETIROS 24HS SIN LIMITES`;
    navigator.clipboard.writeText(texto);
    // ✅ Alert de Copiado
    Swal.fire({
      icon: 'success',
      title: '¡Copiado!',
      text: 'Listo para enviar por mensaje',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
        {!success ? (
          <>
            <h2 className="text-xl font-black mb-1 text-white uppercase italic text-center">Restablecer Clave</h2>
            <p className="text-center text-gray-500 text-[10px] uppercase mb-6 tracking-widest">La clave será: 12345678</p>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre de usuario..." value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-500" />
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 bg-gray-800 py-4 rounded-2xl font-black text-xs uppercase text-gray-400">Cerrar</button>
                <button onClick={handleReset} disabled={!username || loading} className="flex-[2] bg-orange-600 hover:bg-orange-700 py-4 rounded-2xl font-black text-xs uppercase transition-all">
                  {loading ? "..." : "RESTABLECER CLAVE"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="text-xl font-black mb-6 text-white uppercase">¡CLAVE CAMBIADA!</h2>
            <button onClick={handleCopy} className="w-full bg-green-600 hover:bg-green-700 py-5 rounded-2xl font-black text-xs uppercase mb-3 shadow-lg shadow-green-900/30">
              COPIAR PARA WHATSAPP
            </button>
            <button onClick={onClose} className="text-gray-500 font-bold text-[10px] uppercase py-2">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}