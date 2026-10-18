import { LensClient } from "@anvia/lens";

let client: LensClient | undefined;

// Self-hosted Anvia Lens (see infra/lens). `optional: true` means the client
// quietly no-ops when no connection env vars are set, so tracing stays off by
// default without the agent needing to branch on it.
export function getLens(): LensClient {
  if (!client) {
    client = new LensClient({
      baseUrl: process.env.ANVIA_LENS_BASE_URL,
      publicKey: process.env.ANVIA_LENS_PUBLIC_KEY,
      secretKey: process.env.ANVIA_LENS_SECRET_KEY,
      serviceName: "apeii-5-agent",
      optional: true,
    });
  }
  return client;
}
