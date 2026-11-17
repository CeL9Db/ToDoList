import CarteTache from './CarteTache'

// Une colonne du tableau : le nom du status, le nombre de tâches et les cartes
// statut : un élément de STATUTS (valeur + classe CSS)
// taches : uniquement les tâches qui ont ce status
function ColonneStatut({ statut, taches, onSupprimer, onChangerStatus, onModifier }) {
  const idTitre = `colonne-${statut.classe}`

  return (
    <section className={`colonne ${statut.classe}`} aria-labelledby={idTitre}>
      <header className="colonne-entete">
        <span className="colonne-point" aria-hidden="true" />
        <h2 id={idTitre} className="colonne-titre">{statut.valeur}</h2>
        <span className="colonne-compteur" aria-label={`${taches.length} tâche${taches.length > 1 ? 's' : ''}`}>
          {taches.length}
        </span>
      </header>

      {taches.length === 0 ? (
        <p className="colonne-vide">Aucune tâche ici</p>
      ) : (
        <ul className="liste">
          {taches.map((tache) => (
            <CarteTache
              key={tache._id}
              tache={tache}
              onSupprimer={onSupprimer}
              onChangerStatus={onChangerStatus}
              onModifier={onModifier}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default ColonneStatut
