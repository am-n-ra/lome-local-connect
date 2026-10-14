import { GUIDE_MOMENTS, guideLevels, GUIDE_UNCLAIMED_SILENCE } from './how-it-works';

/**
 * GUIDE-1b — le corps « Comment ça marche », rendu UNE fois et réutilisé par les deux
 * surfaces qui montrent le guide (l'accueil à la première fois, la feuille du menu).
 * Le contenu vient de `how-it-works.ts` (source unique) : jamais de texte dupliqué ici.
 *
 * Il EXPLIQUE, il ne BLOQUE jamais (S-31) : aucune action obligatoire dans ce corps.
 */
export function HowItWorksBody() {
  const levels = guideLevels();
  return (
    <>
      <div className="cardbox" style={{ marginTop: 10 }}>
        <div className="eyebrow">Les trois temps</div>
        {GUIDE_MOMENTS.map((moment) => (
          <div className="kv" key={moment.order} style={{ marginTop: 6, alignItems: 'flex-start' }}>
            <span>{moment.order}. <b>{moment.title}</b></span>
            <b className="tiny muted" style={{ fontWeight: 400, textAlign: 'right', maxWidth: '58%' }}>{moment.line}</b>
          </div>
        ))}
      </div>

      <div className="cardbox" style={{ marginTop: 8 }}>
        <div className="eyebrow">L’échelle d’existence · 0 → 4</div>
        {levels.map((entry) => (
          <div className="kv" key={entry.level} style={{ marginTop: 6, alignItems: 'flex-start' }}>
            <span>{entry.level} · <b>{entry.label}</b></span>
            <b className="tiny muted" style={{ fontWeight: 400, textAlign: 'right', maxWidth: '58%' }}>{entry.hint}</b>
          </div>
        ))}
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Beaucoup de lieux sont au niveau 0 : Omni les connaît, mais personne ne les gère encore. C’est vous qui les rendez transactables.
        </p>
      </div>

      <div className="cardbox" style={{ marginTop: 8 }}>
        <div className="eyebrow">Un lieu non revendiqué</div>
        <p className="sub">Omni ne peut pas dire {GUIDE_UNCLAIMED_SILENCE.join(', ')}. Il le dit franchement plutôt que d’inventer, puis propose de le revendiquer.</p>
      </div>
    </>
  );
}
