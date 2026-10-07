import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, getSellerVerification } from './api';
import { Skeleton } from './Skeleton';
import { sellerVerificationBadge, sellerVerificationStep, verificationBadgeLabel, verificationStepLabel } from './verification-status';
import type { SellerVerification } from './types';

/**
 * MENU-01 « Vérification » (maquette `seller-verif`) — « État de votre vérification ».
 *
 * Le vendeur voit OÙ EN EST son badge : badge public actuel, étape vraie (visite
 * terrain programmée, revue équipe, preuves en cours), seuil de preuves selon la
 * nature de l'entité (particulier 1 · commerce 3, R-4c), zone/date de visite.
 *
 * LECTURE SEULE (D-OPS-5) : aucun contact acheteur, aucun message, aucune écriture
 * de badge (la décision badge vit dans les files existantes, D-OPS-3). Le vendeur
 * publie déjà (S-31) — la vérification est une couche gagnée, pas une barrière.
 */
type Props = { onClose: () => void };

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'empty' } | { status: 'ready'; data: SellerVerification };

export function SellerVerificationV13({ onClose }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const token = await getAuthToken();
    if (!token) { setState({ status: 'empty' }); return; }
    const catalogue = await getSellerCatalogue({ token });
    if (!catalogue.ok || !catalogue.data) { setState({ status: 'error', message: 'Votre catalogue ne peut pas être chargé pour le moment.' }); return; }
    const facility = catalogue.data.facilities[0];
    if (!facility) { setState({ status: 'empty' }); return; }
    const result = await getSellerVerification({ token, facilityId: facility.id });
    if (!result.ok || !result.data) { setState({ status: 'error', message: result.error?.message ?? 'Votre état de vérification ne peut pas être chargé pour le moment.' }); return; }
    setState({ status: 'ready', data: result.data });
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="verification" role="region" aria-label="Vérification de l’entité">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Vérification de l’entité</div><h1>État de votre vérification</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose} aria-label="Fermer"><ArrowLeft size={15} /></button>
      </div>

      {state.status === 'loading' && <Skeleton variant="kv" count={4} />}

      {state.status === 'error' && (
        <div role="alert">
          <p className="sub">{state.message}</p>
          <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} type="button" onClick={() => void load()}>Réessayer</button>
        </div>
      )}

      {state.status === 'empty' && (
        <p className="sub">Vous publiez déjà. Créez ou revendiquez un lieu pour suivre l’état de sa vérification.</p>
      )}

      {state.status === 'ready' && (() => {
        const data = state.data;
        const badge = sellerVerificationBadge(data.trustState);
        const step = sellerVerificationStep({ trustState: data.trustState, requestState: data.requestState, visitState: data.visitState });
        const hasVisit = data.visitState === 'a_visiter' || data.visitState === 'en_cours';
        const stepLabel = verificationStepLabel(step, { qualifyingSales: data.qualifyingSales, requiredCount: data.requiredCount }, hasVisit);
        const stepTone = step === 'badge_settled' ? 'ok' : step === 'not_requested' ? 'gray' : 'warn';
        return (
          <>
            <div className="cardbox">
              <div className="kv"><span>Entité</span><b>{data.facilityName}</b></div>
              <div className="kv"><span>Badge actuel</span><b className={`status ${badge === 'confirmed' ? 'ok' : badge === 'unconfirmed' ? 'warn' : 'dash'}`}>{verificationBadgeLabel(badge)}</b></div>
              <div className="kv"><span>Étape</span><b className={`status ${stepTone}`}>{stepLabel}</b></div>
              {hasVisit && (
                <div className="kv"><span>Opérateur assigné</span><b>{data.visitZone ? `Zone ${data.visitZone}` : 'Zone à préciser'}{data.visitDate ? ` · ${new Date(data.visitDate).toLocaleDateString('fr-FR')}` : ''}</b></div>
              )}
              <div className="kv"><span>Preuves exigées</span><b>{data.requiredCount > 1 ? `${data.requiredCount} ventes (commerce)` : '1 vente (particulier)'}</b></div>
            </div>
            <p className="lead">Vous <b>publiez déjà</b> (S-31) ; la vérification est une couche gagnée. Vous voyez ici <b>où elle en est</b> — l’équipe décide du badge, jamais cette page.</p>
            <div className="cardbox">
              <div className="kv"><span><ShieldCheck size={13} /> Ventes qualifiantes</span><b>{data.requiredCount > 1 ? `${data.qualifyingSales}/${data.requiredCount}` : data.qualifyingSales > 0 ? 'Acquise' : 'En attente'}</b></div>
            </div>
          </>
        );
      })()}
    </section>
  );
}
