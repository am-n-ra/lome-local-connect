import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getPublicStats } from './api';
import type { PublicStats } from './types';
import { FREE_OFFER_LIMIT, COMPARE_QUOTA_FREE, COMPARE_QUOTA_PRO } from '../domain/invariants';
import { trapDrawerFocus } from './ui-helpers';

/**
 * BRANCHES — parcours d'accueil après CRÉATION de compte (fondateur 2026-10-07 :
 * l'onboarding précédent « n'est pas assez immersif et est trop court »,
 * puis : présenter les plans augmente la conversion).
 *
 * Quatre moments, tous RÉELS (aucune étape simulée, jamais de faux succès) :
 *  1. Bienvenue : ce qu'est Omni + compteur RÉEL de lieux (comme avant).
 *  2. Rôle : « vous êtes plutôt acheteur ou vendeur ? » → `onChooseRole`
 *     (vrai `setRole` + vrai routage, pas une préférence décorative).
 *  3. Premier geste : acheteur → exemples qui lancent une VRAIE recherche
 *     (résultats réels, y compris vides honnêtes) ; vendeur → entrée espace
 *     vendeur (revendiquer/créer, chemins réels existants).
 *  4. Plans : carte info Free vs Pro + lien vers la sheet Plans + partage.
 *     Présenter n'est PAS gater : aucun choix imposé, tout reste accessible
 *     sans compte Pro (décision fondateur 2026-10-07).
 *
 * Invariants (gardés par tests) :
 * - montré SEULEMENT après création (`created`), jamais à la connexion ;
 * - jamais quand une action gardée est en reprise (`pendingAction` prioritaire) ;
 * - le partage n'envoie que l'URL + le nom (zéro PII).
 */
type WelcomeStep = 1 | 2 | 3 | 4;
export type WelcomeRole = 'buyer' | 'seller';

type WelcomeV13Props = {
  /** Le prénom saisi à la création, s'il y en a un. */
  firstName?: string | null;
  /** Étape 2 : l'utilisateur choisit son rôle (vrai routage côté app). */
  onChooseRole: (role: WelcomeRole) => void;
  /** Étape 3 (acheteur) : lance une VRAIE recherche avec l'exemple choisi. */
  onTrySearch: (query: string) => void;
  /** Étape 4 : ouvre la sheet Plans (comparatif complet). */
  onOpenPlans: () => void;
  /** Étape 4 : partage Omni (URL + nom, zéro PII) ; renvoie le message à afficher. */
  onShare: () => Promise<string | null>;
  /** « Explorer la carte » : ferme l'accueil et laisse la carte. */
  onExplore: () => void;
  /** « Publier ce que je vends » : ouvre l'espace vendeur. */
  onPublish: () => void;
  /** Fermer sans choisir (retour au menu). */
  onClose: () => void;
};

/** Exemples honnêtes : ils lancent une vraie recherche, vide possible inclus. */
export const WELCOME_SEARCH_EXAMPLES = ['pain', 'moto', 'téléphone'] as const;

export function WelcomeV13({ firstName, onChooseRole, onTrySearch, onOpenPlans, onShare, onExplore, onPublish, onClose }: WelcomeV13Props) {
  const [count, setCount] = useState<number | null>(null);
  const [step, setStep] = useState<WelcomeStep>(1);
  const [role, setRole] = useState<WelcomeRole | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Nombre de lieux RÉEL : mesuré depuis la carte, jamais une constante décorative.
  // BRANCHES-GUIDE-1a — on lit le TOTAL public (`getPublicStats`), jamais la longueur
  // de `listPublicFacilities` : celle-ci est plafonnée PAR FENÊTRE (D-MAP-1, 2 000),
  // donc elle montrerait un plafond comme s'il était un total. Le chiffre peut changer
  // demain : il est TOUJOURS dérivé de la base au moment de l'affichage.
  // Silence honnête : en échec (hors-ligne, sandbox de test), on ne montre
  // rien plutôt qu'un zéro mensonger — et on ne laisse pas de rejet non géré.
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const result = await getPublicStats();
        if (live && result.ok && result.data) setCount(result.data.facilities);
      } catch {
        /* hors-ligne : le compteur reste absent, pas zéro */
      }
    })();
    return () => { live = false; };
  }, []);

  const hello = firstName && firstName.trim() !== '' ? `Bienvenue, ${firstName.trim()}.` : 'Bienvenue sur Omni.';

  const chooseRole = (next: WelcomeRole) => {
    setRole(next);
    onChooseRole(next);
    setStep(3);
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    setShareNotice(null);
    try {
      const message = await onShare();
      if (message) setShareNotice(message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="sheet h-mid" data-sheet="welcome" role="dialog" aria-modal="false" aria-label="Bienvenue" onKeyDown={trapDrawerFocus}>
      <div className="sheet-head">
        <div>
          <div className="eyebrow">Bienvenue · étape {step} sur 4</div>
          <h2>{hello}</h2>
        </div>
        <button className="iconbtn" type="button" aria-label="Fermer" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="onboard-dots" aria-hidden="true">
        {([1, 2, 3, 4] as const).map((dot) => (
          <span key={dot} className={`onboard-dot${dot === step ? ' active' : dot < step ? ' done' : ''}`} />
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="cardbox" style={{ marginTop: 10 }}>
            <p className="sub">Trouvez où quelque chose existe près de vous, confirmez qu’il peut satisfaire votre demande maintenant, puis transformez-le en transaction tracée.</p>
            <div className="kv" style={{ marginTop: 8 }}>
              <span>Lieux connus d’Omni</span>
              <b className="status ink">{count === null ? 'Chargement…' : count}</b>
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>Des lieux réels existent déjà. Peu sont encore revendiqués : c’est vous qui les rendez transactables.</p>
          </div>
          <button className="btn ok" type="button" style={{ marginTop: 12 }} onClick={() => setStep(2)}>Continuer</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Vous pouvez passer : la carte reste disponible.</p>
        </>
      )}

      {step === 2 && (
        <>
          <div className="cardbox" style={{ marginTop: 10 }}>
            <p className="sub">Omni sert deux gestes. Le vôtre décide de la suite, pas d'un décor.</p>
          </div>
          <button className="btn ok" type="button" style={{ marginTop: 12 }} onClick={() => chooseRole('buyer')}>Je cherche autour de moi</button>
          <button className="btn" type="button" style={{ marginTop: 8 }} onClick={() => chooseRole('seller')}>Je propose quelque chose</button>
        </>
      )}

      {step === 3 && role === 'buyer' && (
        <>
          <div className="cardbox" style={{ marginTop: 10 }}>
            <p className="sub">Touchez un exemple : c’est une vraie recherche, sur les vrais lieux ci-dessus.</p>
          </div>
          <div className="chiprow" style={{ marginTop: 9 }}>
            {WELCOME_SEARCH_EXAMPLES.map((example) => (
              <span key={example} className="chip" role="button" tabIndex={0} onClick={() => onTrySearch(example)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onTrySearch(example); }}><span className="dot" />{example}</span>
            ))}
          </div>
          <button className="btn ghost" type="button" style={{ marginTop: 10 }} onClick={onExplore}>Plutôt explorer librement</button>
        </>
      )}

      {step === 3 && role === 'seller' && (
        <>
          <button className="btn ok" type="button" style={{ marginTop: 12 }} onClick={onExplore}>Explorer la carte</button>
          <button className="btn" type="button" style={{ marginTop: 8 }} onClick={onPublish}>Publier ce que je vends</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Vous pouvez faire les deux plus tard. Publier est libre : la confiance se gagne ensuite.</p>
          <button className="btn ghost" type="button" style={{ marginTop: 8 }} onClick={() => setStep(4)}>Voir les plans</button>
        </>
      )}

      {step === 3 && role === 'buyer' && (
        <button className="btn ghost" type="button" style={{ marginTop: 10 }} onClick={() => setStep(4)}>Voir les plans</button>
      )}

      {step === 4 && (
        <>
          <div className="cardbox" style={{ marginTop: 10 }}>
            <p className="sub">
              {role === 'seller'
                ? `Gratuit pour commencer : ${FREE_OFFER_LIMIT} offres, vérifications manuelles. Pro : offres illimitées, dispo en direct, campagnes.`
                : `Gratuit pour commencer : recherche, favoris, ${COMPARE_QUOTA_FREE} comparaisons. Pro : ${COMPARE_QUOTA_PRO} comparaisons, 100 demandes bulk par mois.`}
            </p>
          </div>
          <button className="btn ok" type="button" style={{ marginTop: 12 }} onClick={onOpenPlans}>Comparer les plans</button>
          <button className="btn ghost" type="button" style={{ marginTop: 8 }} disabled={sharing} onClick={() => void share()}>{sharing ? 'Partage…' : 'Partager Omni'}</button>
          {shareNotice && <p className="sub" role="status" style={{ marginTop: 8 }}>{shareNotice}</p>}
          <button className="btn ghost" type="button" style={{ marginTop: 8 }} onClick={onClose}>Terminer</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Rien n’est imposé : tout reste accessible sans Pro.</p>
        </>
      )}
    </section>
  );
}
