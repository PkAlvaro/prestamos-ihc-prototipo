import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// HashRouter: el prototipo se publica como sitio estático (GitHub Pages),
// donde no hay rewrites para que /prestamos/activos sirva index.html.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
