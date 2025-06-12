"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"

type Producto = {
  id: number
  nombre: string
  tipo: "comida" | "bebida"
  precio: number
}

type ProductoEnPedido = {
  id: number
  nombre: string
  tipo: "comida" | "bebida"
  precio: number
  cantidad: number
}

export default function MeseroPage() {
  const [mesa, setMesa] = useState<string | null>(null)
  const [productosComida, setProductosComida] = useState<Producto[]>([])
  const [productosBebida, setProductosBebida] = useState<Producto[]>([])
  const [pedido, setPedido] = useState<ProductoEnPedido[]>([])
  const [mensaje, setMensaje] = useState("")
  const [tipoActivo, setTipoActivo] = useState<"comida" | "bebida">("comida")

  const usuarioRaw = typeof window !== "undefined" ? localStorage.getItem("usuario") : null
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null

  // Cargar productos del menú
  const cargarProductos = async () => {
    const { data } = await supabase.from("productos").select("*").order("nombre")
    if (data) {
      const productos = data as Producto[]
      setProductosComida(productos.filter(p => p.tipo === "comida"))
      setProductosBebida(productos.filter(p => p.tipo === "bebida"))
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  // Agregar producto al pedido
  const agregarAlPedido = (producto: Producto) => {
    const existente = pedido.find(p => p.id === producto.id)
    if (existente) {
      // Si ya existe, aumentar cantidad
      setPedido(pedido.map(p => 
        p.id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ))
    } else {
      // Si no existe, agregarlo
      setPedido([...pedido, { ...producto, cantidad: 1 }])
    }
  }

  // Quitar producto del pedido
  const quitarDelPedido = (id: number) => {
    const existente = pedido.find(p => p.id === id)
    if (existente && existente.cantidad > 1) {
      // Si tiene más de 1, reducir cantidad
      setPedido(pedido.map(p => 
        p.id === id 
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
      ))
    } else {
      // Si tiene 1 o menos, eliminarlo
      setPedido(pedido.filter(p => p.id !== id))
    }
  }

  // Calcular total del pedido
  const calcularTotal = () => {
    return pedido.reduce((total, p) => total + (p.precio * p.cantidad), 0)
  }

  // Enviar pedido
  const enviarPedido = async () => {
    if (!mesa || pedido.length === 0) {
      setMensaje("❌ Selecciona mesa y agrega productos")
      return
    }

    // Agrupar por tipo (comida → cocina, bebida → barra)
    const grupos: Record<"comida" | "bebida", ProductoEnPedido[]> = { comida: [], bebida: [] }
    pedido.forEach((p) => grupos[p.tipo].push(p))

    try {
      for (const [tipoGrupo, items] of Object.entries(grupos) as ["comida" | "bebida", ProductoEnPedido[]][]) {
        if (items.length === 0) continue
        
        const area = tipoGrupo === "comida" ? "cocina" : "barra"
        
        // Convertir a formato para la BD (expandir cantidades)
        const productosParaBD = items.flatMap(item => 
          Array(item.cantidad).fill({
            nombre: item.nombre,
            precio: item.precio
          })
        )
        
        const { error } = await supabase.from("ordenes").insert({
          mesa,
          productos: productosParaBD,
          estado: "pendiente",
          area,
          creado_por: usuario?.id,
        })
        
        if (error) throw error
      }

      // Limpiar formulario
      setPedido([])
      setMesa(null)
      setMensaje("✅ Pedido enviado correctamente")
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(""), 3000)
      
    } catch (error) {
      console.error(error)
      setMensaje("❌ Error al enviar pedido")
    }
  }

  const productosActivos = tipoActivo === "comida" ? productosComida : productosBebida

  return (
    <ProtectedRoute allowRoles={["mesero"]}>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Panel de Mesero 🧾</h1>
          <div className="text-lg font-semibold text-blue-600">
            {mesa ? `${mesa} seleccionada` : "Selecciona una mesa"}
          </div>
        </div>

        {/* Selector de Mesa */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Seleccionar Mesa</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const m = `Mesa ${i + 1}`
              return (
                <button
                  key={m}
                  onClick={() => setMesa(m)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mesa === m 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "bg-white border-2 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Menú */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Menú del Restaurante</h2>
            
            {/* Filtros de tipo */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTipoActivo("comida")}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  tipoActivo === "comida"
                    ? "bg-white shadow-sm text-orange-600"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                🍽️ Comida ({productosComida.length})
              </button>
              <button
                onClick={() => setTipoActivo("bebida")}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  tipoActivo === "bebida"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                🥤 Bebidas ({productosBebida.length})
              </button>
            </div>

            {/* Lista de productos */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {productosActivos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No hay {tipoActivo === "comida" ? "platillos" : "bebidas"} disponibles</p>
                  <p className="text-sm">El admin debe agregar productos al menú</p>
                </div>
              ) : (
                productosActivos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{producto.nombre}</h3>
                      <p className="text-green-600 font-semibold">${producto.precio.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => agregarAlPedido(producto)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel derecho: Pedido actual */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Pedido Actual</h2>
            
            {pedido.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>El pedido está vacío</p>
                <p className="text-sm">Agrega productos del menú</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {pedido.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{item.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          ${item.precio.toFixed(2)} × {item.cantidad} = ${(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => quitarDelPedido(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                        <button
                          onClick={() => agregarAlPedido(item)}
                          className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${calcularTotal().toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Botón enviar */}
            <button
              onClick={enviarPedido}
              disabled={!mesa || pedido.length === 0}
              className={`w-full mt-4 py-3 rounded-lg font-semibold transition-colors ${
                mesa && pedido.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Enviar Pedido
            </button>

            {/* Mensaje */}
            {mensaje && (
              <div className={`mt-3 p-3 rounded-lg text-center font-medium ${
                mensaje.includes("✅") 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {mensaje}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}