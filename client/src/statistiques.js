import { dateDansJours } from './priorites'
import { STATUTS } from './statuts'

// Nombre de jours affichés dans le graphique des tâches finies
export const NOMBRE_JOURS = 7

// Transforme une date (texte ou Date) en "AAAA-MM-JJ" selon l'heure locale
// (une tâche finie à 23h30 compte bien pour ce jour-là chez l'utilisateur)
function jourLocal(date) {
  const d = new Date(date)
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

// Pour chacun des 7 derniers jours (du plus ancien à aujourd'hui), le nombre de tâches finies ce jour-là
// Renvoie un tableau de { jour: 'AAAA-MM-JJ', date: Date, nombre }
export function finiesParJour(taches) {
  const jours = []
  for (let i = NOMBRE_JOURS - 1; i >= 0; i--) {
    const jour = dateDansJours(-i)
    // new Date('AAAA-MM-JJT00:00') est lu en heure locale, pratique pour afficher le nom du jour
    jours.push({ jour, date: new Date(`${jour}T00:00`), nombre: 0 })
  }

  for (const tache of taches) {
    if (tache.status !== 'Fini avec succès !' || !tache.dateFin) continue
    const jourDeLaTache = jours.find((j) => j.jour === jourLocal(tache.dateFin))
    if (jourDeLaTache) jourDeLaTache.nombre++
  }

  return jours
}

// Nombre de tâches dans chaque status, dans l'ordre des colonnes du tableau
// Renvoie un tableau de { valeur, classe, nombre }
export function totauxParStatut(taches) {
  return STATUTS.map((statut) => ({
    ...statut,
    nombre: taches.filter((t) => t.status === statut.valeur).length,
  }))
}

// Tâches finies qui n'ont pas de date de fin (finies avant que cette date soit enregistrée)
export function finiesSansDate(taches) {
  return taches.filter((t) => t.status === 'Fini avec succès !' && !t.dateFin).length
}
