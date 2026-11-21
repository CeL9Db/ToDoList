// Gestion du thème de l'interface : 'systeme' (par défaut), 'clair' ou 'sombre'
// Le choix est gardé dans le navigateur (localStorage) pour les prochaines visites

const CLE = 'todolist-theme'

// Ordre utilisé par le bouton : chaque clic passe au thème suivant
export const THEMES = ['systeme', 'clair', 'sombre']

// Lit le thème enregistré, ou 'systeme' si rien n'est enregistré
// (try/catch car localStorage peut être bloqué, par exemple en navigation privée)
export function lireTheme() {
  try {
    const theme = localStorage.getItem(CLE)
    return THEMES.includes(theme) ? theme : 'systeme'
  } catch {
    return 'systeme'
  }
}

// Applique le thème sur la balise <html> et l'enregistre
// En mode 'systeme', on enlève l'attribut : le CSS suit alors le réglage du système
export function appliquerTheme(theme) {
  if (theme === 'systeme') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }

  try {
    if (theme === 'systeme') localStorage.removeItem(CLE)
    else localStorage.setItem(CLE, theme)
  } catch {
    // Pas grave : le thème marche quand même, il ne sera juste pas retenu
  }
}

// Renvoie le thème qui vient après celui donné (systeme → clair → sombre → systeme)
export function themeSuivant(theme) {
  const position = THEMES.indexOf(theme)
  return THEMES[(position + 1) % THEMES.length]
}
