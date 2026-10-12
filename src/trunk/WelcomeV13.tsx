import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { listPublicFacilities } from './api';
import { trapDrawerFocus } from './ui-helpers';

/**
 * BRANCHES — accueil après CRÉATION de compte (fondateur 2026-10-07 : « on a besoin
 * de l'onboarding »).
 *
 * Décision retenue (option A, `docs/nature-way/omni-onboarding-gap-2026-10-07.md`) :
 * **une seule étape d'activation honnête**, montrée **seulement au premier compte créé**
 * (jamais à la connexion). Elle ne demande **aucun plan** (S-31 : on publie tôt, le Pro
 * se paie quand on en a besoin) et n'invente rien : le nombre de lieux affiché est
 * **réel** (compté depuis la carte via `listPublicFacilities`). Deux gestes clairs :
 * explorer la carte, ou publier ce que je vends.
 */
type WelcomeV13Props = {
  /** Le prénom saisi à la création, s'il y en a un. */
  firstName?: string | null;
  /** « Explorer la carte » : ferme l'accueil et laisse la carte. */
  onExplore: () => void;
  /** « Publier ce que je vends » : ouvre l'espace vendeur. */
  onPublish: () => void;
  /** Fermer sans choisir (retour au menu). */
  onClose: () => void;
};

export function WelcomeV13({ firstName, onExplore, onPublish, onClose }: WelcomeV13Props) {
  const [count, setCount] = useState<number | null>(null);

  // Nombre de lieux RÉEL : mesuré depuis la carte, jamais une constante décorative.
  useEffect(() => {
    let live = true;
    void (async () => {
      const result = await listPublicFacilities();
      if (live && result.ok && result.data) setCount(result.data.length);
    })();
    return () => { live = false; };
  }, []);

  const hello = firstName && firstName.trim() !== '' ? `Bienvenue, ${firstName.trim()}.` : 'Bienvenue sur Omni.';

  return (
    <section className="sheet h-mid" data-sheet="welcome" role="dialog" aria-modal="false" aria-label="Bienvenue" onKeyDown={trapDrawerFocus}>
      <div className="sheet-head">
        <div>
          <div className="eyebrow">Bienvenue</div>
          <h2>{hello}</h2>
        </div>
        <button className="iconbtn" type="button" aria-label="Fermer" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="cardbox" style={{ marginTop: 10 }}>
        <p className="sub">Trouvez où quelque chose existe près de vous, confirmez qu’il peut satisfaire votre demande maintenant, puis transformez-le en transaction tracée.</p>
        <div className="kv" style={{ marginTop: 8 }}>
          <span>Lieux sur la carte</span>
          <b className="status ink">{count === null ? 'Chargement…' : count}</b>
        </div>
      </div>

      <button className="btn ok" type="button" style={{ marginTop: 12 }} onClick={onExplore}>Explorer la carte</button>
      <button className="btn" type="button" style={{ marginTop: 8 }} onClick={onPublish}>Publier ce que je vends</button>
      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Vous pouvez faire les deux plus tard. Publier est libre : la confiance se gagne ensuite.</p>
    </section>
  );
}
