import { answerRelevancy, contains, gEval, runEvalCli } from "@anvia/core/evals";
import { getLens } from "../lens";
import { runAgent } from "../agent";
import { getModel } from "../models";
import { COLLECTIONS } from "../store";

const model = getModel();

export type HadithEvalCase = {
  id: string;
  input: string;
  expected: string;
  // Regex source matched against the answer. At least one of the hadiths
  // relevant to the question must show up in the citation, e.g. "Hadith (104|105)".
  citationPattern: string;
};

// Runs one topic's cases against the eval-only Qdrant collection, scored on
// correctness, relevancy, and whether a related hadith was actually cited.
export function runHadithEvalSuite(name: string, cases: readonly HadithEvalCase[]) {
  return runEvalCli({
    name,
    cases,
    target: (input: string) =>
      runAgent({ messages: [{ role: "user", content: input }], collection: COLLECTIONS.eval }).text,
    reporters: [getLens().evalReporter({ includePayloads: true })],
    metrics: [
      gEval({
        name: "correctness",
        model,
        evaluationParams: ["input", "actualOutput", "expectedOutput"],
        criteria:
          "Judge whether the actual output conveys the same meaning as the expected hadith content, ignoring wording differences.",
        rubric: [
          { scoreRange: [0, 3], expectedOutcome: "Wrong hadith or missing key meaning." },
          { scoreRange: [4, 6], expectedOutcome: "Right hadith, but meaning is incomplete or unclear." },
          { scoreRange: [7, 10], expectedOutcome: "Conveys the same meaning as the expected hadith." },
        ],
        threshold: 0.7,
      }),
      answerRelevancy({ name: "answer_relevancy", model, threshold: 0.7 }),
      contains({
        name: "cites_related_hadith",
        expected: (args) => new RegExp((args.case as HadithEvalCase).citationPattern, "i"),
      }),
    ],
  });
}
