import { relativeAge, transactionStateLabel } from './transaction-time';
import type { FacilityCarts } from './facility-cart';
import { cartProductCount } from './facility-cart';
import type { OpenTransactionSummary, PublicFacility } from './types';

/** TF-8 recovery (maquette `recovery`) : après une panne, rien n'est perdu.
 * Lecture seule d'états existants — panier (session), dernière recherche commise,
 * transactions reprenables. Aucune persistance neuve, aucun appel neuf.
 */

export function RecoveryCartRow({ carts, facilities, onOpenFacility }: {
  carts: FacilityCarts;
  facilities: readonly PublicFacility[];
  onOpenFacility: (facility: PublicFacility) => void;
}) {
  const entries = Object.entries(carts).filter(([, ids]) => ids.length > 0);
  const total = entries.reduce((count, [, ids]) => count + ids.length, 0);
  return (
    <div className="cardbox" style={{ marginTop: 8 }}>
      <div className="kv"><span>Votre panier</span><b>{total === 0 ? 'Vide' : `Conservé (${total} produit${total === 1 ? '' : 's'})`}</b></div>
      {entries.map(([facilityId]) => {
        const count = cartProductCount(carts, facilityId);
        const facility = facilities.find((item) => item.id === facilityId) ?? null;
        if (!facility) {
          return (
            <div className="kv" key={facilityId}><span>Vendeur hors vue</span><b>{count} produit{count === 1 ? '' : 's'}</b></div>
          );
        }
        return (
          <div className="kv" key={facilityId}>
            <span>{facility.name}</span>
            <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 26 }} onClick={() => onOpenFacility(facility)}>
              Revoir · {count}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function RecoverySearchRow({ lastQuery, onResume }: {
  lastQuery: string;
  onResume: (query: string) => void;
}) {
  return (
    <div className="cardbox" style={{ marginTop: 8 }}>
      <div className="kv"><span>Votre recherche</span><b>{lastQuery ? 'Conservée' : 'Aucune'}</b></div>
      {lastQuery && (
        <div className="kv">
          <span>{lastQuery}</span>
          <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 26 }} onClick={() => onResume(lastQuery)}>
            Revenir à ma recherche
          </button>
        </div>
      )}
    </div>
  );
}

export function RecoveryTxnsRow({ transactions, state, onResume }: {
  transactions: OpenTransactionSummary[];
  state: 'idle' | 'loading' | 'error';
  onResume: (transaction: OpenTransactionSummary) => void;
}) {
  return (
    <div className="cardbox" style={{ marginTop: 8 }}>
      <div className="kv"><span>Transaction en cours</span><b>{state === 'loading' ? 'Chargement…' : transactions.length === 0 ? 'Aucune' : `${transactions.length} reprenable${transactions.length === 1 ? '' : 's'}`}</b></div>
      {state === 'error' && <p className="sub" role="alert">Reprise indisponible pour le moment.</p>}
      {transactions.map((transaction) => (
        <div className="kv" key={transaction.transactionId}>
          <span>{transaction.productName ?? 'Transaction'} · {relativeAge(transaction.lastEventAt)}</span>
          <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 26 }} onClick={() => onResume(transaction)}>
            Reprendre · {transactionStateLabel(transaction.state)}
          </button>
        </div>
      ))}
    </div>
  );
}
