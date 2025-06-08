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

export default function CajaPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])

  const obtenerOrdenes = async () => {
    const { data } = await supabase.from("ordenes").select("*").order("created_at", { ascending: false })
    if (data) setOrdenes(data as Orden[])
  }

  useEffect(() => {
    obtenerOrdenes()
  }, [])

  const marcarPagado = async (id: number) => {
    const { error } = await supabase.from("ordenes").update({ estado: "pagado" }).eq("id", id)
    if (!error) {
      setOrdenes((o) => o.map((ord) => (ord.id === id ? { ...ord, estado: "pagado" } : ord)))
    }
  }

  const ordenesPorMesa = ordenes.reduce<Record<string, Orden[]>>((acc, ord) => {
    if (!acc[ord.mesa]) acc[ord.mesa] = []
    acc[ord.mesa].push(ord)
    return acc
  }, {})

  const totalMesa = (lista: Orden[]) =>
    lista.reduce(
      (sum, ord) => sum + ord.productos.reduce((s, p) => s + (p.precio || 0), 0),
      0
    )

  return (
    <ProtectedRoute allowRoles={["caja"]}>
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Caja</h1>
        <div className="space-y-6">
          {Object.entries(ordenesPorMesa).map(([mesa, lista]) => (
            <div key={mesa} className="border p-3 rounded">
              <h2 className="font-semibold mb-2">
                {mesa} - Total ${totalMesa(lista).toFixed(2)}
              </h2>
              {lista.map((o) => (
                <div key={o.id} className="mb-2 border p-2 rounded">
                  <p>
                    Orden #{o.id} - {o.estado}
                  </p>
                  <ul className="list-disc pl-5">
                    {o.productos.map((p, i) => (
                      <li key={i}>
                        {p.nombre} - ${p.precio}
                      </li>
                    ))}
                  </ul>
                  {o.estado !== "pagado" && (
                    <button
                      onClick={() => marcarPagado(o.id)}
                      className="mt-1 bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Marcar pagado
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  )
}
