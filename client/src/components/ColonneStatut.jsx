import { useState } from 'react'
import CarteTache from './CarteTache'

// Une colonne du tableau : le nom du status, le nombre de tâches et les cartes
// statut : un élément de STATUTS (valeur + classe CSS)
// taches : uniquement les tâches qui ont ce status
// tacheGlissee : la tâche en train d'être glissée (null si aucune)
// onMiseAJour : remplace une tâche dans la liste après un changement de ses sous-tâches
// onDeposer : appelé quand une carte est lâchée ici, reçoit l'id de la tâche et le status de la colonne
function ColonneStatut({
  statut,
  taches,
  tacheGlissee,
  onSupprimer,
  onChangerStatus,
  onModifier,
  onDebutGlisser,
  onFinGlisser,
  onDeposer,
  onMiseAJour,
}) {
  const idTitre = `colonne-${statut.classe}`
  // true quand une carte est au-dessus de la colonne
  const [survolee, setSurvolee] = useState(false)

  // On n'accepte une carte que si elle vient d'une autre colonne
  const accepteLaCarte = tacheGlissee !== null && tacheGlissee.status !== statut.valeur

  // Le navigateur refuse le dépôt par défaut : preventDefault() l'autorise
  function gererSurvol(evenement) {
    if (!accepteLaCarte) return
    evenement.preventDefault()
    evenement.dataTransfer.dropEffect = 'move'
    if (!survolee) setSurvolee(true)
  }

  // dragleave se déclenche aussi en passant d'une carte à l'autre dans la colonne :
  // on ne retire la surbrillance que si on sort vraiment de la colonne
  function gererSortie(evenement) {
    if (!evenement.currentTarget.contains(evenement.relatedTarget)) {
      setSurvolee(false)
    }
  }

  function gererDepot(evenement) {
    evenement.preventDefault()
    setSurvolee(false)
    const id = evenement.dataTransfer.getData('text/plain')
    if (id) onDeposer(id, statut.valeur)
  }

  let classes = `colonne ${statut.classe}`
  if (accepteLaCarte) classes += ' colonne-cible'
  if (accepteLaCarte && survolee) classes += ' colonne-survolee'

  return (
    <section
      className={classes}
      aria-labelledby={idTitre}
      onDragOver={gererSurvol}
      onDragLeave={gererSortie}
      onDrop={gererDepot}
    >
      <header className="colonne-entete">
        <span className="colonne-point" aria-hidden="true" />
        <h2 id={idTitre} className="colonne-titre">{statut.valeur}</h2>
        <span className="colonne-compteur" aria-label={`${taches.length} tâche${taches.length > 1 ? 's' : ''}`}>
          {taches.length}
        </span>
      </header>

      {taches.length === 0 ? (
        <p className="colonne-vide">{accepteLaCarte ? 'Déposez la tâche ici' : 'Aucune tâche ici'}</p>
      ) : (
        <ul className="liste">
          {taches.map((tache) => (
            <CarteTache
              key={tache._id}
              tache={tache}
              onSupprimer={onSupprimer}
              onChangerStatus={onChangerStatus}
              onModifier={onModifier}
              onDebutGlisser={onDebutGlisser}
              onFinGlisser={onFinGlisser}
              onMiseAJour={onMiseAJour}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default ColonneStatut
