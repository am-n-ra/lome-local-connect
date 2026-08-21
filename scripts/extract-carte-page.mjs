import { readFileSync, writeFileSync } from "node:fs";

const routePath = "src/routes/carte.tsx";
const source = readFileSync(routePath, "utf8");
const lines = source.split("\n");
const imports = lines
  .slice(0, 32)
  .join("\n")
  .replace('import { createFileRoute, useNavigate } from "@tanstack/react-router";', 'import { useNavigate } from "@tanstack/react-router";');
const types = lines.slice(49, 61).join("\n");
const component = lines.slice(61).join("\n");
writeFileSync(
  "src/components/omni/CartePage.tsx",
  `${imports}\n${types}\n${component}`.replace("export const Route = createFileRoute(\"/carte\")({", "const unusedRoute = createFileRoute(\"/carte\")({"),
);
writeFileSync(
  "src/routes/carte.tsx",
  `import { createFileRoute } from "@tanstack/react-router";\nimport { CartePage } from "@/components/omni/CartePage";\n\nexport const Route = createFileRoute("/carte")({\n  head: () => ({\n    meta: [\n      { title: "Carte des commerces à Lomé — OmniView" },\n      {\n        name: "description",\n        content: "Explorez la carte OmniView : commerces ouverts, produits disponibles, distance et itinéraire à pied dans Lomé.",\n      },\n      { property: "og:title", content: "Carte des commerces à Lomé — OmniView" },\n      { property: "og:description", content: "Trouvez un produit disponible près de vous à Lomé." },\n    ],\n  }),\n  component: CartePage,\n});\n`,
);
const indexPath = "src/routes/index.tsx";
const index = readFileSync(indexPath, "utf8").replace('import { CartePage } from "./carte";', 'import { CartePage } from "@/components/omni/CartePage";');
writeFileSync(indexPath, index);
