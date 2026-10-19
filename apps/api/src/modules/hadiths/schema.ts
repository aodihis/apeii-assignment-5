import { z } from "zod";

export const hadithIdParamSchema = z.object({
  id: z.string().min(1),
});

export const hadithMetadataSchema = z.object({
  collection: z.string(),
  book: z.number(),
  hadithNumber: z.string(),
  babName: z.string().optional(),
  grade: z.string().optional(),
});

export const hadithSchema = z.object({
  id: z.string(),
  text: z.string(),
  metadata: hadithMetadataSchema.optional(),
});

export type Hadith = z.infer<typeof hadithSchema>;
