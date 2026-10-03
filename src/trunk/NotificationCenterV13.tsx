import { X } from 'lucide-react';
import { relativeAge } from './transaction-time';
import { notificationLabel, notificationTarget, type NotificationTarget } from './notification-center';
import type { NotificationSummary } from './types';

/** MV1 X03 — le centre liste des ÉVÉNEMENTS (pas des messages) : chacun porte sa cible.
 * Tap = marquer vue PUIS ouvrir la cible. Une cible `none` ne rend aucun geste
 * (mieux qu'un lien mort) mais reste lisible : l'événement a eu lieu.
 */
export function NotificationCenterV13({ notifications, state, error, onOpen, onClose }: {
  notifications: NotificationSummary[];
  state: 'idle' | 'loading' | 'error';
  error: string;
  onOpen: (notification: NotificationSummary, target: NotificationTarget) => void;
  onClose: () => void;
}) {
  return (
    <section className="sheet h-mid" data-sheet="notifs" role="region" aria-label="Notifications">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Activité</div><h1>Notifications</h1></div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
      </div>
      {state === 'loading' && <p className="sub" role="status">Chargement de votre activité…</p>}
      {state === 'error' && <p className="sub" role="alert">{error || 'Vos notifications ne peuvent pas être chargées pour le moment.'}</p>}
      {state === 'idle' && notifications.length === 0 && (
        <p className="sub">Aucune activité pour le moment. Les réponses, vérifications et tours de transaction apparaîtront ici.</p>
      )}
      {state === 'idle' && notifications.length > 0 && (
        <div className="plist">
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationRow({ notification, onOpen }: {
  notification: NotificationSummary;
  onOpen: (notification: NotificationSummary, target: NotificationTarget) => void;
}) {
  // La cible est calculée au rendu depuis les faits, jamais stockée : si le serveur
  // ajoute un type demain, les anciennes lignes restent lisibles sans migration.
  const target = notificationTarget(notification);
  const unread = notification.seenAt === null;
  return (
    <button
      type="button"
      className="pitem"
      style={{ width: '100%', textAlign: 'left', fontWeight: unread ? 700 : 400 }}
      onClick={() => onOpen(notification, target)}
      aria-label={`${notificationLabel(notification)}${unread ? ', non lue' : ''}`}
    >
      <span className="chk" aria-hidden="true">{unread ? '●' : ''}</span>
      <span>
        <b>{notificationLabel(notification)}</b>
        <small>{relativeAge(notification.createdAt)}</small>
      </span>
    </button>
  );
}
