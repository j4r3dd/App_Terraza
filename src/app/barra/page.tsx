"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { supabase } from "../../../supabase/client"

interface Orden {
  id: number
  mesa: string
  productos: { nombre: string; precio: number }[]
  estado: string
}

export default function BarraPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])

  const obtenerOrdenes = async () => {
    const { data } = await supabase
      .from("ordenes")
      .select("*")
      .eq("area", "barra")
      .order("created_at", { ascending: false })
    if (data) setOrdenes(data as Orden[])
  }

  useEffect(() => {
    obtenerOrdenes()
  }, [])

  const marcarListo = async (id: number) => {
    const { error } = await supabase
      .from("ordenes")
      .update({ estado: "listo" })
      .eq("id", id)
    if (!error) {
      setOrdenes((o) => o.map((ord) => (ord.id === id ? { ...ord, estado: "listo" } : ord)))
    }
  }

  return (
    <ProtectedRoute allowRoles={["barman"]}>
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Órdenes de Barra</h1>
        <div className="space-y-4">
          {ordenes.map((o) => (
            <div key={o.id} className="border p-3 rounded">
              <h2 className="font-semibold">
                {o.mesa} - {o.estado}
              </h2>
              <ul className="list-disc pl-5">
                {o.productos.map((p, i) => (
                  <li key={i}>
                    {p.nombre} - ${p.precio}
                  </li>
                ))}
              </ul>
              {o.estado === "pendiente" && (
                <button
                  onClick={() => marcarListo(o.id)}
                  className="mt-2 bg-green-600 text-white px-2 py-1 rounded"
                >
                  Marcar listo
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  )
}