import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleApi } from "./src/server/http";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "api-server",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith("/api/v2")) {
            const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
            const handled = await handleApi(req, res, url.pathname, url);
            if (handled) return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

