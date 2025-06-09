"use client"

import { useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"

type Producto = {
  nombre: string
  tipo: "comida" | "bebida"
  precio: number
}

export default function MeseroPage() {
  const [mesa, setMesa] = useState<string | null>(null)
  const [tipo, setTipo] = useState<"comida" | "bebida">("comida")
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [mensaje, setMensaje] = useState("")

  const usuarioRaw = typeof window !== "undefined" ? localStorage.getItem("usuario") : null
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null

  const addProducto = () => {
    if (!nombre) return
    setProductos([...productos, { nombre, tipo, precio: parseFloat(precio) || 0 }])
    setNombre("")
    setPrecio("")
  }

  const enviarPedido = async () => {
    if (!mesa || productos.length === 0) {
      setMensaje("Seleccione mesa y agregue productos")
      return
    }

    const grupos: Record<"comida" | "bebida", Producto[]> = { comida: [], bebida: [] }
    productos.forEach((p) => grupos[p.tipo].push(p))

    for (const [tipoGrupo, items] of Object.entries(grupos) as ["comida" | "bebida", Producto[]][]) {
      if (items.length === 0) continue
      const area = tipoGrupo === "comida" ? "cocina" : "barra"
      const { error } = await supabase.from("ordenes").insert({
        mesa,
        productos: items,
        estado: "pendiente",
        area,
        creado_por: usuario?.id,
      })
      if (error) {
        console.error(error)
        setMensaje("Error al enviar pedido")
        return
      }
    }

    setProductos([])
    setMesa(null)
    setMensaje("Pedido enviado")
  }

  return (
    <ProtectedRoute allowRoles={["mesero"]}>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Panel de Mesero 🧾</h1>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const m = `Mesa ${i + 1}`
            return (
              <button
                key={m}
                onClick={() => setMesa(m)}
                className={`px-3 py-2 rounded ${mesa === m ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {m}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as "comida" | "bebida")} className="border p-2 rounded">
              <option value="comida">Comida</option>
              <option value="bebida">Bebida</option>
            </select>
            <input type="text" placeholder="Producto" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border p-2 rounded" />
            <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} className="border p-2 rounded w-24" />
            <button onClick={addProducto} className="bg-green-600 text-white px-3 py-2 rounded">
              Agregar
            </button>
          </div>

          <ul className="list-disc pl-5">
            {productos.map((p, i) => (
              <li key={i}>
                {p.nombre} - {p.tipo} - ${p.precio.toFixed(2)}
              </li>
            ))}
          </ul>

          <button onClick={enviarPedido} className="bg-blue-600 text-white px-4 py-2 rounded">
            Enviar pedido
          </button>
          {mensaje && <p>{mensaje}</p>}
        </div>
      </main>
    </ProtectedRoute>
  )
}
