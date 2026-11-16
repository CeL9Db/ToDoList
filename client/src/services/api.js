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
