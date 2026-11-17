import axios from 'axios'

// Adresse de l'API : variable VITE_API_URL du fichier .env, sinon le serveur local
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Récupère toutes les tâches (de la plus récente à la plus ancienne)
export async function recupererTaches() {
  const reponse = await api.get('/todos')
  return reponse.data
}

// Envoie une nouvelle tâche au serveur et renvoie la tâche créée (avec son _id)
export async function ajouterTache(tache) {
  const reponse = await api.post('/todos', tache)
  return reponse.data
}

// Modifie une tâche (titre, desc ou status) et renvoie la tâche mise à jour
export async function modifierTache(id, modifications) {
  const reponse = await api.put(`/todos/${id}`, modifications)
  return reponse.data
}

// Supprime définitivement une tâche à partir de son _id
export async function supprimerTache(id) {
  const reponse = await api.delete(`/todos/${id}`)
  return reponse.data
}

// Même suppression, mais utilisable quand la page se ferme :
// avec keepalive, le navigateur termine la requête même après la fermeture de l'onglet
export function supprimerTacheAvantFermeture(id) {
  fetch(`${api.defaults.baseURL}/todos/${id}`, { method: 'DELETE', keepalive: true })
}
