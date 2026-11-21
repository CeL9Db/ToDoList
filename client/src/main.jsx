import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { appliquerTheme, lireTheme } from './theme'

// On applique le thème enregistré avant le premier affichage, pour éviter un flash de couleur
appliquerTheme(lireTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
