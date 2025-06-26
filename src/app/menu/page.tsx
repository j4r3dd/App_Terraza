'use client'

import { useRouter } from 'next/navigation'

export default function MenuPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  const handleDownloadPDF = () => {
    // Descargar el PDF directamente
    const link = document.createElement('a')
    link.href = '/menu-terraza-madero.pdf'
    link.download = 'Menu-Terraza-Madero.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      {/* Header con botón de regreso */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md"
          >
            ← Volver al Inicio
          </button>
          
          <h1 className="text-4xl font-bold text-amber-800 text-center flex items-center">
            <span className="text-5xl mr-3">📋</span>
            Nuestro Menú
          </h1>
          
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md"
          >
            📥 Descargar PDF
          </button>
        </div>
      </div>

      {/* Visualizador del PDF */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="relative w-full" style={{ height: '80vh' }}>
          <iframe
            src="/menu-terraza-madero.pdf"
            className="w-full h-full border-0 rounded-lg"
            title="Menú Terraza Madero"
          />
        </div>
        
        {/* Mensaje de fallback por si no se puede mostrar el PDF */}
        <div className="text-center mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-amber-800 font-medium mb-3">
            ¿No puedes ver el menú? 
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleDownloadPDF}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📥 Descargar PDF
            </button>
            <button
              onClick={() => window.open('/menu-terraza-madero.pdf', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔗 Abrir en nueva pestaña
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-amber-700">
        <p className="text-lg font-medium">🍻 Gracias por elegir Terraza Madero 🍻</p>
        <p className="text-sm mt-2">Rooftop Experience</p>
      </div>
    </main>
  )
}