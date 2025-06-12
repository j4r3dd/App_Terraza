'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function MenuPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      {/* Header con botón de regreso */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            ← Volver al Inicio
          </button>
          <h1 className="text-3xl font-bold text-amber-800">
            📋 Nuestro Menú
          </h1>
          <div></div> {/* Spacer para centrar el título */}
        </div>
      </div>

      {/* Imagen del menú */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4">
        <div className="relative w-full h-auto">
          <Image
            src="https://raw.githubusercontent.com/j4r3dd/App_Terraza/main/menu.png"
            alt="Menú del restaurante"
            width={800}
            height={1200}
            className="w-full h-auto rounded-lg"
            priority
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-gray-600">
        <p>🍻 Gracias por elegir nuestro restaurante</p>
      </div>
    </main>
  )
}