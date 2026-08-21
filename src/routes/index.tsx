import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: V2Landing });

function V2Landing() {
  return (
    <main className="v2-shell">
      <section className="v2-card" aria-labelledby="v2-title">
        <p className="v2-kicker">OMNI / V2 REBUILD</p>
        <h1 id="v2-title">Nouvelle base en préparation.</h1>
        <p>
          Cette branche est une base propre et isolée pour reconstruire Omni. La version actuelle
          reste disponible sur la branche <code>main</code> et son déploiement de production.
        </p>
        <div className="v2-status" role="status">
          V2 clean-slate · aucune fonctionnalité V1 active
        </div>
      </section>
    </main>
  );
}
