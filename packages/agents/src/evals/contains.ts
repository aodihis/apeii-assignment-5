import { fileURLToPath } from "node:url";
import { contains, runEvalCli } from "@anvia/core/evals";
import { getLens } from "../lens";
import { runAgent } from "../agent";
import { COLLECTIONS } from "../store";

// Same 20 cases as correctness.ts and answer-relevancy.ts (Bukhari, Book 3, Hadith 101-110).
// Each case's pattern matches at least one hadith number relevant to the question -
// e.g. asking about wudhu should cite a wudhu hadith - to confirm a related hadith was cited.
const cases = [
  {
    id: "women-day-request",
    input: "Why did some women ask the Prophet to set aside a special day for them?",
    metadata: { pattern: "Hadith (101|102)" },
  },
  {
    id: "three-children-shield",
    input: "What did the Prophet say about a woman whose three children died?",
    metadata: { pattern: "Hadith (101|102)" },
  },
  {
    id: "two-children-shield",
    input: "Does losing only two children also shield a mother from the Hellfire, according to the Prophet?",
    metadata: { pattern: "Hadith (101|102)" },
  },
  {
    id: "children-age-qualifier",
    input: "According to Abu Huraira's note on this hadith, what age must the children be for this to apply?",
    metadata: { pattern: "Hadith 102" },
  },
  {
    id: "narrator-women-day",
    input: "Who narrated the hadith about women asking the Prophet for a day of religious teaching?",
    metadata: { pattern: "Hadith (101|102)" },
  },
  {
    id: "aisha-ask-again",
    input: "What did Aisha do whenever she heard something she did not understand?",
    metadata: { pattern: "Hadith 103" },
  },
  {
    id: "called-to-account",
    input: "What did the Prophet say happens to whoever is called to account on the Day of Resurrection?",
    metadata: { pattern: "Hadith 103" },
  },
  {
    id: "aisha-quran-objection",
    input: "Which Quranic verse did Aisha quote back to the Prophet about an easy reckoning?",
    metadata: { pattern: "Hadith 103" },
  },
  {
    id: "prophet-clarify-reckoning",
    input: "How did the Prophet clarify the meaning of an easy reckoning after Aisha's question?",
    metadata: { pattern: "Hadith 103" },
  },
  {
    id: "narrator-asking-again",
    input: "Who narrated the hadith about Aisha asking questions until she understood?",
    metadata: { pattern: "Hadith 103" },
  },
  {
    id: "mecca-sanctuary",
    input: "According to the Prophet, who made Mecca a sanctuary?",
    metadata: { pattern: "Hadith (104|105)" },
  },
  {
    id: "mecca-fighting-permission",
    input: "Who gave the Prophet permission to fight in Mecca, and for how long?",
    metadata: { pattern: "Hadith 104" },
  },
  {
    id: "convey-to-absent-duty",
    input: "What duty does the Prophet place on those present when knowledge is shared?",
    metadata: { pattern: "Hadith (104|105)" },
  },
  {
    id: "sanctity-blood-property-honor",
    input: "What did the Prophet say is sacred, comparing it to the sanctity of a specific day?",
    metadata: { pattern: "Hadith 105" },
  },
  {
    id: "narrator-sanctity-speech",
    input: "Who narrated the hadith about the sanctity of blood, property, and honor?",
    metadata: { pattern: "Hadith 105" },
  },
  {
    id: "ali-lie-warning",
    input: "What did Ali report the Prophet said about lying against him?",
    metadata: { pattern: "Hadith 106" },
  },
  {
    id: "zubair-lie-warning",
    input: "What did Az-Zubair say he heard the Prophet say about lying against him?",
    metadata: { pattern: "Hadith 107" },
  },
  {
    id: "anas-hesitation",
    input: "Why did Anas say he limited how many hadiths he narrated?",
    metadata: { pattern: "Hadith 108" },
  },
  {
    id: "salama-ascribe-warning",
    input: "What did Salama hear the Prophet say about falsely ascribing statements to him?",
    metadata: { pattern: "Hadith 109" },
  },
  {
    id: "abu-huraira-name-kunya-dream",
    input: "According to Abu Huraira, what did the Prophet say about using his name, his Kunya, and dreaming of him?",
    metadata: { pattern: "Hadith 110" },
  },
];

export async function run() {
  await runEvalCli({
    name: "hadith-contains",
    cases,
    target: (input: string) =>
      runAgent({ messages: [{ role: "user", content: input }], collection: COLLECTIONS.eval }).text,
    reporters: [getLens().evalReporter({ includePayloads: true })],
    metrics: [
      contains({
        name: "cites_related_hadith",
        expected: (args) => new RegExp(String(args.case.metadata?.pattern), "i"),
      }),
    ],
  });
}

// Run directly (e.g. `pnpm run eval:contains`) as well as from evals/index.ts.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
