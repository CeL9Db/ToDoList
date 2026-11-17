import { useEffect, useRef, useState } from 'react'
import { Calendar, Check, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Trash2, X } from 'lucide-react'
import { STATUTS } from '../statuts'

// Transforme la date de la base en date lisible, par exemple "16 novembre 2026"
function formaterDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Affiche une tâche : son titre, sa description et sa date
// onSupprimer : clic sur la corbeille
// onChangerStatus : clic sur une flèche, reçoit la tâche et le nouveau status
// onModifier : enregistre le nouveau titre et la nouvelle description (renvoie une promesse)
function CarteTache({ tache, onSupprimer, onChangerStatus, onModifier }) {
  const [enEdition, setEnEdition] = useState(false)
  const [titre, setTitre] = useState(tache.titre)
  const [desc, setDesc] = useState(tache.desc || '')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const champTitre = useRef(null)
  const boutonModifier = useRef(null)
  // Sert à savoir si on vient de quitter le mode édition (pour rendre le focus au crayon)
  const etaitEnEdition = useRef(false)

  // Les status voisins : la colonne de gauche et celle de droite (undefined au bord)
  const position = STATUTS.findIndex((s) => s.valeur === tache.status)
  const statusPrecedent = STATUTS[position - 1]
  const statusSuivant = STATUTS[position + 1]

  // En entrant dans le mode édition, le curseur va dans le titre ;
  // en sortant, il revient sur le bouton crayon pour ne pas perdre sa place au clavier
  useEffect(() => {
    if (enEdition) {
      champTitre.current.focus()
      champTitre.current.select()
    } else if (etaitEnEdition.current) {
      boutonModifier.current.focus()
    }
    etaitEnEdition.current = enEdition
  }, [enEdition])

  function ouvrirEdition() {
    // On repart toujours des valeurs actuelles de la tâche
    setTitre(tache.titre)
    setDesc(tache.desc || '')
    setErreur('')
    setEnEdition(true)
  }

  function fermerEdition() {
    setEnEdition(false)
    setErreur('')
  }

  async function enregistrer(evenement) {
    evenement.preventDefault()

    if (titre.trim() === '') {
      setErreur('Le titre est obligatoire.')
      champTitre.current.focus()
      return
    }

    setEnvoi(true)
    try {
      await onModifier(tache, { titre: titre.trim(), desc: desc.trim() })
      fermerEdition()
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'enregistrer les modifications.")
    } finally {
      setEnvoi(false)
    }
  }

  // Échap annule, Entrée enregistre (Maj + Entrée fait un retour à la ligne dans la description)
  function gererTouche(evenement) {
    if (evenement.key === 'Escape') {
      fermerEdition()
    } else if (evenement.key === 'Enter' && !evenement.shiftKey && evenement.target.tagName === 'TEXTAREA') {
      enregistrer(evenement)
    }
  }

  // Mode édition : la carte devient un petit formulaire
  if (enEdition) {
    return (
      <li className="carte carte-edition">
        <form onSubmit={enregistrer} onKeyDown={gererTouche} noValidate>
          <label className="cache" htmlFor={`titre-${tache._id}`}>Titre</label>
          <input
            id={`titre-${tache._id}`}
            ref={champTitre}
            className="champ champ-titre"
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={120}
            autoComplete="off"
            aria-invalid={erreur !== ''}
          />

          <label className="cache" htmlFor={`desc-${tache._id}`}>Description</label>
          <textarea
            id={`desc-${tache._id}`}
            className="champ champ-desc"
            placeholder="Description (facultative)"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          {erreur && <p className="formulaire-erreur" role="alert">{erreur}</p>}

          <div className="carte-pied">
            <button type="button" className="bouton-secondaire" onClick={fermerEdition}>
              <X size={16} aria-hidden="true" />
              Annuler
            </button>
            <button type="submit" className="bouton bouton-petit" disabled={envoi}>
              {envoi ? (
                <LoaderCircle className="rotation" size={16} aria-hidden="true" />
              ) : (
                <Check size={16} aria-hidden="true" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="carte">
      <h3 className="carte-titre">{tache.titre}</h3>

      {tache.desc && <p className="carte-desc">{tache.desc}</p>}

      <div className="carte-pied">
        <p className="carte-date">
          <Calendar size={14} aria-hidden="true" />
          {formaterDate(tache.date)}
        </p>

        <div className="carte-actions">
          {statusPrecedent && (
            <button
              type="button"
              className="bouton-icone"
              onClick={() => onChangerStatus(tache, statusPrecedent.valeur)}
              aria-label={`Déplacer « ${tache.titre} » vers « ${statusPrecedent.valeur} »`}
              title={`Déplacer vers « ${statusPrecedent.valeur} »`}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          )}

          {statusSuivant && (
            <button
              type="button"
              className="bouton-icone"
              onClick={() => onChangerStatus(tache, statusSuivant.valeur)}
              aria-label={`Déplacer « ${tache.titre} » vers « ${statusSuivant.valeur} »`}
              title={`Déplacer vers « ${statusSuivant.valeur} »`}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            ref={boutonModifier}
            className="bouton-icone bouton-discret"
            onClick={ouvrirEdition}
            aria-label={`Modifier la tâche « ${tache.titre} »`}
            title="Modifier"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="bouton-icone bouton-discret bouton-supprimer"
            onClick={() => onSupprimer(tache)}
            aria-label={`Supprimer la tâche « ${tache.titre} »`}
            title="Supprimer"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}

export default CarteTache
