import { ArrowRightLeft, Pencil, Sparkles } from 'lucide-react'

// Date et heure d'une action, par exemple "20 nov. 2026 à 14:32"
function formaterMoment(date) {
  const d = new Date(date)
  const jour = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${jour} à ${heure}`
}

// Icône et phrase affichées pour chaque sorte d'action
function decrireAction(ligne) {
  if (ligne.action === 'creation') {
    return { Icone: Sparkles, texte: 'Tâche créée' }
  }
  if (ligne.action === 'status') {
    return { Icone: ArrowRightLeft, texte: `Statut : ${ligne.detail}` }
  }
  return { Icone: Pencil, texte: `Modifiée : ${ligne.detail}` }
}

// Liste des actions faites sur une tâche, de la plus récente à la plus ancienne
// tache : la tâche complète (avec son tableau historique)
// id : identifiant HTML du bloc, utilisé par le bouton qui l'ouvre (aria-controls)
function Historique({ tache, id }) {
  let lignes = tache.historique || []

  // Les tâches créées avant l'historique n'ont aucune ligne : on affiche au moins leur création
  if (lignes.length === 0) {
    lignes = [{ action: 'creation', detail: '', date: tache.date }]
  }

  // reverse() modifie le tableau, on travaille donc sur une copie
  const lignesRecentes = [...lignes].reverse()

  return (
    <section className="historique" id={id} aria-label={`Historique de « ${tache.titre} »`}>
      <ol className="historique-liste">
        {lignesRecentes.map((ligne, index) => {
          const { Icone, texte } = decrireAction(ligne)
          return (
            <li key={index} className={`historique-ligne historique-${ligne.action}`}>
              <span className="historique-icone" aria-hidden="true">
                <Icone size={12} />
              </span>
              <div className="historique-texte">
                <span>{texte}</span>
                <time dateTime={new Date(ligne.date).toISOString()}>{formaterMoment(ligne.date)}</time>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default Historique
