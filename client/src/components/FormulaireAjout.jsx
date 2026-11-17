import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { ajouterTache } from '../services/api'

// Formulaire d'ajout rapide : un titre (obligatoire) et une description (facultative)
// onAjout est appelée avec la tâche créée pour mettre à jour la liste sans recharger la page
function FormulaireAjout({ onAjout }) {
  const [titre, setTitre] = useState('')
  const [desc, setDesc] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const champTitre = useRef(null)

  // Raccourci clavier : la touche "/" ou "n" place le curseur dans le champ titre
  useEffect(() => {
    function gererTouche(evenement) {
      const cible = evenement.target
      // On ne fait rien si l'utilisateur est déjà en train d'écrire quelque part
      const enTrainDEcrire = ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName) || cible.isContentEditable
      if (enTrainDEcrire || evenement.ctrlKey || evenement.metaKey || evenement.altKey) return

      if (evenement.key === '/' || evenement.key === 'n') {
        evenement.preventDefault()
        champTitre.current.focus()
      }
    }

    document.addEventListener('keydown', gererTouche)
    // On enlève l'écouteur quand le composant disparaît
    return () => document.removeEventListener('keydown', gererTouche)
  }, [])

  async function envoyer(evenement) {
    evenement.preventDefault()

    if (titre.trim() === '') {
      setErreur('Le titre est obligatoire.')
      champTitre.current.focus()
      return
    }

    setEnvoi(true)
    setErreur('')
    try {
      const tache = await ajouterTache({ titre: titre.trim(), desc: desc.trim() })
      onAjout(tache)
      // On vide le formulaire et on reste dans le titre pour enchaîner les ajouts
      setTitre('')
      setDesc('')
      champTitre.current.focus()
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'ajouter la tâche. Vérifiez que le serveur est bien lancé.")
    } finally {
      setEnvoi(false)
    }
  }

  // Dans la description, Entrée envoie le formulaire et Maj + Entrée fait un retour à la ligne
  function toucheDescription(evenement) {
    if (evenement.key === 'Enter' && !evenement.shiftKey) {
      envoyer(evenement)
    }
  }

  return (
    <form className="formulaire" onSubmit={envoyer} noValidate>
      <div className="formulaire-champs">
        <label className="cache" htmlFor="titre">Titre de la tâche</label>
        <input
          id="titre"
          ref={champTitre}
          className="champ champ-titre"
          type="text"
          placeholder="Nouvelle tâche..."
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          maxLength={120}
          autoComplete="off"
          aria-invalid={erreur !== ''}
          aria-describedby="aide-formulaire"
        />

        <label className="cache" htmlFor="desc">Description (facultative)</label>
        <textarea
          id="desc"
          className="champ champ-desc"
          placeholder="Description (facultative)"
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={toucheDescription}
        />
      </div>

      <div className="formulaire-pied">
        <p id="aide-formulaire" className={erreur ? 'formulaire-erreur' : 'formulaire-aide'} role={erreur ? 'alert' : undefined}>
          {erreur || (
            <>
              <kbd>Entrée</kbd> pour ajouter · <kbd>/</kbd> ou <kbd>N</kbd> pour écrire une tâche
            </>
          )}
        </p>

        <button type="submit" className="bouton bouton-ajout" disabled={envoi}>
          {envoi ? (
            <LoaderCircle className="rotation" size={16} aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          Ajouter
        </button>
      </div>
    </form>
  )
}

export default FormulaireAjout
