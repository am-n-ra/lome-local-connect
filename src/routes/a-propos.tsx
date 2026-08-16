import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/a-propos")({
  beforeLoad: () => {
    throw redirect({ to: "/carte" });
  },
  head: () => ({
    meta: [
      { title: "Omni — Le monde est recherchable" },
      {
        name: "description",
        content:
          "Entrez directement dans le globe Omni pour découvrir l'offre et la demande dans le monde.",
      },
    ],
  }),
  component: () => null,
});
