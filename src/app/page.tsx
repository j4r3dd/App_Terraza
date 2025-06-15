'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const handleMenuClick = () => {
    // Redirigir directamente a la imagen menuu.png que está en la carpeta public/
    const menuImagePath = '/menuu.png' // Esta ruta apunta a public/menuu.png
    window.open(menuImagePath, '_blank')
  }

  const handleEquipoClick = () => {
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-6">
      {/* Logo o título del restaurante */}
      <div className="text-center mb-16">
        <h1 className="text-6xl md:text-7xl font-bold text-amber-800 mb-4">
          Terraza Madero 
        </h1>
      </div>

      {/* Botón principal del MENÚ */}
      <div className="mb-20">
        <button
          onClick={handleMenuClick}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-4xl md:text-5xl font-bold py-8 px-16 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
        >
          📋 MENÚ
        </button>
        <p className="text-center text-amber-700 mt-4 text-lg">
          Ver nuestra carta completa
        </p>
      </div>

      {/* Botón pequeño del EQUIPO */}
      <div className="absolute bottom-8 right-8">
        <button
          onClick={handleEquipoClick}
          className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          👥 Equipo
        </button>
        <p className="text-center text-gray-600 mt-1 text-xs">
          Acceso para personal
        </p>
      </div>
    </main>
  )
}