"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"

interface Orden {
  id: number
  mesa: string
  productos: { nombre: string; precio: number }[]
  estado: string
  created_at: string
}

export default function CocinaPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'completadas'>('pendientes')
  const [loading, setLoading] = useState(false)

  const obtenerOrdenes = async () => {
    const { data } = await supabase
      .from("ordenes")
      .select("*")
      .eq("area", "cocina")
      .order("created_at", { ascending: false })
    if (data) setOrdenes(data as Orden[])
  }

  useEffect(() => {
    obtenerOrdenes()
    
    // Auto-refresco cada minuto (60000ms)
    const intervalId = setInterval(() => {
      obtenerOrdenes()
      console.log('🔄 Auto-refresco: Órdenes de cocina actualizadas')
    }, 60000)
    
    // Configurar suscripción en tiempo real para nuevas órdenes
    const subscription = supabase
      .channel('ordenes_cocina')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ordenes',
          filter: 'area=eq.cocina'
        }, 
        () => {
          obtenerOrdenes()
        }
      )
      .subscribe()

    return () => {
      clearInterval(intervalId)
      subscription.unsubscribe()
    }
  }, [])

  const marcarListo = async (id: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("ordenes")
        .update({ estado: "listo" })
        .eq("id", id)
      
      if (!error) {
        setOrdenes((ordenes) => 
          ordenes.map((ord) => 
            ord.id === id ? { ...ord, estado: "listo" } : ord
          )
        )
      }
    } catch (error) {
      console.error('Error al marcar como listo:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar órdenes
  const ordenesPendientes = ordenes.filter(o => o.estado === "pendiente")
  const ordenesCompletadas = ordenes.filter(o => o.estado === "listo")

  // Función para formatear la hora
  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowRoles={["cocina"]}>
      <main className="p-6">
        {/* Header con título y navegación */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">👨‍🍳 Estación de Cocina</h1>
          
          {/* Pestañas de navegación */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActual('pendientes')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                vistaActual === 'pendientes'
                  ? 'bg-white shadow-sm text-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              🔥 Pendientes ({ordenesPendientes.length})
            </button>
            <button
              onClick={() => setVistaActual('completadas')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                vistaActual === 'completadas'
                  ? 'bg-white shadow-sm text-green-600'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              ✅ Completadas ({ordenesCompletadas.length})
            </button>
          </div>
        </div>

        {/* Vista de Órdenes Pendientes */}
        {vistaActual === 'pendientes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-red-600">
                🍳 Platillos por Preparar
              </h2>
              {ordenesPendientes.length > 0 && (
                <div className="text-sm text-gray-600">
                  {ordenesPendientes.length} orden{ordenesPendientes.length !== 1 ? 'es' : ''} en cola
                </div>
              )}
            </div>

            {ordenesPendientes.length === 0 ? (
              <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-xl font-medium">¡Todo al día!</p>
                <p>No hay órdenes pendientes en cocina</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ordenesPendientes.map((orden) => (
                  <div
                    key={orden.id}
                    className="bg-white border-2 border-red-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-red-700">
                        {orden.mesa}
                      </h3>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Orden #{orden.id}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          {formatearHora(orden.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Platillos a preparar:
                      </h4>
                      <ul className="space-y-2">
                        {orden.productos.map((p, i) => (
                          <li key={i} className="flex justify-between items-center bg-red-50 p-2 rounded border-l-4 border-red-300">
                            <span className="font-semibold text-gray-800 text-sm">{p.nombre}</span>
                            <span className="text-green-600 font-bold text-sm">
                              ${p.precio.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => marcarListo(orden.id)}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Cocinando...
                        </>
                      ) : (
                        <>
                          ✅ Platillo Listo
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de Órdenes Completadas */}
        {vistaActual === 'completadas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-600">
                ✅ Platillos Completados
              </h2>
              {ordenesCompletadas.length > 0 && (
                <div className="text-sm text-gray-600">
                  {ordenesCompletadas.length} platillo{ordenesCompletadas.length !== 1 ? 's' : ''} listo{ordenesCompletadas.length !== 1 ? 's' : ''} para servir
                </div>
              )}
            </div>

            {ordenesCompletadas.length === 0 ? (
              <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-xl font-medium">Sin platillos completados</p>
                <p>Los platillos terminados aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ordenesCompletadas.map((orden) => (
                  <div
                    key={orden.id}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-4 shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-green-700">
                        {orden.mesa}
                      </h3>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Orden #{orden.id}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          ✅ Listo
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Platillos preparados:
                      </h4>
                      <ul className="space-y-2">
                        {orden.productos.map((p, i) => (
                          <li key={i} className="flex justify-between items-center bg-green-50 p-2 rounded border-l-4 border-green-400">
                            <span className="font-semibold text-gray-800 text-sm">{p.nombre}</span>
                            <span className="text-green-600 font-bold text-sm">
                              ${p.precio.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="w-full bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg text-center border border-green-300">
                      🍽️ Listo para servir
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}