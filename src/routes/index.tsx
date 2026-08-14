import { createFileRoute } from "@tanstack/react-router";

import { CartePage } from "./carte";

export const Route = createFileRoute("/")({
  component: CartePage,
});
