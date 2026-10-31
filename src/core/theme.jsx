import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const ModuleColorContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('cai-theme') ?? 'light')
  const [modColor, _setModColor] = useState('#FFE000')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('cai-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  const setModuleColor = hex => {
    _setModColor(hex)
    document.documentElement.style.setProperty('--mod-color', hex)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ModuleColorContext.Provider value={{ modColor, setModuleColor }}>
        {children}
      </ModuleColorContext.Provider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useModuleColor() {
  return useContext(ModuleColorContext)
}
