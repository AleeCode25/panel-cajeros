'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function ConfiguracionAPI() {
  const [zeusToken, setZeusToken] = useState('');
  const [walletToken, setWalletToken] = useState('');
  const [walletAccountId, setWalletAccountId] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar los datos al abrir
  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setZeusToken(data.zeusToken || '');
          setWalletToken(data.walletToken || '');
          setWalletAccountId(data.walletAccountId || '');
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
    
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zeusToken, walletToken, walletAccountId })
    });

    if (res.ok) {
      Swal.fire('¡Guardado!', 'Las credenciales se actualizaron.', 'success');
    } else {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando configuración...</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-[32px] shadow-2xl">
          <Link href="/" className="text-blue-500 text-xs font-black uppercase mb-4 block border border-blue-500/30 px-3 py-1 w-max rounded-md hover:bg-blue-600 hover:text-white transition-all">← Volver</Link>
          <h1 className="text-2xl font-black italic uppercase mb-8">Ajustes de API</h1>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Zeus Bearer Token</label>
              <textarea 
                value={zeusToken} onChange={e => setZeusToken(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-xs font-mono text-gray-300 outline-none h-24"
                placeholder="Pegá el token de Zeus acá..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Billetera (HG Cash) - Token</label>
              <textarea 
                value={walletToken} onChange={e => setWalletToken(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-xs font-mono text-gray-300 outline-none h-24"
                placeholder="Pegá el token de la billetera acá..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Billetera - Account ID</label>
              <input 
                type="text"
                value={walletAccountId} onChange={e => setWalletAccountId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-xs font-mono text-gray-300 outline-none"
                placeholder="Ej: 05065c0a-6657-4d36..."
              />
            </div>

            <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-sm uppercase mt-4 transition-all shadow-lg shadow-blue-900/20">
              Actualizar Conexión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}