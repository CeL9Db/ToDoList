import { echeanceEnTexte } from './priorites'

// Les tris proposés dans la barre de recherche
// valeur : utilisée dans le code, texte : affiché dans la liste déroulante
export const TRIS = [
  { valeur: 'date', texte: 'Plus récentes' },
  { valeur: 'echeance', texte: 'Échéance la plus proche' },
  { valeur: 'priorite', texte: 'Priorité la plus haute' },
]

// Ordre des priorités pour le tri : plus le nombre est grand, plus c'est important
const POIDS_PRIORITE = { basse: 1, moyenne: 2, haute: 3 }

// Met un texte en minuscules et sans accents, pour que "reflechir" trouve "Réfléchir"
function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Garde seulement les tâches dont le titre contient le texte recherché
export function filtrerParTitre(taches, recherche) {
  const texte = normaliser(recherche.trim())
  if (texte === '') return taches
  return taches.filter((t) => normaliser(t.titre).includes(texte))
}

// Comparaison par date de création : la plus récente d'abord
function comparerDates(a, b) {
  return new Date(b.date) - new Date(a.date)
}

// Comparaison par échéance : la plus proche d'abord, les tâches sans échéance à la fin
function comparerEcheances(a, b) {
  const echeanceA = echeanceEnTexte(a.echeance)
  const echeanceB = echeanceEnTexte(b.echeance)

  if (echeanceA === echeanceB) return comparerDates(a, b)
  if (echeanceA === '') return 1
  if (echeanceB === '') return -1
  // Les dates "AAAA-MM-JJ" se comparent directement comme des textes
  return echeanceA < echeanceB ? -1 : 1
}

// Comparaison par priorité : haute d'abord (une tâche sans priorité compte comme moyenne)
function comparerPriorites(a, b) {
  const poidsA = POIDS_PRIORITE[a.priorite] || POIDS_PRIORITE.moyenne
  const poidsB = POIDS_PRIORITE[b.priorite] || POIDS_PRIORITE.moyenne

  if (poidsA === poidsB) return comparerDates(a, b)
  return poidsB - poidsA
}

// Renvoie une copie des tâches triée selon le tri choisi (le tableau d'origine n'est pas modifié)
export function trierTaches(taches, tri) {
  const copie = [...taches]
  if (tri === 'echeance') return copie.sort(comparerEcheances)
  if (tri === 'priorite') return copie.sort(comparerPriorites)
  return copie.sort(comparerDates)
}
