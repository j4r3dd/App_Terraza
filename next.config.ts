import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurar imágenes externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Configuración de ESLint más permisiva (temporal)
  eslint: {
    ignoreDuringBuilds: false, // Mejor mantener los errores visibles
  },
};

export default nextConfig;