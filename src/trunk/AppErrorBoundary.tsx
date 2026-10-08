import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Filet de dernier recours. Un lancer de rendu (la classe `r.on2 is not a function`)
 * démonte TOUT l'arbre React : l'utilisateur voit une page blanche, et l'écran
 * « Reprendre où j'en étais » n'est plus atteignable — c'est-à-dire au moment précis
 * où il sert. La frontière garde le dernier état de l'app pour que « Recharger »
 * reparte d'un onglet propre et que « Réessayer » retente le rendu sans perdre la session.
 *
 * Rendu sans le vocabulaire de design (`body`/`.cardbox`/`.btn`/`.eyebrow`), monochrome,
 * accent réservé à la confiance. Ne remplace pas la gestion d'erreur locale : il ne
 * s'active que sur une panne de rendu non rattrapée.
 */
type Props = { children: ReactNode };
type State = { crashed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Le rapport console reste : une frontière masque l'écran blanc, jamais le défaut.
    console.error('[omni] render crashed, error boundary engaged', error, info.componentStack);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="body" style={{ display: 'grid', placeItems: 'center', minHeight: '100svh', padding: 24 }}>
        <div className="cardbox" style={{ maxWidth: 420, width: '100%' }}>
          <div className="eyebrow">Un imprévu</div>
          <h1>L’application s’est arrêtée</h1>
          <p className="sub">
            Rien n’est perdu : votre session, votre panier et vos transactions en cours sont conservés côté serveur.
          </p>
          <div className="btnrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn" onClick={() => { window.location.reload(); }}>Recharger</button>
            <button type="button" className="btn ghost" onClick={() => { this.setState({ crashed: false }); }}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }
}
