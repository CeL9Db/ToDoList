import { ChartColumn, ChevronDown } from 'lucide-react'
import { NOMBRE_JOURS, finiesParJour, finiesSansDate, totauxParStatut } from '../statistiques'

// Formats d'affichage des jours : "lun." sous la barre, "lundi 16 novembre" pour les lecteurs d'écran
const formatCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
const formatLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

// Ajoute un "s" quand il y a plusieurs éléments
function pluriel(nombre, mot) {
  return `${nombre} ${mot}${nombre > 1 ? 's' : ''}`
}

// Petit panneau repliable avec les statistiques de toutes les tâches (sans tenir compte des filtres) :
// les tâches finies chacun des 7 derniers jours et le total de chaque status
// taches : toutes les tâches chargées
function PanneauStatistiques({ taches }) {
  const jours = finiesParJour(taches)
  const totalSemaine = jours.reduce((somme, j) => somme + j.nombre, 0)
  // La barre la plus haute correspond au plus grand nombre (au moins 1 pour ne pas diviser par 0)
  const maximum = Math.max(1, ...jours.map((j) => j.nombre))
  const totaux = totauxParStatut(taches)
  const sansDate = finiesSansDate(taches)

  return (
    // <details> s'ouvre et se ferme tout seul, au clic comme au clavier
    <details className="statistiques">
      <summary className="statistiques-resume">
        <ChartColumn size={18} aria-hidden="true" />
        <span className="statistiques-titre">Statistiques</span>
        <span className="statistiques-apercu">
          {pluriel(totalSemaine, 'tâche')} finie{totalSemaine > 1 ? 's' : ''} en {NOMBRE_JOURS} jours
        </span>
        <ChevronDown className="statistiques-fleche" size={18} aria-hidden="true" />
      </summary>

      <div className="statistiques-contenu">
        <section className="statistiques-bloc" aria-labelledby="titre-finies">
          <h2 id="titre-finies" className="statistiques-sous-titre">
            Terminées ces {NOMBRE_JOURS} derniers jours
          </h2>
          <ul className="graphique">
            {jours.map((j, index) => {
              const estAujourdhui = index === jours.length - 1
              return (
                <li
                  key={j.jour}
                  className={`graphique-jour${estAujourdhui ? ' graphique-aujourdhui' : ''}`}
                  aria-label={`${formatLong.format(j.date)} : ${pluriel(j.nombre, 'tâche')} finie${j.nombre > 1 ? 's' : ''}`}
                >
                  <span className="graphique-nombre" aria-hidden="true">{j.nombre}</span>
                  <span className="graphique-piste" aria-hidden="true">
                    {/* Hauteur de la barre proportionnelle au nombre de tâches */}
                    <span className="graphique-barre" style={{ height: `${(j.nombre / maximum) * 100}%` }} />
                  </span>
                  <span className="graphique-jour-nom" aria-hidden="true">
                    {estAujourdhui ? 'auj.' : formatCourt.format(j.date)}
                  </span>
                </li>
              )
            })}
          </ul>
          {sansDate > 0 && (
            <p className="statistiques-note">
              {pluriel(sansDate, 'tâche')} finie{sansDate > 1 ? 's' : ''} avant l'enregistrement de la date de fin
              {sansDate > 1 ? ' ne sont pas comptées' : " n'est pas comptée"} ici.
            </p>
          )}
        </section>

        <section className="statistiques-bloc" aria-labelledby="titre-totaux">
          <h2 id="titre-totaux" className="statistiques-sous-titre">
            Par status ({pluriel(taches.length, 'tâche')})
          </h2>
          <ul className="totaux">
            {totaux.map((statut) => (
              <li key={statut.valeur} className={`total ${statut.classe}`}>
                <span className="colonne-point" aria-hidden="true" />
                <span className="total-nom">{statut.valeur}</span>
                <span className="total-nombre">{statut.nombre}</span>
              </li>
            ))}
          </ul>
          {/* Barre découpée selon la part de chaque status */}
          <div className="repartition" aria-hidden="true">
            {totaux.map((statut) =>
              statut.nombre > 0 ? (
                <span
                  key={statut.valeur}
                  className={`repartition-part ${statut.classe}`}
                  style={{ flexGrow: statut.nombre }}
                />
              ) : null,
            )}
          </div>
        </section>
      </div>
    </details>
  )
}

export default PanneauStatistiques
