// src/utils/thermalPrinter.ts

/**
 * Utilidades para impresoras térmicas ESC/POS de 58mm
 * Compatible con impresoras que soporten comandos ESC/POS estándar
 */

// Comandos ESC/POS básicos
const ESC = '\x1b'
const GS = '\x1d'

export const COMMANDS = {
  // Inicialización
  INIT: ESC + '@',
  
  // Alineación
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // Formato de texto
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  DOUBLE_HEIGHT: ESC + '!' + '\x10',
  NORMAL_SIZE: ESC + '!' + '\x00',
  
  // Líneas y espacios
  LINE_FEED: '\n',
  PAPER_CUT: GS + 'V' + '\x42' + '\x00',
  
  // Código de barras
  BARCODE_HEIGHT: GS + 'h' + '\x50', // 80 puntos de altura
  BARCODE_WIDTH: GS + 'w' + '\x02',  // Ancho medio
  BARCODE_PRINT: GS + 'k',
  
  // Apertura de cajón (si está conectado)
  OPEN_DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xfa'
}

export interface Orden {
  id: number
  mesa: string
  productos: { nombre: string; precio: number }[]
  total: number
  metodo_pago?: string
  created_at: string
  pagado_at?: string
}

export interface VentasDelDia {
  fecha: string
  total_efectivo: number
  total_tarjeta: number
  total_general: number
  ordenes_pagadas: number
}

/**
 * Genera el texto formateado para imprimir una cuenta
 */
export function generarTicketCuenta(orden: Orden): string {
  const fecha = new Date(orden.created_at).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  let ticket = ''
  
  // Encabezado del restaurante
  ticket += COMMANDS.INIT
  ticket += COMMANDS.ALIGN_CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += 'TERRAZA MADERO\n'
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  ticket += '================================\n'
  ticket += COMMANDS.ALIGN_LEFT
  
  // Información de la orden
  ticket += `Fecha: ${fecha}\n`
  ticket += `${orden.mesa}\n`
  ticket += `Orden #${orden.id}\n`
  ticket += '--------------------------------\n'
  
  // Productos
  ticket += COMMANDS.BOLD_ON
  ticket += 'DESCRIPCION          IMPORTE\n'
  ticket += COMMANDS.BOLD_OFF
  ticket += '--------------------------------\n'
  
  orden.productos.forEach(producto => {
    const nombre = producto.nombre.substring(0, 20).padEnd(20)
    const precio = `$${producto.precio.toFixed(2)}`.padStart(8)
    ticket += `${nombre}${precio}\n`
  })
  
  ticket += '--------------------------------\n'
  
  // Total
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += `TOTAL:              $${orden.total.toFixed(2)}\n`
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  
  // Método de pago (si está pagado)
  if (orden.metodo_pago) {
    ticket += '--------------------------------\n'
    ticket += `Metodo de pago: ${orden.metodo_pago.toUpperCase()}\n`
    if (orden.pagado_at) {
      const fechaPago = new Date(orden.pagado_at).toLocaleString('es-MX')
      ticket += `Pagado: ${fechaPago}\n`
    }
    ticket += COMMANDS.ALIGN_CENTER
    ticket += COMMANDS.BOLD_ON
    ticket += '*** PAGADO ***\n'
    ticket += COMMANDS.BOLD_OFF
    ticket += COMMANDS.ALIGN_LEFT
  }
  
  // Pie de página
  ticket += '\n'
  ticket += COMMANDS.ALIGN_CENTER
  ticket += '================================\n'
  ticket += 'Gracias por su visita\n'
  ticket += 'Vuelva pronto\n'
  ticket += '\n\n'
  
  // Corte de papel
  ticket += COMMANDS.PAPER_CUT
  
  return ticket
}

/**
 * Genera ticket de cierre de caja
 */
export function generarTicketCierre(ventas: VentasDelDia): string {
  const fecha = new Date().toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  let ticket = ''
  
  ticket += COMMANDS.INIT
  ticket += COMMANDS.ALIGN_CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += 'TERRAZA MADERO\n'
  ticket += COMMANDS.NORMAL_SIZE
  ticket += '================================\n'
  ticket += 'REPORTE DE VENTAS\n'
  ticket += COMMANDS.BOLD_OFF
  ticket += `${fecha}\n`
  ticket += '================================\n'
  ticket += COMMANDS.ALIGN_LEFT
  
  // Resumen de ventas
  ticket += COMMANDS.BOLD_ON
  ticket += 'RESUMEN DEL DIA:\n'
  ticket += COMMANDS.BOLD_OFF
  ticket += '--------------------------------\n'
  
  ticket += `Ordenes procesadas: ${ventas.ordenes_pagadas}\n`
  ticket += '--------------------------------\n'
  
  // Desglose por método de pago
  ticket += COMMANDS.BOLD_ON
  ticket += 'POR METODO DE PAGO:\n'
  ticket += COMMANDS.BOLD_OFF
  ticket += '--------------------------------\n'
  
  ticket += `Efectivo:          $${ventas.total_efectivo.toFixed(2)}\n`
  ticket += `Tarjeta:           $${ventas.total_tarjeta.toFixed(2)}\n`
  ticket += '--------------------------------\n'
  
  // Total general
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += `TOTAL GENERAL:     $${ventas.total_general.toFixed(2)}\n`
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  
  ticket += '\n'
  ticket += COMMANDS.ALIGN_CENTER
  ticket += '================================\n'
  ticket += 'Fin del reporte\n'
  ticket += '\n\n'
  
  ticket += COMMANDS.PAPER_CUT
  
  return ticket
}

/**
 * Detecta si hay impresoras disponibles via Web Serial API
 */
export async function detectarImpresoras(): Promise<boolean> {
  if ('serial' in navigator && navigator.serial) {
    try {
      const ports = await navigator.serial.getPorts()
      return ports.length > 0
    } catch (error) {
      console.log('Web Serial API no disponible:', error)
      return false
    }
  }
  return false
}

/**
 * Solicita acceso a puerto serie para impresora - VERSION MEJORADA
 * Ahora sin filtros restrictivos para detectar más dispositivos
 */
export async function solicitarAccesoImpresora(): Promise<SerialPort> {
  if (!('serial' in navigator) || !navigator.serial) {
    throw new Error('Web Serial API no soportada en este navegador')
  }

  try {
    // Primero intentamos sin filtros para mostrar TODOS los dispositivos serie
    console.log('Solicitando acceso a dispositivo serie...')
    
    const port = await navigator.serial.requestPort()
    console.log('Puerto serie obtenido:', port)
    
    return port
    
  } catch (error: any) {
    console.error('Error al solicitar acceso a impresora:', error)
    
    if (error.name === 'NotFoundError') {
      throw new Error('No se seleccionó ningún dispositivo. Asegúrate de seleccionar tu impresora en el diálogo.')
    } else if (error.name === 'SecurityError') {
      throw new Error('Acceso denegado. Verifica los permisos del navegador.')
    } else if (error.name === 'InvalidStateError') {
      throw new Error('Web Serial API no está disponible. Usa Chrome o Edge.')
    }
    
    throw error
  }
}

/**
 * Función alternativa para solicitar con filtros específicos
 */
export async function solicitarAccesoImpresoraConFiltros(): Promise<SerialPort> {
  if (!('serial' in navigator) || !navigator.serial) {
    throw new Error('Web Serial API no soportada')
  }

  try {
    console.log('Solicitando acceso con filtros de impresoras conocidas...')
    
    const port = await navigator.serial.requestPort({
      filters: [
        // Fabricantes comunes de impresoras térmicas
        { usbVendorId: 0x04b8 }, // Epson
        { usbVendorId: 0x0519 }, // Citizen Systems
        { usbVendorId: 0x20d1 }, // Xprinter
        { usbVendorId: 0x0fe6 }, // Generic thermal printers
        { usbVendorId: 0x1fc9 }, // NXP/Generic
        { usbVendorId: 0x067b }, // Prolific (adaptadores USB-Serie)
        { usbVendorId: 0x10c4 }, // Silicon Labs (adaptadores USB-Serie)
        { usbVendorId: 0x0403 }, // FTDI (adaptadores USB-Serie)
        { usbVendorId: 0x1a86 }, // QinHeng Electronics
        { usbVendorId: 0x2e18 }, // Generic POS devices
      ]
    })
    
    console.log('Puerto serie con filtros obtenido:', port)
    return port
    
  } catch (error: any) {
    console.error('Error con filtros:', error)
    
    // Si falla con filtros, intentamos sin filtros
    console.log('Reintentando sin filtros...')
    return await solicitarAccesoImpresora()
  }
}

/**
 * Envía datos a la impresora térmica con mejor manejo de errores
 */
export async function imprimirEnImpresora(port: SerialPort, data: string): Promise<void> {
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  
  try {
    console.log('Abriendo puerto serie...')
    
    // Configuración estándar para impresoras térmicas
    await port.open({ 
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none'
    })
    
    console.log('Puerto abierto, obteniendo writer...')
    
    if (!port.writable) {
      throw new Error('El puerto no es escribible')
    }
    
    writer = port.writable.getWriter()
    console.log('Writer obtenido, enviando datos...')
    
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(data)
    
    console.log(`Enviando ${encodedData.length} bytes a la impresora...`)
    await writer.write(encodedData)
    
    console.log('Datos enviados correctamente')
    
  } catch (error: any) {
    console.error('Error detallado al imprimir:', error)
    
    if (error.name === 'NetworkError') {
      throw new Error('Error de comunicación con la impresora. Verifica la conexión.')
    } else if (error.name === 'InvalidStateError') {
      throw new Error('La impresora no está lista. Verifica que esté encendida.')
    } else if (error.message.includes('Access denied')) {
      throw new Error('Acceso denegado a la impresora. Reconecta el dispositivo.')
    }
    
    throw new Error(`Error de impresión: ${error.message}`)
    
  } finally {
    try {
      if (writer) {
        console.log('Liberando writer...')
        writer.releaseLock()
      }
      
      if (port.readable || port.writable) {
        console.log('Cerrando puerto...')
        await port.close()
      }
    } catch (closeError) {
      console.warn('Error al cerrar puerto:', closeError)
    }
  }
}

/**
 * Función principal para imprimir ticket con mejor manejo de errores
 */
export async function imprimirTicket(orden: Orden): Promise<void> {
  try {
    console.log('Iniciando proceso de impresión para orden:', orden.id)
    
    // Usar la función mejorada para solicitar acceso
    const port = await solicitarAccesoImpresoraConFiltros()
    
    // Generar contenido del ticket
    const ticketData = generarTicketCuenta(orden)
    console.log('Ticket generado, enviando a impresora...')
    
    // Enviar a impresora
    await imprimirEnImpresora(port, ticketData)
    
    console.log('Impresión completada exitosamente')
    
  } catch (error: any) {
    console.error('Error en impresión de ticket:', error)
    throw error
  }
}

/**
 * Función para imprimir reporte de cierre con mejor manejo de errores
 */
export async function imprimirReporteCierre(ventas: VentasDelDia): Promise<void> {
  try {
    console.log('Iniciando impresión de reporte de cierre')
    
    const port = await solicitarAccesoImpresoraConFiltros()
    const ticketData = generarTicketCierre(ventas)
    
    console.log('Reporte generado, enviando a impresora...')
    await imprimirEnImpresora(port, ticketData)
    
    console.log('Reporte impreso exitosamente')
    
  } catch (error: any) {
    console.error('Error en impresión de reporte:', error)
    throw error
  }
}

/**
 * Función de prueba para verificar conectividad
 */
export async function probarConexionImpresora(): Promise<void> {
  try {
    console.log('Iniciando prueba de conexión...')
    
    const port = await solicitarAccesoImpresora()
    
    // Datos de prueba simples
    let testData = COMMANDS.INIT
    testData += COMMANDS.ALIGN_CENTER
    testData += COMMANDS.BOLD_ON
    testData += 'PRUEBA DE CONEXION\n'
    testData += COMMANDS.BOLD_OFF
    testData += COMMANDS.ALIGN_LEFT
    testData += 'Si ves este texto,\n'
    testData += 'la impresora funciona correctamente.\n'
    testData += '\n'
    testData += `Fecha: ${new Date().toLocaleString('es-MX')}\n`
    testData += '\n\n'
    testData += COMMANDS.PAPER_CUT
    
    await imprimirEnImpresora(port, testData)
    console.log('Prueba de conexión exitosa')
    
  } catch (error) {
    console.error('Error en prueba de conexión:', error)
    throw error
  }
}