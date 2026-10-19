import { hc } from "hono/client";
import type { AppType } from "@apeii-5/api";

// Typed client for the API's plain-JSON endpoints (sessions, hadiths). /chat is excluded:
// it's a streaming ndjson protocol owned by @anvia/client/@anvia/server
// (createHttpClientTransport), not a request/response Hono route this client fits.
// "/api" goes through the Vite dev proxy to the API (see vite.config.ts).
export const apiClient = hc<AppType>("/api");
