import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Plus, Tag, X } from 'lucide-react'
import { modifierTache } from '../services/api'
import { classeCouleur, nettoyerEtiquette } from '../etiquettes'

// Étiquettes d'une carte : une pastille de couleur par étiquette, avec une croix pour l'enlever,
// et un petit champ pour en ajouter une
// tache : la tâche complète (avec son tableau etiquettes)
// onMiseAJour : reçoit la nouvelle version de la tâche pour mettre la liste à jour
// onSaisie : prévient la carte quand le champ d'ajout s'ouvre ou se ferme
// onFiltrer : clic sur le nom d'une étiquette, pour n'afficher que les tâches qui l'ont
function Etiquettes({ tache, onMiseAJour, onSaisie, onFiltrer }) {
  const etiquettes = tache.etiquettes || []
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const champTexte = useRef(null)

  useEffect(() => {
    if (ajoutOuvert) champTexte.current.focus()
  }, [ajoutOuvert])

  function ouvrirAjout() {
    setAjoutOuvert(true)
    setErreur('')
    onSaisie(true)
  }

  function fermerAjout() {
    setAjoutOuvert(false)
    setTexte('')
    setErreur('')
    onSaisie(false)
  }

  // Le serveur reçoit toujours la liste complète des étiquettes
  async function envoyerListe(nouvelleListe) {
    const tacheModifiee = await modifierTache(tache._id, { etiquettes: nouvelleListe })
    onMiseAJour(tacheModifiee)
  }

  async function ajouter(evenement) {
    evenement.preventDefault()
    const etiquette = nettoyerEtiquette(texte)

    if (etiquette === '') {
      champTexte.current.focus()
      return
    }
    // Étiquette déjà présente : rien à envoyer, on vide juste le champ
    if (etiquettes.includes(etiquette)) {
      setTexte('')
      return
    }

    setEnvoi(true)
    setErreur('')
    try {
      await envoyerListe([...etiquettes, etiquette])
      setTexte('')
      champTexte.current.focus()
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'ajouter l'étiquette.")
    } finally {
      setEnvoi(false)
    }
  }

  // L'étiquette disparaît tout de suite ; si le serveur refuse, on remet l'ancienne tâche
  async function enlever(etiquette) {
    onMiseAJour({ ...tache, etiquettes: etiquettes.filter((e) => e !== etiquette) })
    setErreur('')
    try {
      await envoyerListe(etiquettes.filter((e) => e !== etiquette))
    } catch {
      onMiseAJour(tache)
      setErreur("L'étiquette n'a pas pu être enlevée.")
    }
  }

  function gererTouche(evenement) {
    if (evenement.key === 'Escape') fermerAjout()
  }

  return (
    <div className="etiquettes">
      <ul className="etiquettes-liste" aria-label="Étiquettes">
        {etiquettes.map((etiquette) => (
          <li key={etiquette} className={`etiquette ${classeCouleur(etiquette)}`}>
            <button
              type="button"
              className="etiquette-nom"
              onClick={() => onFiltrer(etiquette)}
              title={`Afficher seulement les tâches « ${etiquette} »`}
            >
              {etiquette}
            </button>
            <button
              type="button"
              className="etiquette-enlever"
              onClick={() => enlever(etiquette)}
              aria-label={`Enlever l'étiquette « ${etiquette} »`}
              title="Enlever l'étiquette"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </li>
        ))}

        {!ajoutOuvert && (
          <li>
            <button type="button" className="sous-tache-ouvrir etiquette-ouvrir" onClick={ouvrirAjout}>
              <Tag size={13} aria-hidden="true" />
              Étiquette
            </button>
          </li>
        )}
      </ul>

      {ajoutOuvert && (
        <form className="sous-tache-ajout" onSubmit={ajouter} onKeyDown={gererTouche} noValidate>
          <label className="cache" htmlFor={`etiquette-${tache._id}`}>Nouvelle étiquette</label>
          <input
            id={`etiquette-${tache._id}`}
            ref={champTexte}
            className="sous-tache-champ"
            type="text"
            placeholder="Nouvelle étiquette"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={30}
            autoComplete="off"
          />
          <button type="submit" className="bouton-icone" disabled={envoi} aria-label="Ajouter l'étiquette" title="Ajouter">
            {envoi ? <LoaderCircle className="rotation" size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          </button>
          <button type="button" className="bouton-icone bouton-discret" onClick={fermerAjout} aria-label="Fermer" title="Fermer">
            <X size={16} aria-hidden="true" />
          </button>
        </form>
      )}

      {erreur && <p className="formulaire-erreur" role="alert">{erreur}</p>}
    </div>
  )
}

export default Etiquettes
