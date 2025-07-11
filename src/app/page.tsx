'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CarouselBanner from '@/components/CarouselBanner'
import LocationModal from '@/components/LocationModal'

export default function Home() {
  const router = useRouter()
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const handleMenuClick = () => {
    const menuPdfPath = '/menu-terraza-madero.pdf'
    window.open(menuPdfPath, '_blank')
  }

  const handleCoctelesClick = () => {
    const coctelesPdfPath = '/cocteles_madero.pdf'
    window.open(coctelesPdfPath, '_blank')
  }

  const handleEquipoClick = () => {
    router.push('/login')
  }

  const handleLocationClick = () => {
    setIsLocationModalOpen(true)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: 'url(/fondo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <CarouselBanner />

      {/* Botones principales */}
      <div className="flex flex-col md:flex-row gap-8 mb-20">
        {/* Botón del MENÚ */}
        <div className="text-center">
          <button
            onClick={handleMenuClick}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-3xl md:text-4xl font-bold py-6 px-12 md:py-8 md:px-16 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
          >
            📋 NUESTRO MENÚ
          </button>

        </div>

        {/* Botón de CÓCTELES */}
        <div className="text-center">
          <button
            onClick={handleCoctelesClick}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-3xl md:text-4xl font-bold py-6 px-12 md:py-8 md:px-16 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
          >
            🍹 CÓCTELES
          </button>
        </div>

        {/* Botón de UBICACIÓN Y HORARIO */}
        <div className="text-center">
          <button
            onClick={handleLocationClick}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-3xl md:text-4xl font-bold py-6 px-12 md:py-8 md:px-16 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
          >
            📍 UBICACIÓN Y HORARIO
          </button>
        </div>
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

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </main>
  )
}