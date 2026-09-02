import { createFileRoute } from "@tanstack/react-router";

import { CartePage } from "@/components/omni/CartePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Omni — Trouvez l’offre près de vous" },
      { name: "description", content: "Explorez les commerces et services autour de vous, puis vérifiez leur disponibilité en temps réel avec Omni." },
      { property: "og:title", content: "Omni — Trouvez l’offre près de vous" },
      { property: "og:description", content: "Explorez les commerces et services autour de vous, puis vérifiez leur disponibilité en temps réel avec Omni." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CleanBuyerRoute,
});

function CleanBuyerRoute() {
  return <CartePage cleanUi />;
}
