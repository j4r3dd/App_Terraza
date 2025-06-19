// src/app/caja/page.tsx
"use client"

import { useEffect, useState } from "react" 
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReceiptPDF from "@/components/ReceiptPDF";

// Interfaces actualizadas
export interface Orden {
  id: number
  mesa: string
  productos: { nombre: string; precio: number }[]
  estado: string
  total: number
  metodo_pago?: 'efectivo' | 'tarjeta'
  pagado_at?: string
  created_at: string
  creado_por?: number  // ID del mesero
  mesero_nombre?: string  // Nombre del mesero
}

export interface VentasDelDia {
  fecha: string
  total_efectivo: number
  total_tarjeta: number
  total_general: number
  ordenes_pagadas: number
}

interface MesaBill {
  mesa: string;
  ordenes: Orden[];
  total: number;
}

interface MesaAgrupada {
  mesa: string;
  ordenes: Orden[];
  total: number;
  hasUnpaidOrders: boolean;
}

// Componente ModalPago actualizado
interface ModalPagoProps {
  mesaAgrupada: MesaAgrupada
  onClose: () => void
  onConfirm: (metodoPago: 'efectivo' | 'tarjeta') => void
}

function ModalPago({ mesaAgrupada, onClose, onConfirm }: ModalPagoProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'tarjeta'>('efectivo')
  
  // Calcular resumen por mesero
  const resumenPorMesero = mesaAgrupada.ordenes
    .filter(o => o.estado !== 'pagado')
    .reduce((acc: Record<string, { ordenes: number; total: number }>, orden) => {
      const mesero = orden.mesero_nombre || 'Sin asignar';
      if (!acc[mesero]) acc[mesero] = { ordenes: 0, total: 0 };
      acc[mesero].ordenes += 1;
      acc[mesero].total += orden.total || 0;
      return acc;
    }, {});
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">Registrar Pago de Mesa Completa</h3>
        
        {/* Resumen por mesero */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-700 mb-2">Resumen por mesero:</p>
          {Object.entries(resumenPorMesero).map(([mesero, datos]) => (
            <div key={mesero} className="flex justify-between items-center py-1">
              <span className="text-sm">👤 {mesero}</span>
              <span className="text-sm font-medium">
                {datos.ordenes} orden{datos.ordenes !== 1 ? 'es' : ''} - ${datos.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">Mesa: <span className="font-semibold">{mesaAgrupada.mesa}</span></p>
          <p className="text-gray-600">Órdenes pendientes: <span className="font-semibold">{mesaAgrupada.ordenes.filter(o => o.estado !== 'pagado').length}</span></p>
          <p className="text-2xl font-bold text-green-600 mt-2">Total: ${mesaAgrupada.total.toFixed(2)}</p>
        </div>
        
        <div className="mb-6">
          <p className="font-medium mb-3">Método de pago:</p>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input 
                type="radio" 
                value="efectivo" 
                checked={metodoSeleccionado === 'efectivo'} 
                onChange={(e) => setMetodoSeleccionado(e.target.value as 'efectivo')} 
                className="mr-3" 
              />
              <div className="flex items-center">
                <span className="text-2xl mr-2">💵</span>
                <span className="font-medium">Efectivo</span>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input 
                type="radio" 
                value="tarjeta" 
                checked={metodoSeleccionado === 'tarjeta'} 
                onChange={(e) => setMetodoSeleccionado(e.target.value as 'tarjeta')} 
                className="mr-3" 
              />
              <div className="flex items-center">
                <span className="text-2xl mr-2">💳</span>
                <span className="font-medium">Tarjeta</span>
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(metodoSeleccionado)} 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CajaPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [ventasDelDia, setVentasDelDia] = useState<VentasDelDia | null>(null)
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'pagadas'>('pendientes')
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaAgrupada | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [billToDownload, setBillToDownload] = useState<MesaBill | null>(null);

  useEffect(() => {
    setIsClient(true)
  }, [])

  const obtenerOrdenes = async () => {
    // Query mejorada con JOIN a tabla usuarios para obtener el nombre del mesero
    const { data } = await supabase
      .from("ordenes")
      .select(`
        *,
        usuarios:creado_por (
          id,
          username
        )
      `)
      .order("created_at", { ascending: false });
      
    if (data) {
      const ordenesConTotal = data.map((orden: any) => {
        const productosTotal = Array.isArray(orden.productos)
          ? orden.productos.reduce((sum: number, p: { nombre: string; precio: number }) => sum + (p.precio || 0), 0)
          : 0;
        
        return { 
          ...orden, 
          total: orden.total || productosTotal,
          // Agregar nombre del mesero
          mesero_nombre: orden.usuarios?.username || 'Sin asignar'
        };
      });
      setOrdenes(ordenesConTotal);
    }
  };

  const obtenerVentasDelDia = async () => {
    const { data } = await supabase.from("ventas_diarias").select("*").eq("fecha", new Date().toISOString().split('T')[0]).single();
    if (data) setVentasDelDia(data as VentasDelDia);
  }

  useEffect(() => {
    obtenerOrdenes();
    obtenerVentasDelDia();
    
    const intervalId = setInterval(() => {
      obtenerOrdenes();
      obtenerVentasDelDia();
      console.log('🔄 Auto-refresco: Órdenes y ventas de caja actualizadas')
    }, 60000)
    
    const subscription = supabase
      .channel('ordenes_caja')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ordenes'
        }, 
        () => {
          obtenerOrdenes();
          obtenerVentasDelDia();
        }
      )
      .subscribe()

    return () => {
      clearInterval(intervalId)
      subscription.unsubscribe()
    }
  }, [])

  // Función para marcar toda la mesa como pagada
  const marcarMesaPagada = async (mesaAgrupada: MesaAgrupada, metodoPago: 'efectivo' | 'tarjeta') => {
    setLoading(true);
    try {
      // Obtener todas las órdenes pendientes de la mesa
      const ordenesPendientes = mesaAgrupada.ordenes.filter(o => o.estado !== 'pagado');
      
      // Marcar todas las órdenes como pagadas
      for (const orden of ordenesPendientes) {
        const total = orden.total || orden.productos.reduce((sum, p) => sum + p.precio, 0);
        const { error } = await supabase
          .from("ordenes")
          .update({ 
            estado: "pagado", 
            metodo_pago: metodoPago, 
            pagado_at: new Date().toISOString(), 
            total: total 
          })
          .eq("id", orden.id);
        
        if (error) {
          console.error(`Error al marcar orden ${orden.id} como pagada:`, error);
          throw error;
        }
      }

      await obtenerOrdenes();
      await obtenerVentasDelDia();
      setMesaSeleccionada(null);
      
    } catch (error) {
      console.error('Error al marcar mesa como pagada:', error);
    } finally {
      setLoading(false);
    }
  }

  // Crear lista fija de mesas (Mesa 1 a Mesa 12)
  const mesasFijas = Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`);

  // Agrupar órdenes por mesa manteniendo el orden fijo
  const mesasAgrupadas: MesaAgrupada[] = mesasFijas.map(mesaNombre => {
    const ordenesMesa = ordenes.filter(o => o.mesa === mesaNombre);
    const ordenesPendientes = ordenesMesa.filter(o => o.estado !== 'pagado');
    const total = ordenesPendientes.reduce((sum, ord) => sum + (ord.total || 0), 0);
    
    return {
      mesa: mesaNombre,
      ordenes: ordenesMesa,
      total,
      hasUnpaidOrders: ordenesPendientes.length > 0
    };
  });

  // Filtrar para vistas
  const mesasConPendientes = mesasAgrupadas.filter(m => m.hasUnpaidOrders);
  const ordenesPagadas = ordenes.filter(o => o.estado === 'pagado');

  return (
    <ProtectedRoute allowRoles={["caja"]}>
      <main className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Caja 💰</h1>
            <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setVistaActual('pendientes')} 
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    vistaActual === 'pendientes' 
                      ? 'bg-white shadow-sm text-orange-600' 
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  Mesas Pendientes ({mesasConPendientes.length})
                </button>
                <button 
                  onClick={() => setVistaActual('pagadas')} 
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    vistaActual === 'pagadas' 
                      ? 'bg-white shadow-sm text-green-600' 
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Pagadas ({ordenesPagadas.length})
                </button>
                </div>
            </div>
        </div>
        
        {/* Ventas del día */}
        {ventasDelDia && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📊 Ventas del Día</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-green-100">💵 Efectivo</p>
                  <p className="text-2xl font-bold">${ventasDelDia.total_efectivo.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100">💳 Tarjeta</p>
                  <p className="text-2xl font-bold">${ventasDelDia.total_tarjeta.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-100">💰 Total</p>
                  <p className="text-2xl font-bold">${ventasDelDia.total_general.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-100">🧾 Órdenes</p>
                  <p className="text-2xl font-bold">{ventasDelDia.ordenes_pagadas}</p>
                </div>
            </div>
          </div>
        )}
        
        {/* Vista de Mesas Pendientes */}
        {vistaActual === 'pendientes' && (
          <div className="space-y-6">
            {/* Grid de mesas en orden fijo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mesasAgrupadas.map((mesaAgrupada) => (
                <div 
                  key={mesaAgrupada.mesa} 
                  className={`rounded-lg p-4 transition-all duration-200 ${
                    mesaAgrupada.hasUnpaidOrders 
                      ? 'bg-white border-2 border-orange-200 shadow-md' 
                      : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${
                      mesaAgrupada.hasUnpaidOrders ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {mesaAgrupada.mesa}
                    </h2>
                    
                    {mesaAgrupada.hasUnpaidOrders ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${mesaAgrupada.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {mesaAgrupada.ordenes.filter(o => o.estado !== 'pagado').length} orden(es) pendiente(s)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Sin órdenes
                      </div>
                    )}
                  </div>

                  {mesaAgrupada.hasUnpaidOrders && (
                    <>
                      {/* Mostrar órdenes agrupadas por mesero */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Órdenes por mesero:</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(() => {
                            // Agrupar órdenes pendientes por mesero
                            const ordenesPorMesero = mesaAgrupada.ordenes
                              .filter(o => o.estado !== 'pagado')
                              .reduce((acc: Record<string, Orden[]>, orden) => {
                                const mesero = orden.mesero_nombre || 'Sin asignar';
                                if (!acc[mesero]) acc[mesero] = [];
                                acc[mesero].push(orden);
                                return acc;
                              }, {});

                            return Object.entries(ordenesPorMesero).map(([mesero, ordenes]) => (
                              <div key={mesero} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-blue-800 text-sm">
                                    👤 {mesero}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {ordenes.flatMap(orden => orden.productos).map((producto, i) => (
                                    <div key={i} className="flex justify-between text-xs bg-white p-1 rounded">
                                      <span>{producto.nombre}</span>
                                      <span className="text-green-600 font-medium">${producto.precio.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBillToDownload({ 
                            mesa: mesaAgrupada.mesa, 
                            ordenes: mesaAgrupada.ordenes.filter(o => o.estado !== 'pagado'), 
                            total: mesaAgrupada.total 
                          })}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => setMesaSeleccionada(mesaAgrupada)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                        >
                          {loading ? 'Procesando...' : '💰 Pagar Mesa'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {mesasConPendientes.length === 0 && (
              <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-xl font-medium">¡Todas las mesas están al día!</p>
                <p className="text-sm">No hay cuentas pendientes</p>
              </div>
            )}
          </div>
        )}

        {/* Vista de Órdenes Pagadas */}
        {vistaActual === 'pagadas' && (
          <div className="space-y-4">
            {ordenesPagadas.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-xl">📋 No hay órdenes pagadas hoy</p>
              </div>
            ) : (
              ordenesPagadas.map(orden => (
                <div key={orden.id} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-green-700">{orden.mesa} - Orden #{orden.id}</h3>
                      {/* Mostrar mesero que tomó la orden */}
                      <p className="text-sm text-blue-600 font-medium">
                        👤 Mesero: {orden.mesero_nombre || 'Sin asignar'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pagado: {new Date(orden.pagado_at!).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xl font-bold text-green-600">${(orden.total || 0).toFixed(2)}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{orden.metodo_pago === 'efectivo' ? '💵' : '💳'}</span>
                          <span className="text-sm font-medium capitalize">{orden.metodo_pago}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600">
                    {orden.productos.map((p, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{p.nombre}</span>
                        <span>${p.precio.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal de pago */}
        {mesaSeleccionada && (
          <ModalPago 
            mesaAgrupada={mesaSeleccionada} 
            onClose={() => setMesaSeleccionada(null)} 
            onConfirm={(metodoPago) => marcarMesaPagada(mesaSeleccionada, metodoPago)} 
          />
        )}

        {/* Modal de descarga de PDF */}
        {isClient && billToDownload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-2xl text-center">
                  <h3 className="text-xl font-bold mb-4">Preparando PDF para {billToDownload.mesa}</h3>
                  <p className="text-gray-600 mb-6">El archivo se descargará automáticamente. Si no, usa el botón.</p>
                  <PDFDownloadLink
                      document={<ReceiptPDF bill={billToDownload} />}
                      fileName={`Mesa_${billToDownload.mesa.replace(/\s+/g, '_')}_cuenta.pdf`}
                      className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                  >
                      {({ loading }) => (loading ? 'Generando...' : 'Descargar Ahora')}
                  </PDFDownloadLink>
                  <button 
                    onClick={() => setBillToDownload(null)} 
                    className="mt-4 block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg"
                  >
                      Cerrar
                  </button>
              </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}