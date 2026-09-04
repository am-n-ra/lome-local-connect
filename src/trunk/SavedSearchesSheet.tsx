// Gate 5 (T-10c) — surface « Recherches enregistrées » (B19) sur l'API existante
// (GET/POST/DELETE /api/v2/saved-searches, prouvée en T-07c). Layout conforme à la
// maquette acceptée (SAVED sheet : .cardbox + .status ok/gray). Vocabulaire design.md.
import { Bell, BellOff, MapPin, Trash2 } from 'lucide-react';
import type { SavedSearch } from './types';

interface SavedSearchesSheetProps {
  searches: SavedSearch[];
  state: 'idle' | 'loading' | 'error';
  error: string;
  deletingId: string | null;
  onRefresh: () => void;
  onRerun: (search: SavedSearch) => void;
  onDelete: (search: SavedSearch) => void;
  onClose: () => void;
}

export function savedSearchConstraintSummary(search: SavedSearch): string {
  const parts: string[] = [];
  const c = search.constraints ?? {};
  const radius = c.radiusKm ?? c.radius ?? c.distanceKm;
  if (typeof radius === 'number') parts.push(`≤ ${radius} km`);
  const maxPrice = c.maxPrice ?? c.budgetMax ?? c.priceMax;
  if (typeof maxPrice === 'number') parts.push(`≤ ${maxPrice.toLocaleString('fr-FR')} FCFA`);
  const open = c.openNow ?? c.open;
  if (open === true) parts.push('Ouvert');
  if (parts.length === 0) return 'Toute disponibilité';
  return parts.join(' · ');
}

export function SavedSearchesSheet(props: SavedSearchesSheetProps) {
  return (
    <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-labelledby="saved-searches-title">
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Recherches enregistrées</span>
          <h2 id="saved-searches-title">Vos alertes</h2>
        </div>
        <span className="status gray">{props.searches.length}</span>
      </div>

      {props.state === 'loading' && <p className="tiny muted" role="status">Chargement de vos recherches…</p>}
      {props.state === 'error' && (
        <div className="inline-error" role="alert">
          {props.error || 'Impossible de charger vos recherches.'}{' '}
          <button type="button" className="btn ghost sm" onClick={props.onRefresh}>Réessayer</button>
        </div>
      )}

      {props.state !== 'loading' && props.searches.length === 0 && (
        <div className="cardbox">
          <p className="tiny muted">Aucune recherche enregistrée. Lancez une recherche puis enregistrez-la pour être alerté.</p>
        </div>
      )}

      {props.searches.map((search) => (
        <div className="cardbox" key={search.id}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 13 }}>{search.query}</b>
              <span className="tiny muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MapPin size={12} aria-hidden="true" /> {savedSearchConstraintSummary(search)}
              </span>
            </div>
            <span className={`status ${search.active ? 'ok' : 'gray'}`}>
              {search.active ? <Bell size={11} aria-hidden="true" /> : <BellOff size={11} aria-hidden="true" />}
              {search.active ? ' Active' : ' Inactive'}
            </span>
          </div>
          <div className="btnrow" style={{ marginTop: 8 }}>
            <button type="button" className="btn ok sm" onClick={() => props.onRerun(search)}>Relancer</button>
            <button
              type="button"
              className="btn ghost sm"
              aria-busy={props.deletingId === search.id}
              disabled={props.deletingId === search.id}
              onClick={() => props.onDelete(search)}
            >
              <Trash2 size={13} aria-hidden="true" /> {props.deletingId === search.id ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="secondary-button wide omni-pressable" style={{ marginTop: 10 }} onClick={props.onClose}>
        Retour à la carte
      </button>
    </section>
  );
}
