import { ArrowDownUp, Search, X } from 'lucide-react'
import { TRIS } from '../recherche'

// Barre au-dessus du tableau : recherche par titre et choix du tri
// Tout se fait côté client, le composant ne fait que remonter les valeurs choisies
function BarreRecherche({ recherche, onRecherche, tri, onTri }) {
  // Échap vide le champ de recherche
  function toucheRecherche(evenement) {
    if (evenement.key === 'Escape') {
      onRecherche('')
    }
  }

  return (
    <div className="barre-recherche" role="search">
      <div className="recherche">
        <Search className="recherche-icone" size={18} aria-hidden="true" />
        <label className="cache" htmlFor="recherche">Rechercher une tâche par titre</label>
        <input
          id="recherche"
          className="recherche-champ"
          type="search"
          placeholder="Rechercher par titre..."
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          onKeyDown={toucheRecherche}
          autoComplete="off"
        />
        {recherche !== '' && (
          <button
            type="button"
            className="bouton-icone recherche-effacer"
            onClick={() => onRecherche('')}
            aria-label="Effacer la recherche"
            title="Effacer la recherche"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <label className="option tri">
        <ArrowDownUp className="tri-icone" size={16} aria-hidden="true" />
        <span className="option-nom">Trier par</span>
        <select className="option-champ" value={tri} onChange={(e) => onTri(e.target.value)}>
          {TRIS.map((t) => (
            <option key={t.valeur} value={t.valeur}>{t.texte}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default BarreRecherche
