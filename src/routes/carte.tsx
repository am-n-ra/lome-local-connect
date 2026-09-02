import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CartePage } from "@/components/omni/CartePage";

export const Route = createFileRoute("/carte")({
  validateSearch: z.object({
    transactionId: z.string().uuid().optional(),
    requestId: z.string().uuid().optional(),
    responseId: z.string().uuid().optional(),
  }),
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarteRoute,
});

function CarteRoute() {
  const { transactionId, requestId, responseId } = Route.useSearch();
  return (
    <CartePage
      cleanUi
      {...(transactionId ? { initialTransactionId: transactionId } : {})}
      {...(requestId ? { initialDemandRequestId: requestId } : {})}
      {...(responseId ? { initialDemandResponseId: responseId } : {})}
    />
  );
}
