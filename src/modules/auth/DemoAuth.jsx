import React, { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const ROL_KEY = 'prestamos-demo-rol'

function rolInicial() {
  try {
    return localStorage.getItem(ROL_KEY) || 'ADMIN'
  } catch {
    return 'ADMIN'
  }
}

export function DemoAuthProvider({ children }) {
  const [role, setRoleState] = useState(rolInicial)

  const value = useMemo(() => {
    const setRole = nuevo => {
      setRoleState(nuevo)
      try {
        localStorage.setItem(ROL_KEY, nuevo)
      } catch {
        // sin persistencia del rol
      }
    }
    return {
      currentUser: {
        id: 1,
        email: 'demo@ejemplo.cl',
        full_name: 'Usuario Demo',
        role,
        display_name: role === 'ADMIN' ? 'Admin (demo)' : 'Miembro (demo)',
      },
      isAdmin: role === 'ADMIN',
      setRole,
      logout: () => {
        window.location.hash = '#/'
      },
    }
  }, [role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
