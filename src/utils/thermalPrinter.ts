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
 * Solicita acceso a puerto serie para impresora CON filtros de fabricante
 */
export async function solicitarAccesoImpresoraConFiltros(): Promise<SerialPort> {
  if ('serial' in navigator && navigator.serial) {
    try {
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x04b8 }, // Epson
          { usbVendorId: 0x0519 }, // Citizen
          { usbVendorId: 0x20d1 }, // Generic thermal printers
          { usbVendorId: 0x0483 }, // STMicroelectronics
          { usbVendorId: 0x0fe6 }, // ICS Advent
          { usbVendorId: 0x1504 }, // Xprinter
          { usbVendorId: 0x0416 }, // Winbond Electronics
        ]
      })
      return port
    } catch (error) {
      console.error('Error al solicitar acceso a impresora:', error)
      throw new Error('No se encontraron dispositivos compatibles o se canceló la selección')
    }
  }
  throw new Error('Web Serial API no soportada')
}

/**
 * Solicita acceso a puerto serie para impresora SIN filtros (cualquier dispositivo)
 */
export async function solicitarAccesoImpresora(): Promise<SerialPort> {
  if ('serial' in navigator && navigator.serial) {
    try {
      // Sin filtros para permitir cualquier dispositivo serie
      const port = await navigator.serial.requestPort()
      return port
    } catch (error) {
      console.error('Error al solicitar acceso a impresora:', error)
      throw error
    }
  }
  throw new Error('Web Serial API no soportada')
}

/**
 * Genera un ticket de prueba
 */
function generarTicketPrueba(): string {
  let ticket = ''
  
  ticket += COMMANDS.INIT
  ticket += COMMANDS.ALIGN_CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += 'PRUEBA DE IMPRESION\n'
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  ticket += '================================\n'
  ticket += COMMANDS.ALIGN_LEFT
  
  ticket += 'Fecha: ' + new Date().toLocaleString('es-MX') + '\n'
  ticket += '--------------------------------\n'
  
  ticket += 'Si puedes leer esto,\n'
  ticket += 'la impresora esta funcionando\n'
  ticket += 'correctamente!\n'
  ticket += '\n'
  
  ticket += COMMANDS.ALIGN_CENTER
  ticket += '================================\n'
  ticket += 'Configuracion exitosa\n'
  ticket += '\n\n'
  
  ticket += COMMANDS.PAPER_CUT
  
  return ticket
}

/**
 * Prueba la conexión con la impresora
 */
export async function probarConexionImpresora(): Promise<void> {
  try {
    // Intenta obtener un puerto ya autorizado
    const ports = await navigator.serial.getPorts()
    
    if (ports.length === 0) {
      // Si no hay puertos, solicita uno nuevo
      const port = await solicitarAccesoImpresora()
      const ticketData = generarTicketPrueba()
      await imprimirEnImpresora(port, ticketData)
    } else {
      // Usa el primer puerto disponible
      const ticketData = generarTicketPrueba()
      await imprimirEnImpresora(ports[0], ticketData)
    }
  } catch (error) {
    console.error('Error en prueba de impresión:', error)
    throw error
  }
}

/**
 * Envía datos a la impresora térmica
 */
export async function imprimirEnImpresora(port: SerialPort, data: string): Promise<void> {
  try {
    // Verifica si el puerto ya está abierto
    if (!port.readable || !port.writable) {
      await port.open({ baudRate: 9600 })
    }
    
    const writer = port.writable?.getWriter()
    if (!writer) {
      throw new Error('No se pudo obtener el writer del puerto')
    }
    
    const encoder = new TextEncoder()
    
    await writer.write(encoder.encode(data))
    
    writer.releaseLock()
    
    // Solo cierra si el puerto estaba cerrado antes
    if (port.readable && port.writable) {
      await port.close()
    }
    
  } catch (error) {
    console.error('Error al imprimir:', error)
    throw error
  }
}

/**
 * Función principal para imprimir ticket
 */
export async function imprimirTicket(orden: Orden): Promise<void> {
  try {
    // Primero intenta usar un puerto ya autorizado
    const ports = await navigator.serial.getPorts()
    
    if (ports.length > 0) {
      // Usa el primer puerto disponible
      const ticketData = generarTicketCuenta(orden)
      await imprimirEnImpresora(ports[0], ticketData)
    } else {
      // Si no hay puertos, solicita uno nuevo
      const port = await solicitarAccesoImpresora()
      const ticketData = generarTicketCuenta(orden)
      await imprimirEnImpresora(port, ticketData)
    }
  } catch (error) {
    console.error('Error en impresión:', error)
    throw error
  }
}

/**
 * Función para imprimir reporte de cierre
 */
export async function imprimirReporteCierre(ventas: VentasDelDia): Promise<void> {
  try {
    // Primero intenta usar un puerto ya autorizado
    const ports = await navigator.serial.getPorts()
    
    if (ports.length > 0) {
      // Usa el primer puerto disponible
      const ticketData = generarTicketCierre(ventas)
      await imprimirEnImpresora(ports[0], ticketData)
    } else {
      // Si no hay puertos, solicita uno nuevo
      const port = await solicitarAccesoImpresora()
      const ticketData = generarTicketCierre(ventas)
      await imprimirEnImpresora(port, ticketData)
    }
  } catch (error) {
    console.error('Error en impresión de reporte:', error)
    throw error
  }
}