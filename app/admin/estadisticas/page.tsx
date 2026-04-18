'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminEstadisticas() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cajeroId, setCajeroId] = useState('todos');
  const [cajeros, setCajeros] = useState([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Proteger la ruta
  useEffect(() => {
    if (status === "unauthenticated" || (session && (session.user as any).role !== "ADMIN")) {
      router.push('/');
    }
  }, [status, session]);

  // 2. Cargar lista de cajeros para el filtro
  useEffect(() => {
    fetch('/api/admin/users').then(res => res.json()).then(setCajeros);
    
    // Setear fechas por defecto (Hoy desde las 00:00 hasta ahora)
    const hoy = new Date();
    const inicio = new Date(hoy.setHours(0,0,0,0)).toISOString().slice(0, 16);
    const fin = new Date().toISOString().slice(0, 16);
    setFrom(inicio);
    setTo(fin);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/estadisticas?from=${from}&to=${to}&cajeroId=${cajeroId}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  };

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-500 text-xs font-black uppercase mb-2 block">← Volver al Panel</Link>
            <h1 className="text-3xl font-black italic uppercase">Control de Caja</h1>
          </div>
          <button 
            onClick={fetchStats}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
          >
            {loading ? "Calculando..." : "Actualizar Datos"}
          </button>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900 p-6 rounded-[32px] border border-gray-800 mb-8 shadow-2xl">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Desde (Fecha y Hora)</label>
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"/>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Hasta (Fecha y Hora)</label>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"/>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Filtrar por Cajero</label>
            <select value={cajeroId} onChange={e => setCajeroId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold">
              <option value="todos">Todos los cajeros</option>
              {cajeros.map((c: any) => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {data && (
          <>
            {/* CARDS DE RESUMEN: Ahora son 4 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              <div className="bg-gray-900 p-8 rounded-[32px] border border-gray-800 shadow-xl">
                <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-2">Plata Real (Sin Bono)</p>
                <h3 className="text-4xl font-black text-white font-mono">${data.resumen.totalSinBono.toLocaleString()}</h3>
              </div>
              
              <div className="bg-gray-900 p-8 rounded-[32px] border border-gray-800 shadow-xl border-l-4 border-l-blue-500">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">Total en Bonos</p>
                <h3 className="text-4xl font-black text-white font-mono">${data.resumen.totalBonos.toLocaleString()}</h3>
              </div>

              <div className="bg-gray-900 p-8 rounded-[32px] border border-gray-800 shadow-xl border-l-4 border-l-pink-500">
                <p className="text-pink-500 text-[10px] font-black uppercase tracking-widest mb-2">Extras / Regalos</p>
                <h3 className="text-4xl font-black text-white font-mono">${data.resumen.totalEspeciales.toLocaleString()}</h3>
              </div>

              <div className="bg-blue-600 p-8 rounded-[32px] shadow-2xl shadow-blue-900/20">
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-2">Total Entrado Zeus</p>
                <h3 className="text-4xl font-black text-white font-mono">${data.resumen.totalEntrado.toLocaleString()}</h3>
              </div>
              
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div className="bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-5">Fecha Carga</th>
                    <th className="p-5">Cajero</th>
                    <th className="p-5">Detalle</th>
                    <th className="p-5">Monto Base</th>
                    <th className="p-5">Bono</th>
                    <th className="p-5">Total Acreditado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.movimientos.map((m: any) => {
                    const esEspecial = m.coelsaCode?.startsWith("ESPECIAL-");
                    
                    return (
                      <tr key={m._id} className="hover:bg-gray-800/20 transition-all">
                        <td className="p-5 text-[10px] font-mono text-gray-400">{new Date(m.fechaCarga).toLocaleString()}</td>
                        <td className="p-5 font-bold text-xs">{m.cajeroAsignado?.nombre || 'S/D'}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold uppercase">{m.remitente}</p>
                            {esEspecial && (
                              <span className="bg-pink-500/20 text-pink-400 text-[8px] px-2 py-1 rounded-md font-black uppercase">Regalo</span>
                            )}
                          </div>
                          <p className="text-[10px] text-blue-400 font-mono">ID Zeus: {m.usuarioCasino}</p>
                        </td>
                        <td className={`p-5 font-mono font-bold ${esEspecial ? 'text-pink-400' : 'text-green-400'}`}>
                          ${m.monto.toLocaleString()}
                        </td>
                        <td className="p-5 font-mono text-blue-400 font-bold">${(m.montoBono || 0).toLocaleString()}</td>
                        <td className="p-5 font-mono text-white font-black text-lg">${(m.monto + (m.montoBono || 0)).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {data.movimientos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-gray-500 font-bold italic">No se encontraron movimientos en este rango de tiempo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}