import { Undo2, X } from 'lucide-react'

// Petite notification en bas de l'écran, avec un bouton "Annuler" facultatif
// duree (en ms) sert à animer la barre qui montre le temps restant
function Notification({ message, duree, onAnnuler, onFermer }) {
  return (
    <div className="notification" role="status" aria-live="polite">
      <p className="notification-texte">{message}</p>

      {onAnnuler && (
        <button type="button" className="notification-annuler" onClick={onAnnuler}>
          <Undo2 size={16} aria-hidden="true" />
          Annuler
        </button>
      )}

      <button type="button" className="notification-fermer" onClick={onFermer} aria-label="Fermer la notification">
        <X size={16} aria-hidden="true" />
      </button>

      {/* La barre se vide pendant la durée de la notification */}
      {duree && <span className="notification-barre" style={{ animationDuration: `${duree}ms` }} aria-hidden="true" />}
    </div>
  )
}

export default Notification
