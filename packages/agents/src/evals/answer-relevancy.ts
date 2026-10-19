import { fileURLToPath } from "node:url";
import { answerRelevancy, runEvalCli } from "@anvia/core/evals";
import { getLens } from "../lens";
import { runAgent } from "../agent";
import { getModel } from "../models";
import { COLLECTIONS } from "../store";

// Same 20 cases as correctness.ts and contains.ts (Bukhari, Book 3, Hadith 101-110),
// each file kept self-contained and scored on a single metric.
const cases = [
  {
    id: "women-day-request",
    input: "Why did some women ask the Prophet to set aside a special day for them?",
  },
  {
    id: "three-children-shield",
    input: "What did the Prophet say about a woman whose three children died?",
  },
  {
    id: "two-children-shield",
    input: "Does losing only two children also shield a mother from the Hellfire, according to the Prophet?",
  },
  {
    id: "children-age-qualifier",
    input: "According to Abu Huraira's note on this hadith, what age must the children be for this to apply?",
  },
  {
    id: "narrator-women-day",
    input: "Who narrated the hadith about women asking the Prophet for a day of religious teaching?",
  },
  {
    id: "aisha-ask-again",
    input: "What did Aisha do whenever she heard something she did not understand?",
  },
  {
    id: "called-to-account",
    input: "What did the Prophet say happens to whoever is called to account on the Day of Resurrection?",
  },
  {
    id: "aisha-quran-objection",
    input: "Which Quranic verse did Aisha quote back to the Prophet about an easy reckoning?",
  },
  {
    id: "prophet-clarify-reckoning",
    input: "How did the Prophet clarify the meaning of an easy reckoning after Aisha's question?",
  },
  {
    id: "narrator-asking-again",
    input: "Who narrated the hadith about Aisha asking questions until she understood?",
  },
  {
    id: "mecca-sanctuary",
    input: "According to the Prophet, who made Mecca a sanctuary?",
  },
  {
    id: "mecca-fighting-permission",
    input: "Who gave the Prophet permission to fight in Mecca, and for how long?",
  },
  {
    id: "convey-to-absent-duty",
    input: "What duty does the Prophet place on those present when knowledge is shared?",
  },
  {
    id: "sanctity-blood-property-honor",
    input: "What did the Prophet say is sacred, comparing it to the sanctity of a specific day?",
  },
  {
    id: "narrator-sanctity-speech",
    input: "Who narrated the hadith about the sanctity of blood, property, and honor?",
  },
  {
    id: "ali-lie-warning",
    input: "What did Ali report the Prophet said about lying against him?",
  },
  {
    id: "zubair-lie-warning",
    input: "What did Az-Zubair say he heard the Prophet say about lying against him?",
  },
  {
    id: "anas-hesitation",
    input: "Why did Anas say he limited how many hadiths he narrated?",
  },
  {
    id: "salama-ascribe-warning",
    input: "What did Salama hear the Prophet say about falsely ascribing statements to him?",
  },
  {
    id: "abu-huraira-name-kunya-dream",
    input: "According to Abu Huraira, what did the Prophet say about using his name, his Kunya, and dreaming of him?",
  },
];

export async function run() {
  const model = getModel();

  await runEvalCli({
    name: "hadith-answer-relevancy",
    cases,
    target: (input: string) =>
      runAgent({ messages: [{ role: "user", content: input }], collection: COLLECTIONS.eval }).text,
    reporters: [getLens().evalReporter({ includePayloads: true })],
    metrics: [answerRelevancy({ name: "answer_relevancy", model, threshold: 0.7 })],
  });
}

// Run directly (e.g. `pnpm run eval:answer-relevancy`) as well as from evals/index.ts.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
