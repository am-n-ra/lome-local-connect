import { createFileRoute } from "@tanstack/react-router";

import { CartePage } from "@/components/omni/CartePage";

export const Route = createFileRoute("/")({
  component: CleanBuyerRoute,
});

function CleanBuyerRoute() {
  return <CartePage cleanUi />;
}
