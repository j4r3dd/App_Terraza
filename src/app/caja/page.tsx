// src/app/caja/page.tsx
"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"
// Importamos el componente para generar el link de descarga del PDF
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReceiptPDF from "@/components/ReceiptPDF";

// Interfaces (sin cambios)
export interface Orden {
  id: number
  mesa: string
  productos: { nombre: string; precio: number }[]
  estado: string
  total: number
  metodo_pago?: 'efectivo' | 'tarjeta'
  pagado_at?: string
  created_at: string
}

export interface VentasDelDia {
  fecha: string
  total_efectivo: number
  total_tarjeta: number
  total_general: number
  ordenes_pagadas: number
}

// Componente ModalPago (sin cambios)
interface ModalPagoProps {
  orden: Orden
  onClose: () => void
  onConfirm: (metodoPago: 'efectivo' | 'tarjeta') => void
}

function ModalPago({ orden, onClose, onConfirm }: ModalPagoProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'tarjeta'>('efectivo')
  // ... (el resto del componente modal es idéntico)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Registrar Pago</h3>
        <div className="mb-4">
          <p className="text-gray-600">Mesa: <span className="font-semibold">{orden.mesa}</span></p>
          <p className="text-gray-600">Orden: <span className="font-semibold">#{orden.id}</span></p>
          <p className="text-2xl font-bold text-green-600 mt-2">Total: ${orden.total?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="mb-6">
          <p className="font-medium mb-3">Método de pago:</p>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" value="efectivo" checked={metodoSeleccionado === 'efectivo'} onChange={(e) => setMetodoSeleccionado(e.target.value as 'efectivo')} className="mr-3" />
              <div className="flex items-center"><span className="text-2xl mr-2">💵</span><span className="font-medium">Efectivo</span></div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" value="tarjeta" checked={metodoSeleccionado === 'tarjeta'} onChange={(e) => setMetodoSeleccionado(e.target.value as 'tarjeta')} className="mr-3" />
              <div className="flex items-center"><span className="text-2xl mr-2">💳</span><span className="font-medium">Tarjeta</span></div>
            </label>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(metodoSeleccionado)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">Confirmar Pago</button>
        </div>
      </div>
    </div>
  )
}


export default function CajaPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [ventasDelDia, setVentasDelDia] = useState<VentasDelDia | null>(null)
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'pagadas'>('pendientes')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null)
  const [loading, setLoading] = useState(false)
  // Estado para asegurar que el link de PDF solo se renderice en el cliente
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const obtenerOrdenes = async () => {
    const { data } = await supabase.from("ordenes").select("*").order("created_at", { ascending: false })
    if (data) {
      const ordenesConTotal = data.map((orden: unknown) => {
        const ordenTyped = orden as Orden;
        return { ...ordenTyped, total: ordenTyped.total || ordenTyped.productos.reduce((sum: number, p: { nombre: string; precio: number }) => sum + (p.precio || 0), 0) }
      });
      setOrdenes(ordenesConTotal);
    }
  }

  const obtenerVentasDelDia = async () => {
    const { data } = await supabase.from("ventas_diarias").select("*").eq("fecha", new Date().toISOString().split('T')[0]).single();
    if (data) setVentasDelDia(data as VentasDelDia);
  }

  useEffect(() => {
    obtenerOrdenes();
    obtenerVentasDelDia();
  }, [])

  const marcarPagado = async (orden: Orden, metodoPago: 'efectivo' | 'tarjeta') => {
    setLoading(true);
    try {
      const total = orden.total || orden.productos.reduce((sum, p) => sum + p.precio, 0);
      const { error } = await supabase.from("ordenes").update({ estado: "pagado", metodo_pago: metodoPago, pagado_at: new Date().toISOString(), total: total }).eq("id", orden.id);
      if (!error) {
        await obtenerOrdenes();
        await obtenerVentasDelDia();
        setOrdenSeleccionada(null);
      }
    } catch (error) {
      console.error('Error al marcar como pagado:', error);
    } finally {
      setLoading(false);
    }
  }

  const ordenesPendientes = ordenes.filter(o => o.estado !== 'pagado');
  const ordenesPagadas = ordenes.filter(o => o.estado === 'pagado');

  const ordenesPorMesa = ordenesPendientes.reduce<Record<string, Orden[]>>((acc, ord) => {
    if (!acc[ord.mesa]) acc[ord.mesa] = [];
    acc[ord.mesa].push(ord);
    return acc;
  }, {});

  const totalMesa = (lista: Orden[]) => lista.reduce((sum, ord) => sum + (ord.total || 0), 0);

  return (
    <ProtectedRoute allowRoles={["caja"]}>
      <main className="p-6">
        {/* ... (La parte del header y ventas del día no cambia) ... */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Caja 💰</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setVistaActual('pendientes')} className={`px-4 py-2 rounded-md font-medium transition-colors ${vistaActual === 'pendientes' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}>Pendientes ({Object.keys(ordenesPorMesa).length})</button>
              <button onClick={() => setVistaActual('pagadas')} className={`px-4 py-2 rounded-md font-medium transition-colors ${vistaActual === 'pagadas' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-green-600'}`}>Pagadas ({ordenesPagadas.length})</button>
            </div>
          </div>
        </div>
        {ventasDelDia && <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📊 Ventas del Día</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center"><p className="text-green-100">💵 Efectivo</p><p className="text-2xl font-bold">${ventasDelDia.total_efectivo.toFixed(2)}</p></div>
              <div className="text-center"><p className="text-blue-100">💳 Tarjeta</p><p className="text-2xl font-bold">${ventasDelDia.total_tarjeta.toFixed(2)}</p></div>
              <div className="text-center"><p className="text-yellow-100">💰 Total</p><p className="text-2xl font-bold">${ventasDelDia.total_general.toFixed(2)}</p></div>
              <div className="text-center"><p className="text-purple-100">🧾 Órdenes</p><p className="text-2xl font-bold">{ventasDelDia.ordenes_pagadas}</p></div>
            </div>
          </div>}

        {vistaActual === 'pendientes' && (
          <div className="space-y-6">
            {Object.keys(ordenesPorMesa).length === 0 ? (
              <div className="text-center text-gray-500 py-8"><p className="text-xl">🎉 No hay órdenes pendientes</p><p>Todas las cuentas están al día</p></div>
            ) : (
              Object.entries(ordenesPorMesa).map(([mesa, lista]) => (
                <div key={mesa} className="bg-white border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-orange-600">{mesa}</h2>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${totalMesa(lista).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{lista.length} orden(es)</p>
                      </div>
                      
                      {/* ===== NUEVO BOTÓN DE DESCARGA DE PDF ===== */}
                      {isClient && (
                        <PDFDownloadLink
                          document={<ReceiptPDF bill={{ mesa, ordenes: lista, total: totalMesa(lista) }} />}
                          fileName={`Mesa_${mesa.replace(/\s+/g, '_')}_cuenta.pdf`}
                        >
                          {({ loading }) => (
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                              disabled={loading}
                            >
                              {loading ? 'Generando...' : 'Descargar PDF'}
                            </button>
                          )}
                        </PDFDownloadLink>
                      )}

                    </div>
                  </div>
                  {/* ... (el resto del renderizado de órdenes pendientes no cambia) ... */}
                  <div className="space-y-3">
                    {lista.map((orden) => (
                      <div key={orden.id} className="bg-gray-50 border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">Orden #{orden.id}</p>
                          <p className="font-bold text-green-600">${(orden.total || 0).toFixed(2)}</p>
                        </div>
                        <ul className="text-sm text-gray-600 mb-3">
                          {orden.productos.map((p, i) => ( <li key={i} className="flex justify-between"><span>{p.nombre}</span><span>${p.precio.toFixed(2)}</span></li> ))}
                        </ul>
                        <div className="flex gap-2">
                          <button onClick={() => setOrdenSeleccionada(orden)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors">{loading ? 'Procesando...' : 'Registrar Pago'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ... (La vista de órdenes pagadas no cambia) ... */}
        {vistaActual === 'pagadas' && <div className="space-y-4">
            {ordenesPagadas.length === 0 ? <div className="text-center text-gray-500 py-8"><p className="text-xl">📋 No hay órdenes pagadas hoy</p></div> : ordenesPagadas.map(orden => <div key={orden.id} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-green-700">{orden.mesa} - Orden #{orden.id}</h3>
                        <p className="text-sm text-gray-600">Pagado: {new Date(orden.pagado_at!).toLocaleString('es-MX')}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-xl font-bold text-green-600">${(orden.total || 0).toFixed(2)}</p>
                          <div className="flex items-center gap-1"><span className="text-lg">{orden.metodo_pago === 'efectivo' ? '💵' : '💳'}</span><span className="text-sm font-medium capitalize">{orden.metodo_pago}</span></div>
                        </div>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600">
                      {orden.productos.map((p, i) => <li key={i} className="flex justify-between"><span>{p.nombre}</span><span>${p.precio.toFixed(2)}</span></li>)}
                    </ul>
                  </div>)}
          </div>}

        {ordenSeleccionada && (<ModalPago orden={ordenSeleccionada} onClose={() => setOrdenSeleccionada(null)} onConfirm={(metodoPago) => marcarPagado(ordenSeleccionada, metodoPago)} />)}
      </main>
    </ProtectedRoute>
  )
}