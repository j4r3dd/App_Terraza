import ProtectedRoute from '@/components/ProtectedRoute'

export default function MeseroPage() {
  return (
    <ProtectedRoute allowRoles={['cocina']}>
      <main className="p-6">
        <h1 className="text-2xl font-bold">Panel de Mesero 🧾</h1>
        {/* Aquí irán los botones para tomar órdenes */}
      </main>
    </ProtectedRoute>
  )
}
