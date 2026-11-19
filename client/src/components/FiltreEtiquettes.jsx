import { Tag } from 'lucide-react'
import { classeCouleur } from '../etiquettes'

// Rangée de pastilles pour filtrer le tableau par étiquette
// etiquettes : toutes les étiquettes utilisées (sans doublon)
// etiquetteChoisie : l'étiquette du filtre ('' = toutes les tâches)
// onChoisir : reçoit la nouvelle étiquette choisie
function FiltreEtiquettes({ etiquettes, etiquetteChoisie, onChoisir }) {
  // Pas d'étiquette du tout : le filtre ne sert à rien
  if (etiquettes.length === 0) return null

  return (
    <div className="filtre-etiquettes" role="group" aria-label="Filtrer par étiquette">
      <Tag className="filtre-icone" size={16} aria-hidden="true" />

      <button
        type="button"
        className="filtre-pastille"
        aria-pressed={etiquetteChoisie === ''}
        onClick={() => onChoisir('')}
      >
        Toutes
      </button>

      {etiquettes.map((etiquette) => (
        <button
          key={etiquette}
          type="button"
          className={`filtre-pastille ${classeCouleur(etiquette)}`}
          aria-pressed={etiquetteChoisie === etiquette}
          // Un second clic sur l'étiquette choisie enlève le filtre
          onClick={() => onChoisir(etiquetteChoisie === etiquette ? '' : etiquette)}
        >
          {etiquette}
        </button>
      ))}
    </div>
  )
}

export default FiltreEtiquettes
