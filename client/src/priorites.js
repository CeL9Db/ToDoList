// Les trois priorités d'une tâche, de la plus faible à la plus forte
// valeur : la valeur enregistrée dans la base
// texte : ce qui est affiché à l'écran
export const PRIORITES = [
  { valeur: 'basse', texte: 'Basse' },
  { valeur: 'moyenne', texte: 'Moyenne' },
  { valeur: 'haute', texte: 'Haute' },
]

// Renvoie le texte affiché pour une priorité (moyenne si la tâche n'en a pas encore)
export function textePriorite(valeur) {
  const priorite = PRIORITES.find((p) => p.valeur === valeur) || PRIORITES[1]
  return priorite.texte
}

// La date du jour au format "AAAA-MM-JJ" (le format des champs <input type="date">)
export function aujourdhui() {
  const maintenant = new Date()
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getDate()).padStart(2, '0')
  return `${maintenant.getFullYear()}-${mois}-${jour}`
}

// Transforme l'échéance de la base en "AAAA-MM-JJ" ('' s'il n'y en a pas)
// Le serveur enregistre le jour choisi à minuit UTC, donc on lit la date en UTC
export function echeanceEnTexte(echeance) {
  if (!echeance) return ''
  return new Date(echeance).toISOString().slice(0, 10)
}

// Une tâche est en retard si son échéance est passée et qu'elle n'est pas finie
export function estEnRetard(tache) {
  const echeance = echeanceEnTexte(tache.echeance)
  return echeance !== '' && echeance < aujourdhui() && tache.status !== 'Fini avec succès !'
}
