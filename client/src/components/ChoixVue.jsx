import { Columns3, Grid2x2 } from 'lucide-react'

// Les deux façons d'afficher les tâches
const VUES = [
  { valeur: 'tableau', texte: 'Tableau', icone: <Columns3 size={16} aria-hidden="true" /> },
  { valeur: 'matrice', texte: 'Matrice', icone: <Grid2x2 size={16} aria-hidden="true" /> },
]

// Petit interrupteur à deux boutons pour passer du tableau à la matrice d'Eisenhower
// vue : la vue affichée, onChoisir : reçoit la vue cliquée
function ChoixVue({ vue, onChoisir }) {
  return (
    <div className="choix-vue" role="group" aria-label="Affichage des tâches">
      {VUES.map(({ valeur, texte, icone }) => (
        <button
          key={valeur}
          type="button"
          className={`choix-vue-bouton${vue === valeur ? ' choix-vue-actif' : ''}`}
          aria-pressed={vue === valeur}
          onClick={() => onChoisir(valeur)}
        >
          {icone}
          {texte}
        </button>
      ))}
    </div>
  )
}

export default ChoixVue
