'use client';
import { useState } from 'react';

interface Props {
  tipo: string; 
  onClose: () => void;
  onSuccess: () => void;
}

export default function CargaEspecialModal({ tipo, onClose, onSuccess }: Props) {
  const [usuarioCasino, setUsuarioCasino] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transferencias/especial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioCasino, tipo }),
      });
      const data = await res.json();
      if (res.ok) onSuccess();
      else alert(data.error || "Error al procesar");
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const getConfig = () => {
    switch(tipo) {
      case 'CANAL': return { color: 'text-teal-400', bg: 'bg-teal-500/20', btn: 'bg-teal-600', icon: '📢' };
      case 'INSTAGRAM': return { color: 'text-pink-400', bg: 'bg-pink-500/20', btn: 'bg-pink-600', icon: '📸' };
      default: return { color: 'text-orange-400', bg: 'bg-orange-500/20', btn: 'bg-orange-600', icon: '📅' };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl ${config.bg} ${config.color}`}>
          {config.icon}
        </div>

        <h2 className="text-2xl font-black mb-1 text-white uppercase italic">Carga de {tipo}</h2>
        <p className="text-gray-500 text-xs mb-6 font-bold uppercase tracking-widest">
          Se acreditarán <span className="text-white">500 fichas</span> fijas {/* <-- ACTUALIZADO A 500 */}
        </p>

        <div className="space-y-4">
          <input 
            type="text" 
            value={usuarioCasino}
            onChange={e => setUsuarioCasino(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-5 rounded-3xl text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Usuario del Jugador"
            autoFocus
          />

          <button 
            onClick={handleConfirmar}
            disabled={!usuarioCasino || loading}
            className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${config.btn} hover:opacity-80 disabled:opacity-20`}
          >
            {loading ? "VERIFICANDO..." : "CONFIRMAR REGALO"}
          </button>
          
          <button onClick={onClose} className="w-full py-2 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}