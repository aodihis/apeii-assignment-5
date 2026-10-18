import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // Must run before the React plugin so routes are generated first.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  // Exposes PUBLIC_API_URL (loaded from the root .env) to client code as
  // import.meta.env.VITE_API_URL — Vite only injects process.env itself here,
  // in vite.config.ts, not into the browser bundle.
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.PUBLIC_API_URL ?? ""),
  },
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    proxy: {
      // Forward /api/* to the Hono API, stripping the /api prefix.
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 3000}`,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
