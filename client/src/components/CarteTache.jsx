import { useEffect, useRef, useState } from 'react'
import { Calendar, CalendarClock, Check, ChevronLeft, ChevronRight, Flag, History, LoaderCircle, Pencil, Trash2, X } from 'lucide-react'
import { STATUTS } from '../statuts'
import { PRIORITES, aujourdhui, echeanceEnTexte, estEnRetard, textePriorite } from '../priorites'
import SousTaches from './SousTaches'
import Etiquettes from './Etiquettes'
import Historique from './Historique'
// Transforme la date de la base en date lisible et courte, par exemple "16 nov. 2026"
// Transforme la date de la base en date lisible, par exemple "16 novembre 2026"
function formaterDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Texte court de l'échéance, par exemple "Aujourd'hui" ou "20 nov. 2026"
// timeZone UTC : l'échéance est enregistrée à minuit UTC, on garde donc le bon jour
function formaterEcheance(echeance) {
  if (echeanceEnTexte(echeance) === aujourdhui()) return "Aujourd'hui"
  return new Date(echeance).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Affiche une tâche : son titre, sa description et sa date
// onSupprimer : clic sur la corbeille
// onChangerStatus : clic sur une flèche, reçoit la tâche et le nouveau status
// onModifier : enregistre le titre, la description, la priorité et l'échéance (renvoie une promesse)
// onDebutGlisser / onFinGlisser : préviennent le tableau qu'on commence ou arrête de glisser la carte
// onMiseAJour : remplace la tâche dans la liste (utilisé par les sous-tâches et les étiquettes)
// onFiltrerEtiquette : clic sur une étiquette, pour filtrer le tableau
// deplacable : false pour une carte qu'on ne peut pas glisser (dans la matrice)
function CarteTache({
  tache,
  deplacable = true,
  onSupprimer,
  onChangerStatus,
  onModifier,
  onDebutGlisser,
  onFinGlisser,
  onMiseAJour,
  onFiltrerEtiquette,
}) {
  const [glissee, setGlissee] = useState(false)
  // true pendant qu'on écrit une sous-tâche ou une étiquette : la carte n'est alors plus déplaçable,
  // sinon le navigateur confond la sélection du texte avec un glisser-déposer
  const [saisieSousTache, setSaisieSousTache] = useState(false)
  const [saisieEtiquette, setSaisieEtiquette] = useState(false)
  const [enEdition, setEnEdition] = useState(false)
  // Affiche ou cache le détail de l'historique sous la carte
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false)
  const [titre, setTitre] = useState(tache.titre)
  const [desc, setDesc] = useState(tache.desc || '')
  const [priorite, setPriorite] = useState(tache.priorite || 'moyenne')
  const [echeance, setEcheance] = useState(echeanceEnTexte(tache.echeance))
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
    setPriorite(tache.priorite || 'moyenne')
    setEcheance(echeanceEnTexte(tache.echeance))
    setErreur('')
    // Les champs des sous-tâches et des étiquettes disparaissent pendant l'édition
    setSaisieSousTache(false)
    setSaisieEtiquette(false)
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
      await onModifier(tache, { titre: titre.trim(), desc: desc.trim(), priorite, echeance })
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

  // Début du glisser-déposer : on range l'id de la tâche dans le "colis" du navigateur
  // (Firefox ne lance pas le glisser si aucune donnée n'est donnée)
  function commencerGlisser(evenement) {
    evenement.dataTransfer.setData('text/plain', tache._id)
    evenement.dataTransfer.effectAllowed = 'move'
    // On attend un instant avant de changer l'affichage : sinon Chrome
    // photographie la carte déjà estompée pour l'image qui suit la souris
    setTimeout(() => {
      setGlissee(true)
      onDebutGlisser(tache)
    }, 0)
  }

  // Fin du glisser, que la carte ait été déposée ou non
  function terminerGlisser() {
    setGlissee(false)
    onFinGlisser()
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

          <div className="formulaire-options">
            <label className="option">
              <span className="option-nom">Priorité</span>
              <select className="option-champ" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                {PRIORITES.map((p) => (
                  <option key={p.valeur} value={p.valeur}>{p.texte}</option>
                ))}
              </select>
            </label>

            <label className="option">
              <span className="option-nom">Échéance</span>
              <input
                className="option-champ"
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
              />
            </label>
          </div>

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

  const enRetard = estEnRetard(tache)
  const valeurPriorite = tache.priorite || 'moyenne'

  let classes = 'carte carte-deplacable'
  if (enRetard) classes += ' carte-en-retard'
  if (glissee) classes += ' carte-glissee'

  // La carte peut être glissée vers une autre colonne ; les flèches restent
  // disponibles pour le clavier et les lecteurs d'écran
  return (
    <li className={classes} draggable={deplacable && !saisieSousTache && !saisieEtiquette} onDragStart={commencerGlisser} onDragEnd={terminerGlisser}>
      <h3 className="carte-titre">{tache.titre}</h3>

      {tache.desc && <p className="carte-desc">{tache.desc}</p>}

      {/* Petites étiquettes : la priorité et, s'il y en a une, l'échéance */}
      <div className="carte-infos">
        <span className={`badge priorite-${valeurPriorite}`}>
          <Flag size={12} aria-hidden="true" />
          {textePriorite(valeurPriorite)}
          <span className="cache"> priorité</span>
        </span>

        {tache.echeance && (
          <span className={enRetard ? 'badge badge-retard' : 'badge'}>
            <CalendarClock size={12} aria-hidden="true" />
            <span className="cache">Échéance : </span>
            {formaterEcheance(tache.echeance)}
            {enRetard && ' · en retard'}
          </span>
        )}
      </div>

      <Etiquettes
        tache={tache}
        onMiseAJour={onMiseAJour}
        onSaisie={setSaisieEtiquette}
        onFiltrer={onFiltrerEtiquette}
      />

      <SousTaches tache={tache} onMiseAJour={onMiseAJour} onSaisie={setSaisieSousTache} />

      {historiqueOuvert && <Historique tache={tache} id={`historique-${tache._id}`} />}

      <div className="carte-pied">
        {/* Date courte ("19 nov. 2026") pour que les boutons tiennent sur la même ligne */}
        <p className="carte-date" title="Date de création">
          <Calendar size={14} aria-hidden="true" />
          <span className="visuellement-cache">Créée le </span>
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
            className={historiqueOuvert ? 'bouton-icone bouton-discret bouton-actif' : 'bouton-icone bouton-discret'}
            onClick={() => setHistoriqueOuvert(!historiqueOuvert)}
            aria-expanded={historiqueOuvert}
            aria-controls={`historique-${tache._id}`}
            aria-label={`Historique de la tâche « ${tache.titre} »`}
            title={historiqueOuvert ? "Cacher l'historique" : "Voir l'historique"}
          >
            <History size={16} aria-hidden="true" />
          </button>

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
