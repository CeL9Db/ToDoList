import { CircleCheck } from 'lucide-react'
import { QUADRANTS, quadrantDeLaTache } from '../matrice'
import CarteTache from './CarteTache'

// Deuxième vue du tableau : les tâches rangées en quatre cases
// selon leur importance (priorité haute) et leur urgence (échéance proche)
// Les tâches finies ne sont pas rangées : il n'y a plus rien à décider pour elles
// taches : les tâches déjà filtrées et triées par App
// Les autres props sont transmises telles quelles aux cartes
function MatriceEisenhower({ taches, onSupprimer, onChangerStatus, onModifier, onMiseAJour, onFiltrerEtiquette }) {
  const tachesEnCours = taches.filter((t) => t.status !== 'Fini avec succès !')
  const nombreFinies = taches.length - tachesEnCours.length

  return (
    <div className="matrice-zone">
      <div className="matrice">
        {QUADRANTS.map((quadrant) => {
          const tachesDuQuadrant = tachesEnCours.filter((t) => quadrantDeLaTache(t) === quadrant.valeur)
          const idTitre = `quadrant-${quadrant.valeur}`

          return (
            <section key={quadrant.valeur} className={`quadrant ${quadrant.classe}`} aria-labelledby={idTitre}>
              <header className="quadrant-entete">
                <div>
                  <h2 id={idTitre} className="quadrant-titre">{quadrant.titre}</h2>
                  <p className="quadrant-conseil">{quadrant.conseil}</p>
                </div>
                <span
                  className="colonne-compteur"
                  aria-label={`${tachesDuQuadrant.length} tâche${tachesDuQuadrant.length > 1 ? 's' : ''}`}
                >
                  {tachesDuQuadrant.length}
                </span>
              </header>

              {tachesDuQuadrant.length === 0 ? (
                <p className="colonne-vide">Aucune tâche ici</p>
              ) : (
                <ul className="liste">
                  {/* Pas de glisser-déposer ici : les cases dépendent de la priorité et de l'échéance */}
                  {tachesDuQuadrant.map((tache) => (
                    <CarteTache
                      key={tache._id}
                      tache={tache}
                      deplacable={false}
                      onSupprimer={onSupprimer}
                      onChangerStatus={onChangerStatus}
                      onModifier={onModifier}
                      onMiseAJour={onMiseAJour}
                      onFiltrerEtiquette={onFiltrerEtiquette}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <p className="matrice-note">
        <CircleCheck size={16} aria-hidden="true" />
        {nombreFinies === 0
          ? 'Les tâches finies ne sont pas affichées dans la matrice.'
          : `${nombreFinies} tâche${nombreFinies > 1 ? 's' : ''} finie${nombreFinies > 1 ? 's' : ''} non affichée${nombreFinies > 1 ? 's' : ''} dans la matrice.`}
      </p>
    </div>
  )
}

export default MatriceEisenhower
