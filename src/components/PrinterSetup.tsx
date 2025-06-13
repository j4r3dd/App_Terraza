// src/components/PrinterSetup.tsx
"use client"

import { useState, useEffect } from 'react'
import { detectarImpresoras, solicitarAccesoImpresora, COMMANDS } from '../utils/thermalPrinter'

interface PrinterSetupProps {
  onClose: () => void
}

type EstadoImpresora = 'checking' | 'available' | 'not_supported' | 'connecting' | 'connected' | 'error'

export default function PrinterSetup({ onClose }: PrinterSetupProps) {
  const [estado, setEstado] = useState<EstadoImpresora>('checking')
  const [puerto, setPuerto] = useState<SerialPort | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    verificarSoporte()
  }, [])

  const verificarSoporte = async () => {
    if (!('serial' in navigator) || !navigator.serial) {
      setEstado('not_supported')
      setMensaje('Tu navegador no soporta Web Serial API. Usa Chrome o Edge.')
      return
    }

    try {
      const disponible = await detectarImpresoras()
      setEstado(disponible ? 'connected' : 'available')
      setMensaje(disponible ? 'Impresora ya configurada' : 'Listo para conectar impresora')
    } catch (error) {
      setEstado('error')
      setMensaje('Error al verificar impresoras')
      console.error(error)
    }
  }

  const conectarImpresora = async () => {
    setEstado('connecting')
    setMensaje('Selecciona tu impresora en el diálogo...')

    try {
      const port = await solicitarAccesoImpresora()
      setPuerto(port)
      setEstado('connected')
      setMensaje('¡Impresora conectada correctamente!')
    } catch (error: unknown) {
      setEstado('error')
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFoundError') {
        setMensaje('No se seleccionó ninguna impresora')
      } else {
        setMensaje('Error al conectar con la impresora: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      }
    }
  }

  const probarImpresora = async () => {
    if (!puerto) return

    try {
      await puerto.open({ baudRate: 9600 })
      
      const writer = puerto.writable?.getWriter()
      if (!writer) {
        throw new Error('No se pudo obtener el writer del puerto')
      }
      
      const encoder = new TextEncoder()
      
      let testData = ''
      testData += COMMANDS.INIT
      testData += COMMANDS.ALIGN_CENTER
      testData += COMMANDS.BOLD_ON
      testData += 'TERRAZA MADERO\n'
      testData += COMMANDS.BOLD_OFF
      testData += '================================\n'
      testData += 'PRUEBA DE IMPRESORA\n'
      testData += '================================\n'
      testData += COMMANDS.ALIGN_LEFT
      testData += 'Fecha: ' + new Date().toLocaleString('es-MX') + '\n'
      testData += 'Estado: Funcionando correctamente\n'
      testData += '\n'
      testData += COMMANDS.ALIGN_CENTER
      testData += 'Prueba exitosa\n'
      testData += '\n\n'
      testData += COMMANDS.PAPER_CUT
      
      await writer.write(encoder.encode(testData))
      
      writer.releaseLock()
      await puerto.close()
      
      setMensaje('Prueba de impresión enviada')
      
    } catch (error: unknown) {
      setMensaje('Error en prueba: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🖨️ Configuración de Impresora</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Estado actual */}
        <div className={`mb-6 p-4 rounded-lg ${
          estado === 'connected' ? 'bg-green-100 border-green-300' :
          estado === 'error' || estado === 'not_supported' ? 'bg-red-100 border-red-300' :
          'bg-blue-100 border-blue-300'
        } border`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {estado === 'connected' ? '✅' :
               estado === 'error' || estado === 'not_supported' ? '❌' :
               estado === 'connecting' ? '⏳' : '🔍'}
            </span>
            <div>
              <p className="font-semibold">
                {estado === 'checking' ? 'Verificando soporte...' :
                 estado === 'available' ? 'Listo para conectar' :
                 estado === 'not_supported' ? 'No soportado' :
                 estado === 'connecting' ? 'Conectando...' :
                 estado === 'connected' ? 'Impresora conectada' :
                 'Error de conexión'}
              </p>
              <p className="text-sm text-gray-600">{mensaje}</p>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold">📋 Instrucciones de uso:</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-medium">Conecta tu impresora térmica</p>
                <p className="text-sm text-gray-600">Conecta la impresora por USB o Bluetooth al dispositivo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-medium">Usa un navegador compatible</p>
                <p className="text-sm text-gray-600">Google Chrome o Microsoft Edge (Web Serial API requerido)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="font-medium">Haz clic en &quot;Conectar Impresora&quot;</p>
                <p className="text-sm text-gray-600">Selecciona tu impresora en el diálogo que aparece</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <div>
                <p className="font-medium">Prueba la impresión</p>
                <p className="text-sm text-gray-600">Usa el botón &quot;Probar Impresora&quot; para verificar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">⚙️ Especificaciones soportadas:</h3>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <ul className="space-y-1">
              <li>• <strong>Papel:</strong> 58mm térmico</li>
              <li>• <strong>Comandos:</strong> ESC/POS estándar</li>
              <li>• <strong>Conexión:</strong> USB Serie / Bluetooth</li>
              <li>• <strong>Velocidad:</strong> 9600 baud</li>
              <li>• <strong>Resolución:</strong> 203 DPI</li>
              <li>• <strong>Ancho efectivo:</strong> 48mm (384 puntos)</li>
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          {estado === 'available' && (
            <button
              onClick={conectarImpresora}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              🔌 Conectar Impresora
            </button>
          )}
          
          {estado === 'connected' && puerto && (
            <button
              onClick={probarImpresora}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              🧪 Probar Impresora
            </button>
          )}
          
          {estado === 'not_supported' && (
            <div className="flex-1 bg-red-100 text-red-800 py-3 px-4 rounded-lg font-medium text-center">
              ❌ Navegador no compatible
            </div>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 pt-6 border-t">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-700 hover:text-gray-900">
              🔧 Solución de problemas
            </summary>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p><strong>La impresora no aparece:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verifica que esté encendida y conectada</li>
                <li>Usa Chrome o Edge (versión reciente)</li>
                <li>Permite acceso a dispositivos serie en el navegador</li>
              </ul>
              
              <p><strong>No imprime nada:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verifica que haya papel térmico</li>
                <li>Comprueba que el papel esté bien colocado</li>
                <li>Intenta desconectar y reconectar la impresora</li>
              </ul>
              
              <p><strong>Caracteres extraños:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verifica la velocidad de conexión (9600 baud)</li>
                <li>Asegúrate de usar comandos ESC/POS compatibles</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}