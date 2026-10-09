import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getOperatorRuns, importPublicFacilityBatch } from './api';
import { Skeleton } from './Skeleton';
import type { OperatorRunSummary, PublicFacilityImportResult } from './types';

/**
 * Console d'import (admin) — câble `importPublicFacilityBatch` + `getOperatorRuns`.
 *
 * Ces deux surfaces existaient côté serveur (routes `operator-import-batch` et
 * `operator=runs`) et côté client, mais AUCUNE UI ne les appelait : l'import des lieux
 * publics se faisait uniquement par script serveur (`scripts/import-osm.ts`). Cette
 * console rend l'acte d'import VISIBLE et traçable depuis l'espace équipe.
 *
 * Honnêteté : l'import ne crée que des lieux `unclaimed` (jamais revendiqués) ; l'attribution
 * ODbL est REQUISE et par défaut pré-remplie ; un point hors zone pilote est refusé par le
 * serveur (jamais publié en silence). Rien n'est « vérifié » ici — l'import est un point de
 * départ, pas une preuve.
 */

type Item = { sourceRef: string; name: string; category?: string | null; address?: string | null; latitude: number; longitude: number };

const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';

function parseItems(raw: string): { items?: Item[]; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: 'Collez un tableau JSON de lieux à importer.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: 'Le JSON est invalide.' };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return { error: 'Le JSON doit être un tableau non vide.' };
  const items: Item[] = [];
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) return { error: 'Chaque lieu doit être un objet.' };
    const e = entry as Record<string, unknown>;
    const sourceRef = typeof e.sourceRef === 'string' ? e.sourceRef.trim() : '';
    const name = typeof e.name === 'string' ? e.name.trim() : '';
    const latitude = Number(e.latitude);
    const longitude = Number(e.longitude);
    if (!sourceRef || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { error: `Un lieu est incomplet (sourceRef, name, latitude, longitude requis) : ${sourceRef || name || 'entrée sans nom'}.` };
    }
    items.push({
      sourceRef,
      name,
      category: typeof e.category === 'string' ? e.category : null,
      address: typeof e.address === 'string' ? e.address : null,
      latitude,
      longitude,
    });
  }
  return { items };
}

export function AdminImportConsole() {
  const [attribution, setAttribution] = useState(DEFAULT_ATTRIBUTION);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; created: number; existing: number; results: PublicFacilityImportResult[] } | null>(null);
  const [runs, setRuns] = useState<OperatorRunSummary[]>([]);
  const [runsState, setRunsState] = useState<'loading' | 'idle' | 'error'>('loading');
  const [runsError, setRunsError] = useState('');

  const loadRuns = useCallback(async () => {
    setRunsState('loading');
    setRunsError('');
    try {
      const token = await getAuthToken();
      if (!token) { setRunsState('error'); setRunsError('Session requise.'); return; }
      const response = await getOperatorRuns({ token });
      if (response.ok && response.data) {
        setRuns(response.data.runs ?? []);
        setRunsState('idle');
      } else {
        setRunsState('error');
        setRunsError(response.error?.message ?? 'Historique indisponible.');
      }
    } catch (caught) {
      setRunsState('error');
      setRunsError(caught instanceof Error ? caught.message : 'Historique indisponible.');
    }
  }, []);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  const runImport = useCallback(async () => {
    setError('');
    setResult(null);
    const parsed = parseItems(raw);
    if (!parsed.items) { setError(parsed.error ?? 'Entrées invalides.'); return; }
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Session requise.'); return; }
      const response = await importPublicFacilityBatch({ token, items: parsed.items, attribution: attribution.trim() || DEFAULT_ATTRIBUTION });
      if (response.ok && response.data) {
        setResult(response.data);
        void loadRuns();
      } else {
        setError(response.error?.message ?? 'Import refusé.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import refusé.');
    } finally {
      setBusy(false);
    }
  }, [raw, attribution, loadRuns]);

  return (
    <div className="cardbox">
      <div className="eyebrow">Console d’import · OpenStreetMap</div>
      <p className="tiny muted">Importez des lieux publics (données ODbL) comme lieux <b>non revendiqués</b>. Un point hors zone pilote est refusé : jamais publié en silence.</p>
      <div className="chips" style={{ marginTop: 6 }}>
        <label className="chip" style={{ gap: 6, cursor: 'text', flex: 1 }}>
          <span className="dot" />
          Attribution
          <input value={attribution} onChange={(event) => setAttribution(event.target.value)} maxLength={120} aria-label="Attribution ODbL" />
        </label>
      </div>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        placeholder={'[\n  { "sourceRef": "osm:node/123", "name": "Boutique Kodjo", "category": "food", "latitude": 6.13, "longitude": 1.22 }\n]'}
        aria-label="Lieux à importer (JSON)"
        rows={5}
        spellCheck={false}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, marginTop: 6 }}
      />
      {error && <p className="sub" role="alert" style={{ color: 'var(--warn, #a33)' }}>{error}</p>}
      <div className="btnrow" style={{ marginTop: 6 }}>
        <button className="btn ok sm" type="button" style={{ width: 'auto' }} disabled={busy} onClick={() => void runImport()}><Upload size={14} /> {busy ? 'Import…' : 'Importer'}</button>
      </div>

      {result && (
        <div role="status" style={{ marginTop: 6 }}>
          <p className="tiny"><b>{result.imported}</b> lieu{result.imported === 1 ? '' : 'x'} traité{result.imported === 1 ? '' : 's'} · {result.created} créé{result.created === 1 ? '' : 's'} · {result.existing} déjà présent{result.existing === 1 ? '' : 's'}.</p>
          {result.results.slice(0, 12).map((item) => (
            <div className="kv" key={item.facilityId}>
              <span>{item.created ? 'Créé' : 'Existant'} · <code>{item.sourceRef}</code></span>
              <b>unclaimed</b>
            </div>
          ))}
        </div>
      )}

      <div className="eyebrow" style={{ marginTop: 10 }}>Runs d’opérateur · import & récoltes</div>
      {runsState === 'loading' && <Skeleton variant="kv" count={3} />}
      {runsState === 'error' && <p className="sub" role="alert">{runsError}</p>}
      {runsState === 'idle' && runs.length === 0 && <p className="tiny muted">Aucun run enregistré.</p>}
      {runsState === 'idle' && runs.slice(0, 8).map((run) => (
        <div className="kv" key={run.id}>
          <span>{run.operation}{run.provider ? ` · ${run.provider}` : ''} · {run.resultCount} résultat{run.resultCount === 1 ? '' : 's'}</span>
          <b>{run.outcome === 'success' ? 'OK' : run.errorClass ?? run.outcome}</b>
        </div>
      ))}
      <div className="btnrow" style={{ marginTop: 6 }}>
        <button className="btn ghost sm" type="button" style={{ width: 'auto' }} disabled={runsState === 'loading'} onClick={() => void loadRuns()}><RefreshCw size={14} /> Actualiser l’historique</button>
      </div>
    </div>
  );
}
