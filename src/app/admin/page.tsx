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

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"comida" | "bebida">("comida")
  const [precio, setPrecio] = useState("")

  const obtenerProductos = async () => {
    const { data } = await supabase.from("productos").select("*").order("id")
    if (data) setProductos(data as Producto[])
  }

  useEffect(() => {
    obtenerProductos()
  }, [])

  const agregarProducto = async () => {
    if (!nombre) return
    const { data, error } = await supabase
      .from("productos")
      .insert({ nombre, tipo, precio: parseFloat(precio) || 0 })
      .select()
      .single()
    if (!error && data) {
      setProductos([...productos, data as Producto])
      setNombre("")
      setPrecio("")
    }
  }

  const eliminarProducto = async (id: number) => {
    const { error } = await supabase.from("productos").delete().eq("id", id)
    if (!error) {
      setProductos(productos.filter((p) => p.id !== id))
    }
  }

  const cambiarPrecio = async (id: number, nuevo: number) => {
    const { error } = await supabase
      .from("productos")
      .update({ precio: nuevo })
      .eq("id", id)
    if (!error) {
      setProductos((ps) => ps.map((p) => (p.id === id ? { ...p, precio: nuevo } : p)))
    }
  }

  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Panel de Admin 🍻</h1>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "comida" | "bebida")}
            className="border p-2 rounded"
          >
            <option value="comida">Comida</option>
            <option value="bebida">Bebida</option>
          </select>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="border p-2 rounded w-24"
          />
          <button onClick={agregarProducto} className="bg-green-600 text-white px-3 py-2 rounded">
            Agregar
          </button>
        </div>

        <ul className="space-y-2">
          {productos.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="flex-1">
                {p.nombre} ({p.tipo})
              </span>
              <input
                type="number"
                defaultValue={p.precio}
                onBlur={(e) => cambiarPrecio(p.id, parseFloat(e.target.value) || 0)}
                className="border p-1 rounded w-24"
              />
              <button
                onClick={() => eliminarProducto(p.id)}
                className="bg-red-600 text-white px-2 py-1 rounded"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </main>
    </ProtectedRoute>
  )
}
