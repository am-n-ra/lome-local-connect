import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getOperatorEntitySide } from './api';
import { Skeleton } from './Skeleton';
import type { OperatorEntitySide } from './types';

/**
 * DOCK-02 (reste) / maquette `op-side` — « Aperçu côté entité (lecture seule) ».
 *
 * The operator opens a dossier in the field tour (`op-queue/visit/report`, TF-6)
 * and, to understand it, needs to SEE what the entity sees — its badge, how many
 * offers it published, and how many requests are still waiting on it. This is the
 * read-only half of the operator dock (`DOCK-02`), named as a separate terrain
 * slice in the conformance register.
 *
 * It never writes: the operator looks, the operator does not act on the entity's
 * behalf (D-OPS-3 — the badge decision lives in the existing review queues).
 */

/** Public trust label, exactly as the entity sees it (honest: 9 internal → public). */
export function trustLabelFor(trustState: string): string {
  if (trustState === 'confirmed' || trustState === 'certified') return 'Vérifiée';
  if (trustState === 'unconfirmed') return 'Non vérifiée';
  return 'Non revendiquée';
}

type Props = { visitId: string; onBack: () => void };

export function OperatorEntitySideV13({ visitId, onBack }: Props) {
  const [side, setSide] = useState<OperatorEntitySide | null>(null);
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setState('error'); setError('Session requise.'); return; }
      const result = await getOperatorEntitySide({ token, visitId });
      if (result.ok && result.data && result.data.authorized) {
        setSide(result.data.side);
        setState('idle');
      } else {
        setState('error');
        setError(result.error?.message ?? "L'aperçu entité ne peut pas être chargé pour le moment.");
      }
    } catch (caught) {
      setState('error');
      setError(caught instanceof Error ? caught.message : "L'aperçu entité ne peut pas être chargé pour le moment.");
    }
  }, [visitId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="op-side" role="region" aria-label="Aperçu côté entité">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Aperçu · lecture seule</div><h1>Ce que voit l'entité</h1></div>
        <button type="button" className="sheet-close" onClick={onBack} aria-label="Retour à la tournée"><ArrowLeft size={15} /></button>
      </div>
      {state === 'loading' && <Skeleton variant="kv" count={3} />}
      {state === 'error' && (
        <div role="alert">
          <p className="sub">{error}</p>
          <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 28 }} onClick={() => void load()}><RefreshCw size={14} /> Réessayer</button>
        </div>
      )}
      {state === 'idle' && side === null && <p className="sub">Ce dossier n'est plus rattaché à une entité visible.</p>}
      {state === 'idle' && side !== null && (
        <>
          <div className="cardbox">
            <div className="kv"><span>{side.entityName ?? 'Entité'}</span><b>{trustLabelFor(side.trustState)} · {side.qualifyingSales} vente{side.qualifyingSales > 1 ? 's' : ''}</b></div>
            <div className="kv"><span>Offres publiées</span><b>{side.publishedOfferCount}</b></div>
            <div className="kv"><span>Sa file de demandes</span><b>{side.pendingRequestCount === 0 ? 'Aucune en attente' : `${side.pendingRequestCount} en attente`}</b></div>
          </div>
          <p className="lead">L'opérateur peut <b>voir</b> ce que voit une entité pour comprendre un dossier — sans jamais modifier à sa place.</p>
        </>
      )}
    </section>
  );
}
