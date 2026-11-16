import { useEffect, useState } from 'react'
import { CircleAlert, Inbox, ListTodo, LoaderCircle, RefreshCw } from 'lucide-react'
import { recupererTaches } from './services/api'
import CarteTache from './components/CarteTache'
import './App.css'

function App() {
  const [taches, setTaches] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

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

  // Choisit ce qu'il faut afficher : chargement, erreur, liste vide ou liste des tâches
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
          <p className="etat-texte">Les tâches ajoutées apparaîtront ici.</p>
        </div>
      )
    }

    return (
      <ul className="liste">
        {taches.map((tache) => (
          <CarteTache key={tache._id} tache={tache} />
        ))}
      </ul>
    )
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
            {chargement || erreur ? 'ToDoList' : `${taches.length} tâche${taches.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </header>

      <main>{afficherContenu()}</main>
    </div>
  )
}

export default App
