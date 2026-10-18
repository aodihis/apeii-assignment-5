import { readFile } from "node:fs/promises";
import type { TextDocument } from "@anvia/core/documents";

export type HadithMetadata = {
  collection: string;
  book: number;
  hadithNumber: string;
  babName: string;
  grade: string;
};

export type Hadith = HadithMetadata & { id: string; text: string };

export async function loadHadiths(path: URL): Promise<Hadith[]> {
  return JSON.parse(await readFile(path, "utf8"));
}

export function toDocuments(hadiths: Hadith[]): TextDocument<HadithMetadata>[] {
  return hadiths.map(({ id, text, ...metadata }) => ({ id, text, metadata }));
}
