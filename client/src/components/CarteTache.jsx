import { Calendar, Trash2 } from 'lucide-react'

// Classe CSS de la pastille selon le status de la tâche
const CLASSES_STATUS = {
  'List': 'pastille-liste',
  'En train de réflechir': 'pastille-encours',
  'Fini avec succès !': 'pastille-fini',
}

// Transforme la date de la base en date lisible, par exemple "16 novembre 2026"
function formaterDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Affiche une tâche : son titre, sa description, son status et sa date
// onSupprimer est appelée quand on clique sur la corbeille
function CarteTache({ tache, onSupprimer }) {
  return (
    <li className="carte">
      <div className="carte-entete">
        <h2 className="carte-titre">{tache.titre}</h2>
        <span className={`pastille ${CLASSES_STATUS[tache.status] || ''}`}>
          {tache.status}
        </span>
      </div>

      {tache.desc && <p className="carte-desc">{tache.desc}</p>}

      <div className="carte-pied">
        <p className="carte-date">
          <Calendar size={14} aria-hidden="true" />
          {formaterDate(tache.date)}
        </p>

        <button
          type="button"
          className="bouton-icone bouton-supprimer"
          onClick={() => onSupprimer(tache)}
          aria-label={`Supprimer la tâche « ${tache.titre} »`}
          title="Supprimer"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default CarteTache
