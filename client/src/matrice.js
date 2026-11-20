import { dateDansJours, echeanceEnTexte } from './priorites'

// Une tâche est urgente si son échéance tombe dans les 2 prochains jours (ou est déjà passée)
const JOURS_URGENCE = 2

// Les quatre cases de la matrice d'Eisenhower, dans l'ordre d'affichage (2 x 2)
// valeur : identifiant de la case, titre : la question posée,
// conseil : ce qu'il faut faire des tâches de la case, classe : couleur CSS
export const QUADRANTS = [
  { valeur: 'faire', titre: 'Urgent et important', conseil: 'À faire tout de suite', classe: 'quadrant-faire' },
  { valeur: 'planifier', titre: 'Important, pas urgent', conseil: 'À planifier', classe: 'quadrant-planifier' },
  { valeur: 'deleguer', titre: 'Urgent, pas important', conseil: 'À déléguer ou expédier', classe: 'quadrant-deleguer' },
  { valeur: 'eliminer', titre: 'Ni urgent ni important', conseil: 'Plus tard, ou à abandonner', classe: 'quadrant-eliminer' },
]

// Importante = priorité haute
export function estImportante(tache) {
  return tache.priorite === 'haute'
}

// Urgente = une échéance dans les 2 jours ou déjà dépassée (sans échéance, ce n'est pas urgent)
// Les dates "AAAA-MM-JJ" se comparent directement comme des textes
export function estUrgente(tache) {
  const echeance = echeanceEnTexte(tache.echeance)
  return echeance !== '' && echeance <= dateDansJours(JOURS_URGENCE)
}

// Renvoie la valeur de la case où se range la tâche
export function quadrantDeLaTache(tache) {
  const importante = estImportante(tache)
  const urgente = estUrgente(tache)

  if (importante && urgente) return 'faire'
  if (importante) return 'planifier'
  if (urgente) return 'deleguer'
  return 'eliminer'
}
