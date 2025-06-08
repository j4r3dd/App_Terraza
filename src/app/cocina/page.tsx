import ProtectedRoute from '@/components/ProtectedRoute'

export default function CocinaPage() {
  return (
      <ProtectedRoute allowRoles={['cocina']}>
        <main className="p-6">
          <h1 className="text-2xl font-bold">Panel de Cocina 🍳</h1>
          {/* Aquí irán los botones para gestionar la cocina */}
        </main>
      </ProtectedRoute>
  )
}
