'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  const handleMenuClick = () => {
    // Opción 1: Abrir imagen directamente (descomenta la línea de abajo)
    // window.open('/menu.png', '_blank')
    
    // Opción 2: Ir a la página del menú (recomendado)
    router.push('/menu')
  }

  const handleEquipoClick = () => {
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-6">
      {/* Logo o título del restaurante */}
      <div className="text-center mb-16">
        <h1 className="text-6xl md:text-7xl font-bold text-amber-800 mb-4">
          🍻 Bar & Grill
        </h1>
        <p className="text-xl text-amber-700 font-medium">
          Bienvenido a nuestro restaurante
        </p>
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

      {/* Decoración adicional */}
      <div className="absolute top-8 left-8 text-6xl animate-bounce">
        🍔
      </div>
      <div className="absolute top-16 right-12 text-5xl animate-pulse">
        🍕
      </div>
      <div className="absolute bottom-20 left-12 text-4xl animate-bounce">
        🥤
      </div>
    </main>
  )
}