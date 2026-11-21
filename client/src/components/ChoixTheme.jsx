import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { appliquerTheme, lireTheme, themeSuivant } from '../theme'

// Icône et texte de chaque thème
const INFOS = {
  systeme: { icone: Monitor, texte: 'Thème du système' },
  clair: { icone: Sun, texte: 'Thème clair' },
  sombre: { icone: Moon, texte: 'Thème sombre' },
}

// Bouton rond dans l'en-tête : chaque clic passe au thème suivant
// Le thème a déjà été appliqué au démarrage (voir main.jsx), ici on ne fait que le changer
function ChoixTheme() {
  const [theme, setTheme] = useState(lireTheme)

  function changerTheme() {
    const nouveau = themeSuivant(theme)
    appliquerTheme(nouveau)
    setTheme(nouveau)
  }

  const Icone = INFOS[theme].icone
  const suivant = INFOS[themeSuivant(theme)].texte.toLowerCase()

  return (
    <button
      type="button"
      className="bouton-icone choix-theme"
      onClick={changerTheme}
      aria-label={`${INFOS[theme].texte}, cliquer pour passer au ${suivant}`}
      title={`${INFOS[theme].texte} (cliquer pour passer au ${suivant})`}
    >
      <Icone size={18} aria-hidden="true" />
    </button>
  )
}

export default ChoixTheme
