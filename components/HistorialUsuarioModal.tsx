'use client';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function HistorialUsuarioModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cajero/historial?username=${username}`);
      const data = await res.json();
      if (res.ok) {
        setMovimientos(data);
        setBuscado(true);
      } else {
        Swal.fire('Error', 'No se pudo obtener el historial', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white uppercase italic">Auditoría de Jugador</h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">Historial interno de cargas y retiros</p>
        </div>

        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Usuario del casino..." 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
          />
          <button 
            onClick={handleBuscar}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 rounded-2xl font-black text-xs uppercase transition-all"
          >
            {loading ? '...' : 'BUSCAR'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {buscado && movimientos.length > 0 ? (
            <div className="space-y-3">
              {movimientos.map((m) => {
                const esEspecial = ['CANAL', 'INSTAGRAM', 'AGENDAMIENTO'].includes(m.remitente) || m.coelsaCode?.startsWith("ESPECIAL-");
                const esRetiro = m.monto < 0 || m.tipo === 'RETIRO'; // Por si en el futuro los marcas distinto

                return (
                  <div key={m._id} className="bg-gray-800/40 border border-gray-800 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${esEspecial ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {m.remitente}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{new Date(m.fechaCarga).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">Cajero: <span className="text-white font-bold">{m.cajeroAsignado?.nombre || 'S/D'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black font-mono ${esEspecial ? 'text-pink-400' : 'text-green-400'}`}>
                        ${m.monto.toLocaleString()}
                      </p>
                      {m.montoBono > 0 && <p className="text-[10px] text-blue-400 font-bold">+${m.montoBono.toLocaleString()} Bono</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : buscado ? (
            <div className="text-center py-10 text-gray-600 font-bold italic">No hay registros para este usuario en el panel.</div>
          ) : (
            <div className="text-center py-10 text-gray-700 text-xs uppercase tracking-widest font-bold">Ingresá un usuario para ver su actividad</div>
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full py-4 text-gray-500 font-bold text-xs uppercase hover:text-white transition-all">
          Cerrar Historial
        </button>
      </div>
    </div>
  );
}