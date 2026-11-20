import { useEffect, useRef, useState } from 'react'
import { CircleAlert, Inbox, ListTodo, LoaderCircle, RefreshCw, SearchX } from 'lucide-react'
import { modifierTache, recupererTaches, supprimerTache, supprimerTacheAvantFermeture } from './services/api'
import { STATUTS } from './statuts'
import { filtrerParTitre, trierTaches } from './recherche'
import { filtrerParEtiquette, toutesLesEtiquettes } from './etiquettes'
import BarreRecherche from './components/BarreRecherche'
import FiltreEtiquettes from './components/FiltreEtiquettes'
import ColonneStatut from './components/ColonneStatut'
import MatriceEisenhower from './components/MatriceEisenhower'
import ChoixVue from './components/ChoixVue'
import FormulaireAjout from './components/FormulaireAjout'
import Notification from './components/Notification'
import './App.css'

// Temps (en ms) pendant lequel on peut annuler une suppression
const DUREE_ANNULATION = 5000

// Range les tâches de la plus récente à la plus ancienne (même ordre que le serveur)
function trierParDate(taches) {
  return [...taches].sort((a, b) => new Date(b.date) - new Date(a.date))
}

function App() {
  const [taches, setTaches] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Notification affichée en bas de l'écran (null = aucune)
  const [notification, setNotification] = useState(null)
  // Suppression en attente : la tâche retirée de l'écran et son minuteur
  const suppressionEnAttente = useRef(null)
  // Texte recherché dans les titres et tri choisi (appliqués côté client)
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('date')
  // Étiquette choisie pour filtrer le tableau ('' = toutes les tâches)
  const [etiquetteChoisie, setEtiquetteChoisie] = useState('')
  // Tâche en train d'être glissée vers une autre colonne (null = aucune)
  const [tacheGlissee, setTacheGlissee] = useState(null)
  // Vue affichée : 'tableau' (trois colonnes) ou 'matrice' (matrice d'Eisenhower)
  const [vue, setVue] = useState('tableau')

  // Demande les tâches au serveur et range le résultat dans l'état
  async function chargerTaches() {
    try {
      const donnees = await recupererTaches()
      setTaches(donnees)
      setErreur('')
    } catch {
      setErreur('Impossible de récupérer les tâches. Vérifiez que le serveur est bien lancé.')
    } finally {
      setChargement(false)
    }
  }

  // Au premier affichage de la page, on charge les tâches
  useEffect(() => {
    chargerTaches()
  }, [])

  // Bouton "Réessayer" : on réaffiche le chargement puis on redemande les tâches
  function reessayer() {
    setChargement(true)
    chargerTaches()
  }

  // Une tâche vient d'être créée : on la met en haut de la liste, sans recharger la page
  function ajouterALaListe(tache) {
    setTaches((anciennes) => [tache, ...anciennes])
  }

  // Remplace une tâche de la liste par sa nouvelle version (même _id)
  function remplacerDansLaListe(tacheModifiee) {
    setTaches((anciennes) => anciennes.map((t) => (t._id === tacheModifiee._id ? tacheModifiee : t)))
  }

  // Changement de status : la carte change de colonne tout de suite,
  // et si le serveur refuse, elle revient à sa place
  async function changerStatus(tache, nouveauStatus) {
    remplacerDansLaListe({ ...tache, status: nouveauStatus })
    try {
      const tacheModifiee = await modifierTache(tache._id, { status: nouveauStatus })
      remplacerDansLaListe(tacheModifiee)
    } catch {
      remplacerDansLaListe(tache)
      setNotification({
        cle: Date.now(),
        message: "Le changement de status a échoué, la tâche est revenue à sa place.",
        annulable: false,
      })
    }
  }

  // Une carte a été lâchée dans une colonne : on retrouve la tâche grâce à son id
  // et on réutilise le même changement de status que les flèches
  function deposerTache(id, nouveauStatus) {
    setTacheGlissee(null)
    const tache = taches.find((t) => t._id === id)
    if (tache && tache.status !== nouveauStatus) {
      changerStatus(tache, nouveauStatus)
    }
  }

  // Modification du titre et de la description depuis la carte
  // En cas d'erreur, l'exception remonte jusqu'à la carte qui affiche le message
  async function enregistrerModification(tache, modifications) {
    const tacheModifiee = await modifierTache(tache._id, modifications)
    remplacerDansLaListe(tacheModifiee)
  }

  // Si l'onglet est fermé pendant les 5 secondes, on envoie quand même la suppression
  useEffect(() => {
    function avantFermeture() {
      if (suppressionEnAttente.current) {
        supprimerTacheAvantFermeture(suppressionEnAttente.current.tache._id)
      }
    }

    window.addEventListener('pagehide', avantFermeture)
    return () => window.removeEventListener('pagehide', avantFermeture)
  }, [])

  // Une notification sans bouton "Annuler" disparaît toute seule après quelques secondes
  useEffect(() => {
    if (!notification || notification.annulable) return
    const minuteur = setTimeout(() => setNotification(null), DUREE_ANNULATION)
    return () => clearTimeout(minuteur)
  }, [notification])

  // Remet une tâche dans la liste, à sa place d'origine grâce au tri par date
  function remettreDansLaListe(tache) {
    setTaches((anciennes) => trierParDate([...anciennes, tache]))
  }

  // Envoie au serveur la suppression qui était en attente
  async function validerSuppression() {
    const attente = suppressionEnAttente.current
    if (!attente) return

    clearTimeout(attente.minuteur)
    suppressionEnAttente.current = null
    // On cache la notification seulement si c'est encore celle de cette suppression
    setNotification((actuelle) => (actuelle && actuelle.cle === attente.cle ? null : actuelle))

    try {
      await supprimerTache(attente.tache._id)
    } catch {
      // Le serveur n'a pas pu supprimer : la tâche revient à l'écran
      remettreDansLaListe(attente.tache)
      setNotification({
        cle: Date.now(),
        message: "La suppression a échoué, la tâche a été remise dans la liste.",
        annulable: false,
      })
    }
  }

  // Clic sur la corbeille : la tâche disparaît tout de suite de l'écran,
  // mais elle n'est vraiment supprimée sur le serveur qu'après 5 secondes
  function demanderSuppression(tache) {
    // Une seule suppression en attente à la fois : la précédente est validée maintenant
    validerSuppression()

    const cle = Date.now()
    setTaches((anciennes) => anciennes.filter((t) => t._id !== tache._id))
    suppressionEnAttente.current = {
      tache,
      cle,
      minuteur: setTimeout(validerSuppression, DUREE_ANNULATION),
    }
    setNotification({ cle, message: `« ${tache.titre} » a été supprimée.`, annulable: true })
  }

  // Bouton "Annuler" : on arrête le minuteur et la tâche revient dans la liste
  function annulerSuppression() {
    const attente = suppressionEnAttente.current
    if (!attente) return

    clearTimeout(attente.minuteur)
    suppressionEnAttente.current = null
    remettreDansLaListe(attente.tache)
    setNotification(null)
  }

  // Bouton "Fermer" : si une suppression attend, on la valide directement
  function fermerNotification() {
    if (notification?.annulable) {
      validerSuppression()
    } else {
      setNotification(null)
    }
  }

  // Toutes les étiquettes existantes, pour la rangée de filtres
  const listeEtiquettes = toutesLesEtiquettes(taches)
  // Si plus aucune tâche n'a l'étiquette choisie (elle a été enlevée), le filtre ne s'applique plus
  const etiquetteActive = listeEtiquettes.includes(etiquetteChoisie) ? etiquetteChoisie : ''
  const filtreActif = recherche.trim() !== '' || etiquetteActive !== ''

  // Les tâches réellement affichées : filtrées par la recherche et l'étiquette, puis triées
  const tachesAffichees = trierTaches(filtrerParEtiquette(filtrerParTitre(taches, recherche), etiquetteActive), tri)

  // Bouton "Effacer les filtres" quand plus rien ne s'affiche
  function effacerFiltres() {
    setRecherche('')
    setEtiquetteChoisie('')
  }

  // Phrase affichée quand les filtres ne laissent aucune tâche
  function texteAucunResultat() {
    if (recherche.trim() !== '' && etiquetteActive !== '') {
      return `Aucune tâche « ${etiquetteActive} » ne correspond à « ${recherche.trim()} »`
    }
    if (etiquetteActive !== '') return `Aucune tâche avec l'étiquette « ${etiquetteActive} »`
    return `Aucune tâche ne correspond à « ${recherche.trim()} »`
  }

  // Choisit ce qu'il faut afficher : chargement, erreur, liste vide ou tableau des tâches
  function afficherContenu() {
    if (chargement) {
      return (
        <div className="etat" role="status">
          <LoaderCircle className="etat-icone rotation" size={32} aria-hidden="true" />
          <p className="etat-titre">Chargement des tâches...</p>
        </div>
      )
    }

    if (erreur) {
      return (
        <div className="etat etat-erreur" role="alert">
          <CircleAlert className="etat-icone" size={32} aria-hidden="true" />
          <p className="etat-titre">Une erreur est survenue</p>
          <p className="etat-texte">{erreur}</p>
          <button type="button" className="bouton" onClick={reessayer}>
            <RefreshCw size={16} aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )
    }

    if (taches.length === 0) {
      return (
        <div className="etat">
          <Inbox className="etat-icone" size={32} aria-hidden="true" />
          <p className="etat-titre">Aucune tâche pour le moment</p>
          <p className="etat-texte">Ajoutez votre première tâche avec le formulaire ci-dessus.</p>
        </div>
      )
    }

    if (tachesAffichees.length === 0) {
      return (
        <div className="etat">
          <SearchX className="etat-icone" size={32} aria-hidden="true" />
          <p className="etat-titre">{texteAucunResultat()}</p>
          <p className="etat-texte">Essayez avec un autre mot ou effacez les filtres.</p>
          <button type="button" className="bouton" onClick={effacerFiltres}>
            Effacer les filtres
          </button>
        </div>
      )
    }

    if (vue === 'matrice') {
      return (
        <MatriceEisenhower
          taches={tachesAffichees}
          onSupprimer={demanderSuppression}
          onChangerStatus={changerStatus}
          onModifier={enregistrerModification}
          onMiseAJour={remplacerDansLaListe}
          onFiltrerEtiquette={setEtiquetteChoisie}
        />
      )
    }

    return (
      <div className="tableau">
        {/* Une colonne par status, chacune ne reçoit que ses tâches */}
        {STATUTS.map((statut) => (
          <ColonneStatut
            key={statut.valeur}
            statut={statut}
            taches={tachesAffichees.filter((t) => t.status === statut.valeur)}
            tacheGlissee={tacheGlissee}
            onSupprimer={demanderSuppression}
            onChangerStatus={changerStatus}
            onModifier={enregistrerModification}
            onDebutGlisser={setTacheGlissee}
            onFinGlisser={() => setTacheGlissee(null)}
            onDeposer={deposerTache}
            onMiseAJour={remplacerDansLaListe}
            onFiltrerEtiquette={setEtiquetteChoisie}
          />
        ))}
      </div>
    )
  }

  // Sous-titre de l'en-tête : "5 tâches", ou "2 sur 5 tâches" pendant une recherche ou un filtre
  function texteNombreTaches() {
    const total = `${taches.length} tâche${taches.length > 1 ? 's' : ''}`
    if (!filtreActif) return total
    return `${tachesAffichees.length} sur ${total}`
  }

  return (
    <div className="page">
      <header className="entete">
        <div className="logo" aria-hidden="true">
          <ListTodo size={24} />
        </div>
        <div>
          <h1 className="entete-titre">Mes tâches</h1>
          <p className="entete-sous-titre">
            {chargement || erreur ? 'ToDoList' : texteNombreTaches()}
          </p>
        </div>
        {/* Le choix de la vue n'apparaît que lorsqu'il y a des tâches à afficher */}
        {!chargement && !erreur && taches.length > 0 && <ChoixVue vue={vue} onChoisir={setVue} />}
      </header>

      <main>
        <FormulaireAjout onAjout={ajouterALaListe} />
        {/* La barre n'a de sens que s'il y a des tâches à chercher */}
        {!chargement && !erreur && taches.length > 0 && (
          <>
            <BarreRecherche recherche={recherche} onRecherche={setRecherche} tri={tri} onTri={setTri} />
            <FiltreEtiquettes
              etiquettes={listeEtiquettes}
              etiquetteChoisie={etiquetteActive}
              onChoisir={setEtiquetteChoisie}
            />
          </>
        )}
        {afficherContenu()}
      </main>

      {/* La clé change à chaque notification pour relancer l'animation de la barre */}
      {notification && (
        <Notification
          key={notification.cle}
          message={notification.message}
          duree={DUREE_ANNULATION}
          onAnnuler={notification.annulable ? annulerSuppression : null}
          onFermer={fermerNotification}
        />
      )}
    </div>
  )
}

export default App
