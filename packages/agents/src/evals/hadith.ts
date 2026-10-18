import { answerRelevancy, contains, gEval, runEvalCli } from "@anvia/core/evals";
import { getLens } from "../lens";
import { loadHadiths } from "../hadith";
import { runAgent } from "../agent";
import { getModel } from "../models";
import { COLLECTIONS } from "../store";

const model = getModel();
const hadiths = await loadHadiths(new URL("../../../../data/hadiths-eval.json", import.meta.url));

const cases = hadiths.map((hadith) => ({
  id: hadith.id,
  input: `What does the hadith about "${hadith.babName}" say? (Bukhari, Book ${hadith.book}, Hadith ${hadith.hadithNumber})`,
  expected: hadith.text,
  metadata: { pattern: `Hadith ${hadith.hadithNumber}` },
}));

await runEvalCli({
  name: "hadith",
  cases,
  target: (input: string) =>
    runAgent({ messages: [{ role: "user", content: input }], collection: COLLECTIONS.eval }),
  reporters: [getLens().evalReporter({ includePayloads: true })],
  metrics: [
    gEval({
      name: "correctness",
      model,
      evaluationParams: ["input", "actualOutput", "expectedOutput"],
      criteria: "Judge whether the actual output conveys the same meaning as the expected hadith text, ignoring wording differences.",
      rubric: [
        { scoreRange: [0, 3], expectedOutcome: "Wrong hadith or missing key meaning." },
        { scoreRange: [4, 6], expectedOutcome: "Right hadith, but meaning is incomplete or unclear." },
        { scoreRange: [7, 10], expectedOutcome: "Conveys the same meaning as the expected hadith." },
      ],
      threshold: 0.7,
    }),
    answerRelevancy({ name: "answer_relevancy", model, threshold: 0.7 }),
    contains({ name: "cites_hadith_number", expected: (args) => new RegExp(String(args.case.metadata?.pattern), "i") }),
  ],
});
