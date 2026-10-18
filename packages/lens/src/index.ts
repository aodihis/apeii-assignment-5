import { LensClient } from "@anvia/lens";

const clients = new Map<string, LensClient>();

// `optional: true` makes the client a no-op when no ANVIA_LENS_* env vars are set,
// so tracing stays off by default without callers needing to branch on it.
export function getLens(serviceName: string): LensClient {
  let client = clients.get(serviceName);
  if (!client) {
    client = new LensClient({
      baseUrl: process.env.ANVIA_LENS_BASE_URL,
      publicKey: process.env.ANVIA_LENS_PUBLIC_KEY,
      secretKey: process.env.ANVIA_LENS_SECRET_KEY,
      serviceName,
      optional: true,
    });
    clients.set(serviceName, client);
  }
  return client;
}
