'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-6">
      {/* Logo o título del restaurante */}
      <div className="text-center mb-16">
        <h1 className="text-6xl md:text-7xl font-bold text-amber-800 mb-4">
          Terraza Madero 
        </h1>
        <p className="text-xl text-amber-700 font-medium">
          🍻 Rooftop Experience 🍻
        </p>
      </div>

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
          <p className="text-center text-amber-700 mt-4 text-lg">
            Ver nuestra carta completa
          </p>
        </div>

        {/* Botón de CÓCTELES */}
        <div className="text-center">
          <button
            onClick={handleCoctelesClick}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-3xl md:text-4xl font-bold py-6 px-12 md:py-8 md:px-16 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
          >
            🍹 CÓCTELES
          </button>
          <p className="text-center text-amber-700 mt-4 text-lg">
            Nuestra carta de bebidas especiales
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-center mb-12 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-amber-800 mb-4">¡Bienvenidos!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-amber-700">
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">🍽️</span>
            <h3 className="font-semibold">Comida Deliciosa</h3>
            <p className="text-sm">Platillos frescos y sabrosos</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">🍹</span>
            <h3 className="font-semibold">Bebidas Refrescantes</h3>
            <p className="text-sm">Cocteles y bebidas variadas</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">🌅</span>
            <h3 className="font-semibold">Vista Increíble</h3>
            <p className="text-sm">Experiencia rooftop única</p>
          </div>
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
    </main>
  )
}