'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'

interface UbicacionConCuentas {
  ubicacion: string
  tipo: 'mesa' | 'barra'
  ordenesPendientes: number
  totalPendiente: number
}

interface TrasladoCuentaProps {
  isOpen: boolean
  onClose: () => void
  onTrasladoCompleto: () => void
}

export default function TrasladoCuenta({ isOpen, onClose, onTrasladoCompleto }: TrasladoCuentaProps) {
  const [ubicacionesConCuentas, setUbicacionesConCuentas] = useState<UbicacionConCuentas[]>([])
  const [ubicacionOrigen, setUbicacionOrigen] = useState('')
  const [ubicacionDestino, setUbicacionDestino] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Cargar ubicaciones con cuentas activas
  const cargarUbicacionesConCuentas = async () => {
    try {
      const { data: ordenes } = await supabase
        .from('ordenes')
        .select('mesa, productos, total')
        .neq('estado', 'pagado')

      if (ordenes) {
        // Agrupar por ubicación
        const agrupadas = ordenes.reduce((acc: Record<string, { ordenes: number; total: number }>, orden) => {
          const ubicacion = orden.mesa
          if (!acc[ubicacion]) {
            acc[ubicacion] = { ordenes: 0, total: 0 }
          }
          acc[ubicacion].ordenes += 1
          
          // Calcular total de la orden
          const totalOrden = orden.total || (
            Array.isArray(orden.productos) 
              ? orden.productos.reduce((sum: number, p: any) => sum + (p.precio || 0), 0)
              : 0
          )
          acc[ubicacion].total += totalOrden
          return acc
        }, {})

        // Convertir a array con tipo de ubicación
        const ubicacionesArray = Object.entries(agrupadas).map(([ubicacion, datos]) => ({
          ubicacion,
          tipo: ubicacion.toLowerCase().includes('barra') ? 'barra' as const : 'mesa' as const,
          ordenesPendientes: datos.ordenes,
          totalPendiente: datos.total
        }))

        // Ordenar: primero mesas, luego barra
        ubicacionesArray.sort((a, b) => {
          if (a.tipo !== b.tipo) {
            return a.tipo === 'mesa' ? -1 : 1
          }
          // Dentro del mismo tipo, ordenar numéricamente
          const numA = parseInt(a.ubicacion.match(/\d+/)?.[0] || '0')
          const numB = parseInt(b.ubicacion.match(/\d+/)?.[0] || '0')
          return numA - numB
        })

        setUbicacionesConCuentas(ubicacionesArray)
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      cargarUbicacionesConCuentas()
      setUbicacionOrigen('')
      setUbicacionDestino('')
      setMensaje('')
    }
  }, [isOpen])

  // Ejecutar traslado
  const ejecutarTraslado = async () => {
    if (!ubicacionOrigen || !ubicacionDestino) {
      setMensaje('❌ Selecciona ubicación de origen y destino')
      return
    }

    if (ubicacionOrigen === ubicacionDestino) {
      setMensaje('❌ No puedes trasladar a la misma ubicación')
      return
    }

    setLoading(true)
    setMensaje('')

    try {
      // Actualizar todas las órdenes pendientes de la ubicación origen
      const { error } = await supabase
        .from('ordenes')
        .update({ mesa: ubicacionDestino })
        .eq('mesa', ubicacionOrigen)
        .neq('estado', 'pagado')

      if (error) throw error

      setMensaje(`✅ Cuenta trasladada exitosamente de ${ubicacionOrigen} a ${ubicacionDestino}`)
      
      // Recargar ubicaciones
      await cargarUbicacionesConCuentas()
      
      // Limpiar selecciones
      setUbicacionOrigen('')
      setUbicacionDestino('')
      
      // Notificar al componente padre
      setTimeout(() => {
        onTrasladoCompleto()
      }, 2000)

    } catch (error) {
      console.error('Error al trasladar cuenta:', error)
      setMensaje('❌ Error al trasladar la cuenta')
    } finally {
      setLoading(false)
    }
  }

  // Obtener ubicaciones disponibles como destino (todas las ubicaciones posibles)
  const obtenerUbicacionesDestino = () => {
    const todasLasUbicaciones = []
    
    // Agregar mesas (1-12)
    for (let i = 1; i <= 12; i++) {
      todasLasUbicaciones.push({
        ubicacion: `Mesa ${i}`,
        tipo: 'mesa' as const,
        disponible: true
      })
    }
    
    // Agregar posiciones de barra (1-8)
    for (let i = 1; i <= 8; i++) {
      todasLasUbicaciones.push({
        ubicacion: `Barra ${i}`,
        tipo: 'barra' as const,
        disponible: true
      })
    }
    
    return todasLasUbicaciones
  }

  const ubicacionesDestino = obtenerUbicacionesDestino()

  // Función para obtener emoji según tipo
  const obtenerEmoji = (tipo: 'mesa' | 'barra') => {
    return tipo === 'mesa' ? '🪑' : '🍺'
  }

  // Función para obtener color según tipo
  const obtenerColor = (tipo: 'mesa' | 'barra') => {
    return tipo === 'mesa' ? 'text-green-600' : 'text-amber-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="text-3xl mr-3">🔄</span>
              Trasladar Cuenta
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Traslada todas las órdenes pendientes de una ubicación a otra
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de Ubicación Origen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📍 Ubicación de Origen (con cuentas activas)
            </label>
            {ubicacionesConCuentas.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">📋</div>
                <p className="font-medium">No hay ubicaciones con cuentas pendientes</p>
                <p className="text-sm">Todas las cuentas están pagadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {ubicacionesConCuentas.map((ubicacion) => (
                  <button
                    key={ubicacion.ubicacion}
                    onClick={() => setUbicacionOrigen(ubicacion.ubicacion)}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      ubicacionOrigen === ubicacion.ubicacion
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold flex items-center ${obtenerColor(ubicacion.tipo)}`}>
                        <span className="text-xl mr-2">{obtenerEmoji(ubicacion.tipo)}</span>
                        {ubicacion.ubicacion}
                      </span>
                      {ubicacionOrigen === ubicacion.ubicacion && (
                        <span className="text-blue-500 text-xl">✓</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{ubicacion.ordenesPendientes} orden{ubicacion.ordenesPendientes !== 1 ? 'es' : ''} pendiente{ubicacion.ordenesPendientes !== 1 ? 's' : ''}</div>
                      <div className="font-medium text-green-600">
                        Total: ${ubicacion.totalPendiente.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector de Ubicación Destino */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎯 Ubicación de Destino
            </label>
            
            {/* Mesas como destino */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                <span className="text-lg mr-1">🪑</span>
                Mesas (1-12)
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {ubicacionesDestino
                  .filter(u => u.tipo === 'mesa')
                  .map((ubicacion) => (
                    <button
                      key={ubicacion.ubicacion}
                      onClick={() => setUbicacionDestino(ubicacion.ubicacion)}
                      disabled={ubicacion.ubicacion === ubicacionOrigen}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                        ubicacion.ubicacion === ubicacionOrigen
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : ubicacionDestino === ubicacion.ubicacion
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300 text-gray-700'
                      }`}
                    >
                      {ubicacion.ubicacion.replace('Mesa ', '')}
                    </button>
                  ))}
              </div>
            </div>

            {/* Barra como destino */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                <span className="text-lg mr-1">🍺</span>
                Barra (1-8)
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {ubicacionesDestino
                  .filter(u => u.tipo === 'barra')
                  .map((ubicacion) => (
                    <button
                      key={ubicacion.ubicacion}
                      onClick={() => setUbicacionDestino(ubicacion.ubicacion)}
                      disabled={ubicacion.ubicacion === ubicacionOrigen}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                        ubicacion.ubicacion === ubicacionOrigen
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : ubicacionDestino === ubicacion.ubicacion
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      {ubicacion.ubicacion.replace('Barra ', '')}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Resumen del traslado */}
          {ubicacionOrigen && ubicacionDestino && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Resumen del Traslado</h4>
              <div className="text-sm text-blue-700">
                <div className="flex items-center justify-between">
                  <span>Desde:</span>
                  <span className="font-bold flex items-center">
                    {obtenerEmoji(ubicacionesConCuentas.find(u => u.ubicacion === ubicacionOrigen)?.tipo || 'mesa')}
                    <span className="ml-1">{ubicacionOrigen}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hacia:</span>
                  <span className="font-bold flex items-center">
                    {obtenerEmoji(ubicacionesDestino.find(u => u.ubicacion === ubicacionDestino)?.tipo || 'mesa')}
                    <span className="ml-1">{ubicacionDestino}</span>
                  </span>
                </div>
                <div className="border-t border-blue-300 mt-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Órdenes a trasladar:</span>
                    <span className="font-bold">
                      {ubicacionesConCuentas.find(u => u.ubicacion === ubicacionOrigen)?.ordenesPendientes || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-green-600">
                      ${ubicacionesConCuentas.find(u => u.ubicacion === ubicacionOrigen)?.totalPendiente.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`p-4 rounded-lg text-center font-medium ${
              mensaje.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {mensaje}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={ejecutarTraslado}
              disabled={!ubicacionOrigen || !ubicacionDestino || ubicacionOrigen === ubicacionDestino || loading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                ubicacionOrigen && ubicacionDestino && ubicacionOrigen !== ubicacionDestino && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Trasladando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-xl mr-2">🔄</span>
                  Ejecutar Traslado
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}