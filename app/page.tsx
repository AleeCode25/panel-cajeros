'use client';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import CargarModal from '@/components/CargarModal';
import CrearUsuarioModal from '@/components/CrearUsuarioModal';
import CargaEspecialModal from '@/components/CargaEspecialModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import VerSaldoModal from '@/components/VerSaldoModal'; 
import RetirarModal from '@/components/RetirarModal'; 
import CierreTurnoModal from '@/components/CierreTurnoModal';
import HistorialUsuarioModal from '@/components/HistorialUsuarioModal'; 
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
  const prevPendientes = useRef(0)
  const [pendientes, setPendientes] = useState([]);
  const [realizadas, setRealizadas] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showCrearUsuario, setShowCrearUsuario] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showExtraMenu, setShowExtraMenu] = useState(false);

  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [showRetirarModal, setShowRetirarModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false); 

  const [especialType, setEspecialType] = useState<string | null>(null);
  const [tab, setTab] = useState('pendientes');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = async () => {
    try {
      const resP = await fetch('/api/transferencias?estado=PENDIENTE');
      const dataP = await resP.json();

      if (dataP.length > prevPendientes.current) {
        const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/woodpecker.ogg');
        audio.play().catch(e => console.log('El navegador bloqueó el autoplay del sonido'));
      }
      prevPendientes.current = dataP.length; 

      setPendientes(dataP);

      const resR = await fetch('/api/transferencias?estado=CARGADA');
      const dataR = await resR.json();
      const sortedR = dataR.sort((a: any, b: any) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());
      setRealizadas(sortedR);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredPendientes = pendientes.filter((t: any) =>
    t.remitente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cuit?.includes(searchTerm) ||
    t.coelsaCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRealizadas = realizadas.filter((t: any) =>
    t.remitente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.usuarioCasino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.coelsaCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRealizadas.length / ITEMS_PER_PAGE);
  const paginatedRealizadas = filteredRealizadas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleClaim = async (transfer: any) => {
    const myId = (session?.user as any)?.id;
    const assignedId = transfer.cajeroAsignado?._id || transfer.cajeroAsignado;

    if (transfer.estado === 'EN_PROCESO' && assignedId?.toString() === myId?.toString()) {
      setSelectedTransfer(transfer);
      return;
    }

    const res = await fetch(`/api/transferencias/${transfer._id}/reclamar`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTransfer(updated);
      fetchData();
    }
  };

  const handleForceRelease = async (id: string) => {
    if (!confirm("¿Liberar esta carga para que otro cajero pueda tomarla?")) return;
    const res = await fetch(`/api/transferencias/${id}/liberar`, { method: 'POST' });
    if (res.ok) fetchData();
  };

  const handleCancelModal = async () => {
    if (selectedTransfer) {
      await fetch(`/api/transferencias/${(selectedTransfer as any)._id}/liberar`, { method: 'POST' });
    }
    setSelectedTransfer(null);
    fetchData();
  };

  const handleAdminCancel = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Descartar carga?',
      text: "Desaparecerá de la lista y no sumará a la caja.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/transferencias/${id}/cancelar`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'Limpiado', timer: 1500, showConfirmButton: false });
          fetchData();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: data.error });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error de Conexión' });
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans tracking-tight">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-500 italic uppercase">Panel Club Prime</h1>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Cajero: <span className="text-white">{session?.user?.name || "Cargando..."}</span></p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center relative">
          <button onClick={() => setShowCrearUsuario(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">+ Usuario</button>
          <button onClick={() => setShowSaldoModal(true)} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-emerald-600 hover:text-white flex items-center gap-1">💰 Saldo</button>
          <button onClick={() => setShowRetirarModal(true)} className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-red-600 hover:text-white flex items-center gap-1">💸 Retirar</button>
          <button onClick={() => setShowHistorialModal(true)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-blue-600 hover:text-white flex items-center gap-1">🕵️‍♂️ Historial</button>

          <div className="relative">
            <button onClick={() => setShowExtraMenu(!showExtraMenu)} className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all flex items-center gap-2">
              Extras {showExtraMenu ? '▲' : '▼'}
            </button>
            {showExtraMenu && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { setEspecialType('AGENDAMIENTO'); setShowExtraMenu(false); }} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase text-orange-500 hover:bg-orange-500/10 border-b border-gray-800 transition-all">📅 Agendamiento</button>
                <button onClick={() => { setEspecialType('CANAL'); setShowExtraMenu(false); }} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase text-teal-400 hover:bg-teal-400/10 border-b border-gray-800 transition-all">📢 Canal</button>
                <button onClick={() => { setEspecialType('INSTAGRAM'); setShowExtraMenu(false); }} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase text-pink-500 hover:bg-pink-500/10 transition-all">📸 Instagram</button>
              </div>
            )}
          </div>

          <button onClick={() => setShowResetPass(true)} className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-gray-700 hover:text-white">Clave</button>

          {session?.user?.role === 'ADMIN' && (
            <>
              <Link href="/admin/estadisticas" className="bg-purple-600/20 text-purple-400 px-3 py-2 rounded-xl text-[10px] border border-purple-500/30 font-black uppercase hover:bg-purple-600 hover:text-white transition-all">Caja</Link>
              <Link href="/admin/users" className="bg-gray-800 px-3 py-2 rounded-xl text-[10px] border border-gray-700 font-black uppercase hover:bg-gray-700 hover:text-white transition-all">Usuarios</Link>
              <Link href="/admin/configuracion" className="bg-orange-600/20 text-orange-400 px-3 py-2 rounded-xl text-[10px] border border-orange-500/30 font-black uppercase hover:bg-orange-600 hover:text-white transition-all">⚙️ API</Link>
            </>
          )}

          <button onClick={() => setShowCierreModal(true)} className="bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-yellow-600 hover:text-white">🔒 Turno</button>
          <button onClick={() => signOut()} className="bg-gray-800 text-gray-500 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:text-white transition-all">Salir</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <input
          type="text"
          placeholder="🔍 Buscar..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full bg-gray-900 border border-gray-800 p-5 rounded-[24px] outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold mb-8 transition-all shadow-inner"
        />

        <div className="flex gap-8 mb-8 border-b border-gray-800 font-black text-[10px] uppercase tracking-widest">
          <button onClick={() => { setTab('pendientes'); setCurrentPage(1); }} className={`pb-4 px-2 transition-all ${tab === 'pendientes' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Pendientes ({filteredPendientes.length})</button>
          <button onClick={() => { setTab('realizadas'); setCurrentPage(1); }} className={`pb-4 px-2 transition-all ${tab === 'realizadas' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}>Realizadas ({filteredRealizadas.length})</button>
        </div>

        {tab === 'pendientes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPendientes.map((t: any) => {
              const myId = (session?.user as any)?.id;
              const assignedId = t.cajeroAsignado?._id || t.cajeroAsignado;
              const isMine = myId && assignedId && myId.toString() === assignedId.toString();
              const isTakenByOther = t.estado === 'EN_PROCESO' && !isMine;

              return (
                <div key={t._id} className={`bg-gray-900 border p-7 rounded-[32px] transition-all shadow-xl ${isMine ? 'border-yellow-500 bg-yellow-500/5 shadow-yellow-900/10' : isTakenByOther ? 'border-purple-500/20 opacity-40' : 'border-gray-800 hover:border-blue-500/40'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl font-mono font-black text-green-400">${(t.monto || 0).toLocaleString()}</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm font-black truncate text-white uppercase mb-1">{t.remitente}</p>
                    <p className="text-[10px] text-gray-500 font-mono italic">CUIT: {t.cuit}</p>
                    <p className="text-[10px] text-blue-500 font-mono font-bold mt-2 border-t border-gray-800 pt-2 uppercase">ID COELSA: {t.coelsaCode}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleClaim(t)} disabled={isTakenByOther} className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all tracking-widest ${isTakenByOther ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : isMine ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {isTakenByOther ? 'PROCESANDO...' : isMine ? 'FINALIZAR CARGA' : 'TOMAR CARGA'}
                    </button>
                    {(session?.user as any)?.role === 'ADMIN' && (
                      <button onClick={() => handleAdminCancel(t._id)} className="text-[9px] text-gray-500 font-black uppercase text-center py-2 hover:text-red-500 transition-all">[ ❌ DESCARTAR ]</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/50 text-gray-400 text-[10px] uppercase font-black">
                <tr><th className="p-5">Fecha</th><th className="p-5">Tipo</th><th className="p-5">Total</th><th className="p-5">Usuario</th><th className="p-5">Cajero</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedRealizadas.map((t: any) => (
                  <tr key={t._id} className="hover:bg-gray-800/30">
                    <td className="p-5 font-mono text-gray-500">{new Date(t.fechaCarga).toLocaleString()}</td>
                    <td className="p-5 uppercase font-bold text-xs">{t.remitente}</td>
                    <td className="p-5 font-black text-green-400">${((t.monto || 0) + (t.montoBono || 0)).toLocaleString()}</td>
                    <td className="p-5 text-blue-400 font-black italic">{t.usuarioCasino}</td>
                    <td className="p-5 text-gray-400 uppercase font-bold text-[10px]">{t.cajeroAsignado?.nombre || 'S/D'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransfer && <CargarModal transfer={selectedTransfer} onClose={handleCancelModal} onSuccess={() => { setSelectedTransfer(null); fetchData(); }} />}
      {showCrearUsuario && <CrearUsuarioModal onClose={() => setShowCrearUsuario(false)} />}
      {showResetPass && <ResetPasswordModal onClose={() => setShowResetPass(false)} />}
      {especialType && <CargaEspecialModal tipo={especialType} onClose={() => setEspecialType(null)} onSuccess={() => { setEspecialType(null); fetchData(); }} />}
      {showSaldoModal && <VerSaldoModal onClose={() => setShowSaldoModal(false)} />}
      {showRetirarModal && <RetirarModal onClose={() => setShowRetirarModal(false)} />}
      {showCierreModal && <CierreTurnoModal onClose={() => setShowCierreModal(false)} />}
      {showHistorialModal && <HistorialUsuarioModal onClose={() => setShowHistorialModal(false)} />}
    </main>
  );
}