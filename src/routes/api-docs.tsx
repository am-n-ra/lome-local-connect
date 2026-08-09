import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/omni/TopNav";

export const Route = createFileRoute("/api-docs")({
  component: ApiDocsPage,
  head: () => ({
    meta: [
      { title: "API publique OmniView — commerces de Lomé" },
      {
        name: "description",
        content:
          "Documentation de l'API publique OmniView : liste des commerces de Lomé, détail avec produits en stock et statistiques du marché, en lecture seule et sans clé.",
      },
      { property: "og:title", content: "API publique OmniView" },
      {
        property: "og:description",
        content: "Endpoints REST en lecture seule sur les commerces de Lomé référencés par OmniView.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/public/v1/facilities",
    desc: "Liste paginée des commerces. Filtres : search, category, status, neighbourhood, limit, offset.",
    example: "/api/public/v1/facilities?category=pharmacie&limit=10",
  },
  {
    method: "GET",
    path: "/api/public/v1/facilities/{id}",
    desc: "Détail d'un commerce avec ses produits et leur disponibilité.",
    example: "/api/public/v1/facilities/00000000-0000-0000-0000-000000000000",
  },
  {
    method: "GET",
    path: "/api/public/v1/stats",
    desc: "Statistiques publiques du marché de Lomé.",
    example: "/api/public/v1/stats",
  },
  {
    method: "GET",
    path: "/api/public/openapi.json",
    desc: "Spécification OpenAPI 3.1 complète.",
    example: "/api/public/openapi.json",
  },
];

function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
        <header>
          <h1 className="font-display text-2xl font-bold">API publique OmniView</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lecture seule, sans authentification, limitée à 120 requêtes par minute et par IP.
            Réponses JSON, CORS ouvert. Données commerces sous licence ODbL (OpenStreetMap).
          </p>
        </header>

        <ul className="space-y-3">
          {ENDPOINTS.map((e) => (
            <li key={e.path} className="omni-card space-y-2 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-forest/10 px-2 py-0.5 font-mono text-xs text-forest">
                  {e.method}
                </span>
                <code className="text-sm font-semibold">{e.path}</code>
              </div>
              <p className="text-sm text-muted-foreground">{e.desc}</p>
              <a className="text-sm text-primary underline" href={e.example}>
                Essayer : {e.example}
              </a>
            </li>
          ))}
        </ul>

        <section className="omni-card p-4">
          <h2 className="font-semibold">Codes de réponse</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>200 — succès</li>
            <li>400 — paramètres invalides</li>
            <li>404 — ressource introuvable</li>
            <li>429 — limite de débit dépassée</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
