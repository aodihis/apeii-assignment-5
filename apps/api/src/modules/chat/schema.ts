import { z } from "zod";

export const chatQuerySchema = z.object({
  sessionId: z.string().min(1),
});
