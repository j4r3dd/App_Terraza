// src/components/PrinterSetup.tsx
"use client"

import { useState, useEffect } from 'react'
import { 
  detectarImpresoras, 
  solicitarAccesoImpresora, 
  solicitarAccesoImpresoraConFiltros,
  probarConexionImpresora,
  COMMANDS 
} from '../utils/thermalPrinter'

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
      setMensaje('Tu navegador no soporta Web Serial API. Necesitas Chrome 89+ o Edge 89+.')
      return
    }

    try {
      const disponible = await detectarImpresoras()
      setEstado(disponible ? 'connected' : 'available')
      setMensaje(disponible ? 'Hay impresoras configuradas previamente' : 'Listo para conectar tu impresora')
    } catch (error) {
      setEstado('error')
      setMensaje('Error al verificar impresoras disponibles')
      console.error(error)
    }
  }

  const conectarImpresora = async (usarFiltros = false) => {
    setEstado('connecting')
    setMensaje('Abriendo diálogo de selección de dispositivo...')

    try {
      const port = usarFiltros ? 
        await solicitarAccesoImpresoraConFiltros() : 
        await solicitarAccesoImpresora()
      
      setPuerto(port)
      setEstado('connected')
      setMensaje('¡Impresora conectada! Ya puedes imprimir tickets.')
      
    } catch (error: unknown) {
      setEstado('error')
      
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'NotFoundError') {
          setMensaje('❌ No se seleccionó ningún dispositivo. Inténtalo de nuevo y selecciona tu impresora.')
        } else if (error.name === 'SecurityError') {
          setMensaje('❌ Permisos denegados. Permite el acceso a dispositivos serie.')
        } else {
          const message = 'message' in error ? error.message as string : 'Error desconocido'
          if (message.includes('No se encontraron dispositivos')) {
            setMensaje('❌ No se encontraron dispositivos compatibles. Usa "Conectar Cualquier Dispositivo".')
          } else {
            setMensaje(`❌ Error: ${message}`)
          }
        }
      } else {
        setMensaje('❌ Error desconocido al conectar impresora')
      }
      
      console.error('Error de conexión:', error)
    }
  }

  const probarImpresora = async () => {
    if (!puerto) {
      // Si no hay puerto guardado, solicitar uno
      try {
        await conectarImpresora()
        return
      } catch (error) {
        setMensaje('❌ Primero conecta una impresora')
        return
      }
    }

    setMensaje('⏳ Enviando prueba de impresión...')

    try {
      await probarConexionImpresora()
      setMensaje('✅ ¡Prueba enviada! Verifica que haya salido el papel.')
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? error.message as string 
        : 'Error desconocido'
      setMensaje(`❌ Error en prueba: ${errorMessage}`)
      console.error('Error en prueba:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🖨️ Configuración de Impresora Térmica</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Estado actual */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          estado === 'connected' ? 'bg-green-50 border-green-300' :
          estado === 'error' || estado === 'not_supported' ? 'bg-red-50 border-red-300' :
          estado === 'connecting' ? 'bg-yellow-50 border-yellow-300' :
          'bg-blue-50 border-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {estado === 'connected' ? '✅' :
               estado === 'error' || estado === 'not_supported' ? '❌' :
               estado === 'connecting' ? '⏳' : '🔍'}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {estado === 'checking' ? 'Verificando compatibilidad...' :
                 estado === 'available' ? 'Listo para conectar' :
                 estado === 'not_supported' ? 'Navegador no compatible' :
                 estado === 'connecting' ? 'Conectando dispositivo...' :
                 estado === 'connected' ? 'Impresora configurada' :
                 'Error de conexión'}
              </p>
              <p className="text-sm text-gray-700">{mensaje}</p>
            </div>
          </div>
        </div>

        {/* Pasos detallados para conectar */}
        {estado === 'available' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-3">🔧 Pasos para conectar tu impresora:</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                <div>
                  <p className="font-medium">Conecta físicamente la impresora</p>
                  <p className="text-gray-600">Por cable USB a tu computadora/tablet</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                <div>
                  <p className="font-medium">Enciende la impresora</p>
                  <p className="text-gray-600">Debe estar encendida y con papel térmico</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                <div>
                  <p className="font-medium">Haz clic en "Buscar Impresoras"</p>
                  <p className="text-gray-600">Se abrirá un diálogo para seleccionar el dispositivo</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">4</span>
                <div>
                  <p className="font-medium">Selecciona tu impresora</p>
                  <p className="text-gray-600">Aparecerá como "USB Serial Device" o similar</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información sobre dispositivos no detectados */}
        {estado === 'error' && mensaje.includes('No se encontraron dispositivos') && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-bold text-amber-800 mb-3">⚠️ ¿No aparece tu impresora?</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>• La impresora debe estar <strong>encendida y conectada por USB</strong></p>
              <p>• Algunos dispositivos aparecen como "USB Serial Device" en lugar del nombre de la marca</p>
              <p>• Si no aparece nada, prueba el botón "Conectar Cualquier Dispositivo"</p>
              <p>• Verifica que sea una impresora térmica ESC/POS de 58mm</p>
            </div>
          </div>
        )}

        {/* Especificaciones técnicas */}
        <div className="mb-6">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-700 hover:text-gray-900 mb-3">
              ⚙️ Especificaciones técnicas soportadas
            </summary>
            <div className="bg-gray-50 p-4 rounded-lg text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">📝 Papel y formato:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Papel térmico de 58mm</li>
                  <li>• Resolución: 203 DPI</li>
                  <li>• Ancho efectivo: 48mm</li>
                  <li>• Comandos ESC/POS</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔌 Conexión:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• USB Serie / RS-232</li>
                  <li>• Velocidad: 9600 baud</li>
                  <li>• 8 bits de datos, sin paridad</li>
                  <li>• 1 bit de parada</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🏷️ Marcas compatibles:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Epson (TM-T20, TM-T82)</li>
                  <li>• Citizen (CT-S310)</li>
                  <li>• Xprinter (XP-58)</li>
                  <li>• Genéricas 58mm</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">💻 Navegadores:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Chrome 89+</li>
                  <li>• Edge 89+</li>
                  <li>• Opera 76+</li>
                  <li>• (No Firefox/Safari)</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {/* Botones para conectar */}
          {(estado === 'available' || estado === 'error') && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => conectarImpresora(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                Buscar Impresoras
              </button>
              
              <button
                onClick={() => conectarImpresora(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>🔌</span>
                Conectar Cualquier Dispositivo
              </button>
            </div>
          )}
          
          {/* Botón de prueba */}
          {estado === 'connected' && (
            <button
              onClick={probarImpresora}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>🧪</span>
              Probar Impresión
            </button>
          )}
          
          {/* Botón para reconfigurar */}
          {estado === 'connected' && (
            <button
              onClick={() => {
                setPuerto(null)
                setEstado('available')
                setMensaje('Listo para conectar nueva impresora')
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              Conectar Otra Impresora
            </button>
          )}
          
          {/* Estado de no soporte */}
          {estado === 'not_supported' && (
            <div className="bg-red-100 text-red-800 py-3 px-4 rounded-lg font-medium text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span>❌</span>
                <span>Navegador no compatible</span>
              </div>
              <p className="text-sm">
                Necesitas usar <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> para conectar impresoras
              </p>
            </div>
          )}
          
          {/* Botón cerrar */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Troubleshooting expandible */}
        <div className="mt-6 pt-6 border-t">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2">
              <span>🔧</span>
              Solución de problemas comunes
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              
              {/* Problema: No aparecen dispositivos */}
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="font-semibold text-red-800">❌ "No se encontraron dispositivos compatibles"</p>
                <ul className="mt-2 space-y-1 text-red-700">
                  <li>• Verifica que la impresora esté encendida y conectada por USB</li>
                  <li>• Prueba conectar en otro puerto USB</li>
                  <li>• Usa el botón "Conectar Cualquier Dispositivo"</li>
                  <li>• Reinicia el navegador e intenta de nuevo</li>
                  <li>• En Windows, verifica que aparezca en "Administrador de dispositivos"</li>
                </ul>
              </div>

              {/* Problema: Se conecta pero no imprime */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="font-semibold text-yellow-800">⚠️ Se conecta pero no imprime</p>
                <ul className="mt-2 space-y-1 text-yellow-700">
                  <li>• Verifica que haya papel térmico correctamente colocado</li>
                  <li>• Asegúrate de que sea papel térmico (no papel normal)</li>
                  <li>• Verifica que la impresora soporte comandos ESC/POS</li>
                  <li>• Prueba con velocidad diferente (algunos modelos usan 115200)</li>
                  <li>• Reinicia la impresora desconectándola 10 segundos</li>
                </ul>
              </div>

              {/* Problema: Caracteres extraños */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-800">🔤 Imprime caracteres extraños</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>• La impresora puede no ser compatible con ESC/POS</li>
                  <li>• Verifica el manual de tu impresora</li>
                  <li>• Algunos modelos requieren configuración especial</li>
                  <li>• Intenta con una impresora diferente para probar</li>
                </ul>
              </div>

              {/* Problema: Navegador */}
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="font-semibold text-purple-800">🌐 Problemas con el navegador</p>
                <ul className="mt-2 space-y-1 text-purple-700">
                  <li>• <strong>Solo funciona en Chrome y Edge</strong> (no Firefox, Safari)</li>
                  <li>• Actualiza tu navegador a la última versión</li>
                  <li>• Habilita las características experimentales si es necesario</li>
                  <li>• Permite acceso a dispositivos serie cuando se solicite</li>
                </ul>
              </div>

              {/* Recomendaciones generales */}
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="font-semibold text-green-800">✅ Recomendaciones para mejor funcionamiento</p>
                <ul className="mt-2 space-y-1 text-green-700">
                  <li>• Usa impresoras térmicas de 58mm estándar (Epson TM-T20, Xprinter XP-58)</li>
                  <li>• Conecta directamente por USB (evita hubs USB si es posible)</li>
                  <li>• Mantén el papel térmico en buen estado (no vencido)</li>
                  <li>• Realiza pruebas periódicas para verificar funcionamiento</li>
                  <li>• Ten un rollo de papel de repuesto siempre</li>
                </ul>
              </div>

            </div>
          </details>
        </div>

        {/* Modo detallado para desarrolladores */}
        <div className="mt-4">
          <details className="cursor-pointer">
            <summary className="text-xs text-gray-500 hover:text-gray-700">
              🔬 Información técnica para desarrolladores
            </summary>
            <div className="mt-2 bg-gray-100 p-3 rounded text-xs font-mono">
              <div>Estado: {estado}</div>
              <div>Puerto: {puerto ? 'Conectado' : 'No conectado'}</div>
              <div>Web Serial API: {('serial' in navigator) ? 'Disponible' : 'No disponible'}</div>
              <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}