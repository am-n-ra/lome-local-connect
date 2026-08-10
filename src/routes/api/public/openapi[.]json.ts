import { createFileRoute } from "@tanstack/react-router";
import { CORS } from "@/lib/public-api.server";

const facilitySchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    category: { type: "string" },
    description: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    neighbourhood: { type: ["string", "null"] },
    latitude: { type: "number" },
    longitude: { type: "number" },
    status: { type: "string", enum: ["unclaimed", "unconfirmed", "certified", "confirmed"] },
    type: { type: "string", enum: ["fixe", "mobile"] },
    is_online: { type: "boolean" },
    product_count: { type: "integer" },
    min_price: { type: ["integer", "null"] },
  },
} as const;

const spec = {
  openapi: "3.1.0",
  info: {
    title: "OmniView Public API",
    version: "1.0.0",
    description:
      "Lecture seule : commerces de Lomé référencés par OmniView, leurs produits en stock et les statistiques du marché. Aucune authentification, 120 requêtes/minute/IP.",
    license: { name: "ODbL (données OpenStreetMap)", url: "https://opendatacommons.org/licenses/odbl/" },
  },
  servers: [{ url: "/api/public/v1" }],
  paths: {
    "/facilities": {
      get: {
        summary: "Liste des commerces",
        parameters: [
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
          { name: "category", in: "query", schema: { type: "string", maxLength: 40 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["unclaimed", "unconfirmed", "certified", "confirmed"] },
          },
          { name: "neighbourhood", in: "query", schema: { type: "string", maxLength: 80 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        ],
        responses: {
          "200": {
            description: "Commerces",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: facilitySchema },
                    paging: {
                      type: "object",
                      properties: {
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        count: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Paramètres invalides" },
          "429": { description: "Trop de requêtes" },
        },
      },
    },
    "/facilities/{id}": {
      get: {
        summary: "Détail d'un commerce et ses produits",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Commerce" },
          "404": { description: "Introuvable" },
          "429": { description: "Trop de requêtes" },
        },
      },
    },
    "/stats": {
      get: {
        summary: "Statistiques publiques du marché",
        responses: { "200": { description: "Statistiques" } },
      },
    },
  },
  components: { schemas: { Facility: facilitySchema } },
} as const;

export const Route = createFileRoute("/api/public/openapi.json")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () =>
        new Response(JSON.stringify(spec, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8", ...CORS },
        }),
    },
  },
});
