'use client'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
}

const LocationModal = ({ isOpen, onClose }: LocationModalProps) => {
  const address = "Av. Madero 719, col. Centro, Morelia, Michoacán"
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📍 Ubicación y Horario</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">🕐 Horario de Atención</h3>
              <p className="text-blue-700 text-lg">
                Miércoles a Domingo de 12:00 PM a 3:00 AM
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">📍 Ubicación</h3>
              <p className="text-green-700 text-lg mb-3">
                Morelia, Michoacán<br />
                Av. Madero 719, col. Centro
              </p>
              
              <div className="bg-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center h-48 bg-gray-300 rounded-lg mb-3">
                  <span className="text-gray-500 text-lg">🗺️ Mapa</span>
                </div>
                <button
                  onClick={() => window.open(googleMapsUrl, '_blank')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>🌐</span>
                  Abrir en Google Maps
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">ℹ️ Información Adicional</h3>
              <p className="text-yellow-700">
                ¡Te esperamos para disfrutar de la mejor experiencia gastronómica en el corazón de Morelia!
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationModal