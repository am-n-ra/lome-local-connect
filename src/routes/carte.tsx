import { createFileRoute } from "@tanstack/react-router";
import { CartePage } from "@/components/omni/CartePage";

export const Route = createFileRoute("/carte")({
  head: () => ({
    meta: [
      { title: "Carte des commerces à Lomé — OmniView" },
      {
        name: "description",
        content:
          "Explorez la carte OmniView : commerces ouverts, produits disponibles, distance et itinéraire à pied dans Lomé.",
      },
      { property: "og:title", content: "Carte des commerces à Lomé — OmniView" },
      { property: "og:description", content: "Trouvez un produit disponible près de vous à Lomé." },
    ],
  }),
  component: CartePage,
});
