import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { hadithIdParamSchema } from "./schema";
import { getHadithById } from "./service";
import { logger } from "../../logger";

// Looked up by the agent-cited id in a hadith citation link, to show its full text in
// the frontend's slide-over panel.
export const hadithsRouter = new Hono().get("/:id", zValidator("param", hadithIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const hadith = await getHadithById(id);
  if (!hadith) {
    // A cited id that doesn't resolve usually means the agent hallucinated an id or the
    // collection was re-ingested with different ids since - worth a warn, not just a 404.
    logger.warn("hadith not found", { id });
    return c.json({ error: "Hadith not found" as const }, 404);
  }
  return c.json(hadith, 200);
});
