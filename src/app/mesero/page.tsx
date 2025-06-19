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
  const [busqueda, setBusqueda] = useState("")
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false) // Nuevo estado para confirmación

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

  // Reiniciar confirmación cuando cambia el pedido
  useEffect(() => {
    setPedidoConfirmado(false)
  }, [pedido, mesa])

  // Agregar producto al pedido
  const agregarAlPedido = (producto: Producto) => {
    const existente = pedido.find(p => p.id === producto.id)
    if (existente) {
      setPedido(pedido.map(p => 
        p.id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ))
    } else {
      setPedido([...pedido, { ...producto, cantidad: 1 }])
    }
    
    // Limpiar búsqueda después de agregar
    setBusqueda("")
  }

  // Quitar producto del pedido
  const quitarDelPedido = (id: number) => {
    const existente = pedido.find(p => p.id === id)
    if (existente && existente.cantidad > 1) {
      setPedido(pedido.map(p => 
        p.id === id 
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
      ))
    } else {
      setPedido(pedido.filter(p => p.id !== id))
    }
  }

  // Calcular total del pedido
  const calcularTotal = () => {
    return pedido.reduce((total, p) => total + (p.precio * p.cantidad), 0)
  }

  // Confirmar pedido con la mesa
  const confirmarPedido = () => {
    setPedidoConfirmado(true)
    setMensaje("✅ Pedido confirmado con la mesa. Ahora puedes enviarlo.")
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setMensaje(""), 3000)
  }

  // Enviar pedido (solo después de confirmación)
  const enviarPedido = async () => {
    if (!mesa || pedido.length === 0 || !pedidoConfirmado) {
      setMensaje("❌ Confirma primero el pedido con la mesa")
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
      setBusqueda("")
      setPedidoConfirmado(false)
      setMensaje("✅ Pedido enviado correctamente")
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(""), 3000)
      
    } catch (error) {
      console.error(error)
      setMensaje("❌ Error al enviar pedido")
    }
  }

  // Filtrar productos por búsqueda
  const filtrarProductos = (productos: Producto[]) => {
    if (!busqueda.trim()) return productos
    
    return productos.filter(producto => 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
  }

  // Obtener productos filtrados
  const productosActivos = tipoActivo === "comida" ? productosComida : productosBebida
  const productosFiltrados = filtrarProductos(productosActivos)

  // Función para resaltar texto de búsqueda
  const resaltarTexto = (texto: string, busqueda: string) => {
    if (!busqueda.trim()) return texto
    
    const regex = new RegExp(`(${busqueda})`, 'gi')
    const partes = texto.split(regex)
    
    return partes.map((parte, index) => 
      regex.test(parte) ? (
        <span key={index} className="bg-yellow-200 font-bold">{parte}</span>
      ) : (
        parte
      )
    )
  }

  return (
    <ProtectedRoute allowRoles={["mesero"]}>
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-mesero-gradient text-white p-3 rounded-full text-2xl">
                🧾
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Panel de Mesero</h1>
                <p className="text-gray-600">Gestión de pedidos y mesas</p>
              </div>
            </div>
            <div className="text-right">
              {mesa ? (
                <div className="bg-mesero-gradient text-white px-4 py-2 rounded-lg font-bold text-lg">
                  {mesa} ✓
                </div>
              ) : (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium border-2 border-yellow-300">
                  Selecciona una mesa
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Mesa */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🪑</span>
            Seleccionar Mesa
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => {
              const m = `Mesa ${i + 1}`
              return (
                <button
                  key={m}
                  onClick={() => setMesa(m)}
                  className={`p-4 rounded-xl font-bold text-lg transition-all duration-200 hover-scale ${
                    mesa === m 
                      ? "bg-mesero-gradient text-white shadow-lg scale-105" 
                      : "bg-gray-100 border-2 border-gray-300 text-gray-700 hover:border-green-400"
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Panel izquierdo: Menú */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200">
            <div className="p-6 border-b-2 border-green-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="text-2xl mr-2">📋</span>
                Menú del Restaurante
              </h2>
            </div>
            
            {/* Filtros de tipo */}
            <div className="p-6 pb-4">
              <div className="flex bg-gray-100 rounded-xl p-2 mb-4">
                <button
                  onClick={() => setTipoActivo("comida")}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                    tipoActivo === "comida"
                      ? "bg-orange-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                  }`}
                >
                  🍽️ Comida ({productosComida.length})
                </button>
                <button
                  onClick={() => setTipoActivo("bebida")}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                    tipoActivo === "bebida"
                      ? "bg-blue-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  🥤 Bebidas ({productosBebida.length})
                </button>
              </div>

              {/* Barra de búsqueda */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xl">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder={`Buscar ${tipoActivo === "comida" ? "platillos" : "bebidas"}...`}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors duration-200 text-lg"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-xl">❌</span>
                  </button>
                )}
              </div>
              
              {/* Indicador de resultados de búsqueda */}
              {busqueda && (
                <div className="mt-2 text-sm text-gray-600">
                  {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''} 
                  {productosFiltrados.length > 0 ? ' encontrado' : ''}{productosFiltrados.length > 1 ? 's' : ''}
                  {busqueda && ` para "${busqueda}"`}
                </div>
              )}
            </div>

            {/* Lista de productos */}
            <div className="px-6 pb-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {productosFiltrados.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">
                      {busqueda ? "🔍" : "📦"}
                    </div>
                    {busqueda ? (
                      <>
                        <p className="text-xl font-medium">No se encontraron resultados</p>
                        <p className="text-sm">Intenta con otro término de búsqueda</p>
                        <button
                          onClick={() => setBusqueda("")}
                          className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Limpiar búsqueda
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-medium">No hay {tipoActivo === "comida" ? "platillos" : "bebidas"} disponibles</p>
                        <p className="text-sm">El admin debe agregar productos al menú</p>
                      </>
                    )}
                  </div>
                ) : (
                  productosFiltrados.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-green-300"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">
                          {resaltarTexto(producto.nombre, busqueda)}
                        </h3>
                        <p className="text-green-600 font-bold text-xl">${producto.precio.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => agregarAlPedido(producto)}
                        className="btn-mesero hover-scale"
                      >
                        Agregar +
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho: Pedido actual */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200">
            <div className="p-6 border-b-2 border-green-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="text-2xl mr-2">🛒</span>
                Pedido Actual
                {pedido.length > 0 && (
                  <span className="ml-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    {pedido.length} {pedido.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </h2>
            </div>
            
            <div className="p-6">
              {pedido.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl font-medium">El pedido está vacío</p>
                  <p className="text-sm">Agrega productos del menú</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {pedido.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">{item.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            ${item.precio.toFixed(2)} × {item.cantidad} = 
                            <span className="font-bold text-green-600 ml-1">
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => quitarDelPedido(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 shadow-md"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-lg text-gray-800">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => agregarAlPedido(item)}
                            className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 shadow-md"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-green-200 pt-6">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl">
                      <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Total:</span>
                        <span>${calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicador de estado de confirmación */}
                  {pedidoConfirmado && (
                    <div className="mt-4 bg-blue-100 border-2 border-blue-300 text-blue-800 p-3 rounded-xl text-center font-medium">
                      ✅ Pedido confirmado con la mesa
                    </div>
                  )}
                </>
              )}

              {/* Botón de acción (confirmación o envío) */}
              <button
                onClick={pedidoConfirmado ? enviarPedido : confirmarPedido}
                disabled={!mesa || pedido.length === 0}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                  mesa && pedido.length > 0
                    ? pedidoConfirmado
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:scale-105 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:scale-105 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {mesa && pedido.length > 0 ? (
                  <div className="flex items-center justify-center">
                    {pedidoConfirmado ? (
                      <>
                        <span className="text-2xl mr-2">🚀</span>
                        Enviar Pedido
                      </>
                    ) : (
                      <>
                        <span className="text-2xl mr-2">✋</span>
                        Confirmar con la Mesa
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    {!mesa ? "Selecciona una mesa" : "Agrega productos"}
                  </div>
                )}
              </button>

              {/* Mensaje */}
              {mensaje && (
                <div className={`mt-4 p-4 rounded-xl text-center font-bold text-lg fade-in ${
                  mensaje.includes("✅") 
                    ? "bg-green-100 text-green-800 border-2 border-green-300" 
                    : "bg-red-100 text-red-800 border-2 border-red-300"
                }`}>
                  {mensaje}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}