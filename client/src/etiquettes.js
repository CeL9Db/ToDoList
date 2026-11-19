// Nombre de couleurs disponibles pour les étiquettes (classes etiquette-couleur-0 à 5 dans App.css)
const NOMBRE_COULEURS = 6

// Choisit toujours la même couleur pour un même nom d'étiquette :
// on additionne les codes des lettres et on garde le reste de la division
export function classeCouleur(etiquette) {
  let somme = 0
  for (const lettre of etiquette) {
    somme += lettre.charCodeAt(0)
  }
  return `etiquette-couleur-${somme % NOMBRE_COULEURS}`
}

// Nettoie une étiquette tapée par l'utilisateur (comme le fait le serveur)
export function nettoyerEtiquette(texte) {
  return texte.trim().toLowerCase()
}

// Transforme "travail, Perso , travail" en ['travail', 'perso'] (champ du formulaire d'ajout)
export function lireListeEtiquettes(texte) {
  const resultat = []
  for (const morceau of texte.split(',')) {
    const etiquette = nettoyerEtiquette(morceau)
    if (etiquette !== '' && !resultat.includes(etiquette)) resultat.push(etiquette)
  }
  return resultat
}

// Toutes les étiquettes utilisées par au moins une tâche, rangées par ordre alphabétique
export function toutesLesEtiquettes(taches) {
  const liste = []
  for (const tache of taches) {
    for (const etiquette of tache.etiquettes || []) {
      if (!liste.includes(etiquette)) liste.push(etiquette)
    }
  }
  return liste.sort((a, b) => a.localeCompare(b, 'fr'))
}

// Garde seulement les tâches qui ont l'étiquette choisie ('' = pas de filtre)
export function filtrerParEtiquette(taches, etiquette) {
  if (etiquette === '') return taches
  return taches.filter((t) => (t.etiquettes || []).includes(etiquette))
}
