import { useEffect, useRef, useState } from 'react'
import { ListPlus, LoaderCircle, Plus, X } from 'lucide-react'
import { ajouterSousTache, modifierSousTache, supprimerSousTache } from '../services/api'

// Liste des sous-tâches d'une carte : barre de progression, cases à cocher,
// suppression et petit champ pour en ajouter une
// tache : la tâche complète (avec son tableau sousTaches)
// onMiseAJour : reçoit la nouvelle version de la tâche pour mettre la liste à jour
// onSaisie : prévient la carte quand le champ d'ajout s'ouvre ou se ferme
function SousTaches({ tache, onMiseAJour, onSaisie }) {
  const sousTaches = tache.sousTaches || []
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const champTexte = useRef(null)

  // Le curseur va directement dans le champ quand on l'ouvre
  useEffect(() => {
    if (ajoutOuvert) champTexte.current.focus()
  }, [ajoutOuvert])

  const nombreFaites = sousTaches.filter((s) => s.fait).length
  const pourcentage = sousTaches.length === 0 ? 0 : Math.round((nombreFaites / sousTaches.length) * 100)

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

  async function ajouter(evenement) {
    evenement.preventDefault()
    if (texte.trim() === '') {
      champTexte.current.focus()
      return
    }

    setEnvoi(true)
    setErreur('')
    try {
      onMiseAJour(await ajouterSousTache(tache._id, texte.trim()))
      // On vide le champ mais on le laisse ouvert pour enchaîner les ajouts
      setTexte('')
      champTexte.current.focus()
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'ajouter la sous-tâche.")
    } finally {
      setEnvoi(false)
    }
  }

  // La case change tout de suite à l'écran ; si le serveur refuse, on remet l'ancienne tâche
  async function basculer(sousTache) {
    const nouvellesSousTaches = sousTaches.map((s) => (s._id === sousTache._id ? { ...s, fait: !s.fait } : s))
    onMiseAJour({ ...tache, sousTaches: nouvellesSousTaches })
    setErreur('')
    try {
      onMiseAJour(await modifierSousTache(tache._id, sousTache._id, { fait: !sousTache.fait }))
    } catch {
      onMiseAJour(tache)
      setErreur("La sous-tâche n'a pas pu être modifiée.")
    }
  }

  async function supprimer(sousTache) {
    setErreur('')
    try {
      onMiseAJour(await supprimerSousTache(tache._id, sousTache._id))
    } catch {
      setErreur("La sous-tâche n'a pas pu être supprimée.")
    }
  }

  // Échap ferme le champ d'ajout
  function gererTouche(evenement) {
    if (evenement.key === 'Escape') fermerAjout()
  }

  return (
    <div className="sous-taches">
      {sousTaches.length > 0 && (
        <>
          <div className="progression">
            <div
              className="progression-barre"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pourcentage}
              aria-label={`Sous-tâches terminées pour « ${tache.titre} »`}
            >
              <div
                className={pourcentage === 100 ? 'progression-remplie progression-complete' : 'progression-remplie'}
                style={{ width: `${pourcentage}%` }}
              />
            </div>
            <span className="progression-texte">
              {nombreFaites}/{sousTaches.length}
            </span>
          </div>

          <ul className="sous-taches-liste">
            {sousTaches.map((sousTache) => (
              <li key={sousTache._id} className="sous-tache">
                <label className={sousTache.fait ? 'sous-tache-case sous-tache-faite' : 'sous-tache-case'}>
                  <input type="checkbox" checked={sousTache.fait} onChange={() => basculer(sousTache)} />
                  <span>{sousTache.texte}</span>
                </label>
                <button
                  type="button"
                  className="bouton-icone bouton-discret bouton-supprimer sous-tache-supprimer"
                  onClick={() => supprimer(sousTache)}
                  aria-label={`Supprimer la sous-tâche « ${sousTache.texte} »`}
                  title="Supprimer la sous-tâche"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {ajoutOuvert ? (
        <form className="sous-tache-ajout" onSubmit={ajouter} onKeyDown={gererTouche} noValidate>
          <label className="cache" htmlFor={`sous-tache-${tache._id}`}>Nouvelle sous-tâche</label>
          <input
            id={`sous-tache-${tache._id}`}
            ref={champTexte}
            className="sous-tache-champ"
            type="text"
            placeholder="Nouvelle sous-tâche"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={120}
            autoComplete="off"
          />
          <button type="submit" className="bouton-icone" disabled={envoi} aria-label="Ajouter la sous-tâche" title="Ajouter">
            {envoi ? <LoaderCircle className="rotation" size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          </button>
          <button type="button" className="bouton-icone bouton-discret" onClick={fermerAjout} aria-label="Fermer" title="Fermer">
            <X size={16} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button type="button" className="sous-tache-ouvrir" onClick={ouvrirAjout}>
          <ListPlus size={14} aria-hidden="true" />
          Sous-tâche
        </button>
      )}

      {erreur && <p className="formulaire-erreur" role="alert">{erreur}</p>}
    </div>
  )
}

export default SousTaches
