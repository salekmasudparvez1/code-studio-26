import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";

function apiMiddlewarePlugin(): Plugin {
  return {
    name: "api-backend-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, "http://localhost:3000");
          const queryParams: Record<string, string> = {};
          urlObj.searchParams.forEach((val, key) => {
            queryParams[key] = val;
          });

          let bodyData: any = null;
          if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks).toString("utf8");
            if (rawBody) {
              try {
                bodyData = JSON.parse(rawBody);
              } catch {
                bodyData = {};
              }
            }
          }

          const { handleApiRequest } = await server.ssrLoadModule("./server/apiHandler.ts");
          const result = await handleApiRequest(
            urlObj.pathname,
            req.method || "GET",
            bodyData,
            queryParams
          );

          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.data));
        } catch (err: any) {
          console.error("API middleware error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err?.message || "Internal Server Error" }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawDomain = env.VITE_AUTH0_DOMAIN || env.AUTH0_DOMAIN || "";
  const cleanDomain = rawDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  const clientId = env.VITE_AUTH0_CLIENT_ID || env.AUTH0_CLIENT_ID || "";

  return {
    plugins: [react(), apiMiddlewarePlugin()],
    define: {
      "import.meta.env.VITE_AUTH0_DOMAIN": JSON.stringify(cleanDomain),
      "import.meta.env.VITE_AUTH0_CLIENT_ID": JSON.stringify(clientId),
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
