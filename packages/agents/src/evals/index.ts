// Runs all hadith eval suites, one per metric, in sequence.
import { run as runCorrectness } from "./correctness";
import { run as runAnswerRelevancy } from "./answer-relevancy";
import { run as runContains } from "./contains";

await runCorrectness();
await runAnswerRelevancy();
await runContains();
