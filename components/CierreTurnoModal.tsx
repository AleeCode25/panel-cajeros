'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function CierreTurnoModal({ onClose }: { onClose: () => void }) {
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCierre = async () => {
      try {
        const res = await fetch('/api/cajero/cierre');
        const data = await res.json();
        if (res.ok) setDatos(data);
        else Swal.fire('Error', 'No se pudieron obtener los datos', 'error');
      } catch (e) {
        Swal.fire('Error', 'Falla de conexión', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCierre();
  }, []);

  const handleCopy = () => {
    const texto = `*CIERRE DE TURNO*\nCajero: ${datos.cajero}\nFecha: ${new Date().toLocaleDateString('es-AR')}\n\n💰 *Plata Real Cargada:* $${datos.totalReal.toLocaleString('es-AR')}\n🎁 *Regalos/Extras:* $${datos.totalRegalos.toLocaleString('es-AR')}\n📊 *Total Fichas Zeus:* $${(datos.totalReal + datos.totalRegalos).toLocaleString('es-AR')}\n\n✅ *Operaciones realizadas:* ${datos.cantidad}`;
    
    navigator.clipboard.writeText(texto);
    Swal.fire({ icon: 'success', title: 'Ticket copiado', text: 'Listo para pegar en WhatsApp', timer: 1500, showConfirmButton: false });
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-black mb-1 text-white uppercase italic text-center">Cierre de Caja</h2>
        <p className="text-center text-gray-500 text-[10px] uppercase mb-6 tracking-widest">Resumen del turno de hoy</p>
        
        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500 uppercase">Calculando...</div>
        ) : datos ? (
          <div className="animate-in zoom-in-95">
            <div className="bg-gray-950 p-6 rounded-2xl mb-6 border border-gray-800 font-mono text-sm shadow-inner space-y-3">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Plata Real:</span>
                <span className="text-green-400 font-bold">${datos.totalReal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Regalos/Extras:</span>
                <span className="text-pink-400 font-bold">${datos.totalRegalos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-400 font-bold">TOTAL ZEUS:</span>
                <span className="text-white font-black text-lg">${(datos.totalReal + datos.totalRegalos).toLocaleString()}</span>
              </div>
              <div className="text-center pt-4 text-[10px] text-gray-600">
                Operaciones del día: {datos.cantidad}
              </div>
            </div>

            <button onClick={handleCopy} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-xs uppercase mb-3 shadow-lg shadow-blue-900/30 transition-all">
              Copiar Resumen para WhatsApp
            </button>
            <button onClick={onClose} className="w-full text-gray-500 font-bold text-[10px] uppercase py-2 hover:text-white">Cerrar Modal</button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full bg-gray-800 py-4 rounded-2xl font-black text-xs uppercase">Cerrar</button>
        )}
      </div>
    </div>
  );
}