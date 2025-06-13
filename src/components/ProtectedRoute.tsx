// src/components/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  children: React.ReactNode
  allowRoles: string[]
}

export default function ProtectedRoute({ children, allowRoles }: Props) {
  const router = useRouter()

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) {
      router.push('/login')
      return
    }

    const user = JSON.parse(raw)
    if (!allowRoles.includes(user.rol)) {
      router.push('/login')
    }
  }, [allowRoles, router]) // <-- Corrección aquí

  return <>{children}</>
}