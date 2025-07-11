'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const CarouselBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const images = [
    { src: '/Cumpleañero.jpeg', alt: 'Cumpleañero' },
    { src: '/Jueves.jpeg', alt: 'Jueves' },
    { src: '/Viernes.jpeg', alt: 'Viernes' }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 px-4 sm:px-6">
      <div className="relative h-60 sm:h-72 md:h-80 lg:h-96 xl:h-[26rem] rounded-2xl overflow-hidden shadow-2xl">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-contain bg-black/10"
              priority={index === 0}
            />
          </div>
        ))}
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CarouselBanner