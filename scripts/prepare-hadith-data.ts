import { readFile, writeFile } from "node:fs/promises";

type RawHadith = {
  collection: string;
  bookNumber: string;
  hadithNumber: string;
  englishBabName: string;
  englishText: string;
  englishgrade1: string;
};

type Hadith = {
  id: string;
  collection: string;
  book: number;
  hadithNumber: string;
  babName: string;
  grade: string;
  text: string;
};

const SOURCE_PATH = "C:/workspace/hadiths-assistant/data/imports/hadiths.json";
const DATA_COUNT = 100;
const EVAL_COUNT = 10;

function cleanText(text: string): string {
  return text
    .replace(/<\/?p>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const raw: { HadithTable: RawHadith[] } = JSON.parse(await readFile(SOURCE_PATH, "utf8"));
  const clean = raw.HadithTable
    .filter((h) => h.collection === "bukhari" && h.englishgrade1 === "Sahih" && h.englishText?.trim())
    .map((h): Hadith => ({
      id: `bukhari-${h.hadithNumber}`,
      collection: h.collection,
      book: Number(h.bookNumber),
      hadithNumber: h.hadithNumber,
      babName: h.englishBabName,
      grade: h.englishgrade1,
      text: cleanText(h.englishText),
    }));

  const data = clean.slice(0, DATA_COUNT);
  const evalSet = clean.slice(DATA_COUNT, DATA_COUNT + EVAL_COUNT);

  await writeFile(new URL("../data/hadiths.json", import.meta.url), JSON.stringify(data, null, 2));
  await writeFile(new URL("../data/hadiths-eval.json", import.meta.url), JSON.stringify(evalSet, null, 2));

  console.log(`wrote ${data.length} hadiths to data/hadiths.json`);
  console.log(`wrote ${evalSet.length} hadiths to data/hadiths-eval.json`);
}

await main();
