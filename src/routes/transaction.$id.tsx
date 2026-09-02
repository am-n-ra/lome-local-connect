import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { z } from "zod";
import { CartePage } from "@/components/omni/CartePage";
import { useAuth } from "@/lib/auth";
import { getTransactionTimeline } from "@/lib/checkout.functions";
import { useServerFn } from "@/lib/useServerFn";

export const Route = createFileRoute("/transaction/$id")({
  params: {
    parse: (params) => z.object({ id: z.string().uuid() }).parse(params),
  },
  head: ({ params }) => ({
    meta: [
      { title: "Transaction Omni — Room persistante" },
      {
        name: "description",
        content: "Reprenez votre transaction Omni, son QR, son paiement externe et sa livraison.",
      },
      { property: "og:title", content: "Transaction Omni — Room persistante" },
    ],
  }),
  component: TransactionRoute,
});

function TransactionRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const loadTimeline = useServerFn(getTransactionTimeline);
  const [seller, setSeller] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void loadTimeline({ data: { transactionId: id } })
      .then((timeline) => {
        if (!active) return;
        if (timeline.transaction.viewer_role === "seller") {
          setSeller(true);
          navigate({ to: "/vendeur", search: { transactionId: id }, replace: true });
        }
      })
      .catch(() => {
        // CartePage owns the buyer-facing auth/error surface and remains the fallback.
      });
    return () => {
      active = false;
    };
  }, [id, loadTimeline, loading, navigate, user]);

  if (seller) return null;
  return <CartePage initialTransactionId={id} cleanUi />;
}
