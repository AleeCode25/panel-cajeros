'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function ConfigPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config').then(res => res.json()).then(data => setToken(data.token));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (res.ok) {
      Swal.fire({ icon: 'success', title: 'Token Actualizado', text: 'El panel ya usa el nuevo token de Zeus.' });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[40px] border border-gray-800 shadow-2xl">
        <Link href="/" className="text-blue-500 text-xs font-black uppercase mb-4 block">← Volver</Link>
        <h1 className="text-3xl font-black italic uppercase mb-8">Ajustes de API</h1>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Zeus Bearer Token</label>
            <textarea 
              value={token} 
              onChange={e => setToken(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 p-5 rounded-3xl text-xs font-mono text-blue-400 outline-none focus:ring-2 focus:ring-blue-500 h-48"
              placeholder="Pegá el token de Postman acá..."
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-3xl font-black uppercase tracking-widest transition-all"
          >
            {loading ? "GUARDANDO..." : "ACTUALIZAR CONEXIÓN"}
          </button>
        </div>
      </div>
    </main>
  );
}