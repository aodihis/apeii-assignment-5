import { gEval, runEvalCli } from "@anvia/core/evals";
import { getLens } from "../lens";
import { runAgent } from "../agent";
import { getModel } from "../models";
import { COLLECTIONS } from "../store";

// 20 cases grounded in the 10 hadiths of the eval-only Qdrant collection
// (Bukhari, Book 3, Hadith 101-110).
const cases = [
  {
    id: "women-day-request",
    input: "Why did some women ask the Prophet to set aside a special day for them?",
    expected:
      "Some women asked the Prophet to fix a day for them because the men were taking up all of his time; he agreed to give them one day for religious lessons and commandments.",
  },
  {
    id: "three-children-shield",
    input: "What did the Prophet say about a woman whose three children died?",
    expected: "The Prophet said a woman whose three children die will be shielded by them from the Hellfire.",
  },
  {
    id: "two-children-shield",
    input: "Does losing only two children also shield a mother from the Hellfire, according to the Prophet?",
    expected:
      "Yes - when asked about two children, the Prophet replied that even two children dying would shield her from the Hellfire.",
  },
  {
    id: "children-age-qualifier",
    input: "According to Abu Huraira's note on this hadith, what age must the children be for this to apply?",
    expected:
      "Abu Huraira qualified that the three children referred to must not have reached the age of puberty (the age of committing sins).",
  },
  {
    id: "narrator-women-day",
    input: "Who narrated the hadith about women asking the Prophet for a day of religious teaching?",
    expected: "It was narrated by Abu Sa'id Al-Khudri.",
  },
  {
    id: "aisha-ask-again",
    input: "What did Aisha do whenever she heard something she did not understand?",
    expected: "Whenever Aisha heard something she did not understand, she used to ask again until she understood it completely.",
  },
  {
    id: "called-to-account",
    input: "What did the Prophet say happens to whoever is called to account on the Day of Resurrection?",
    expected: "The Prophet said whoever is called to account about his deeds will surely be punished.",
  },
  {
    id: "aisha-quran-objection",
    input: "Which Quranic verse did Aisha quote back to the Prophet about an easy reckoning?",
    expected: "Aisha quoted the verse that says he will receive an easy reckoning (84:8).",
  },
  {
    id: "prophet-clarify-reckoning",
    input: "How did the Prophet clarify the meaning of an easy reckoning after Aisha's question?",
    expected:
      "The Prophet explained that an easy reckoning means only the presentation of accounts, but whoever is argued about his account will be ruined.",
  },
  {
    id: "narrator-asking-again",
    input: "Who narrated the hadith about Aisha asking questions until she understood?",
    expected: "It was narrated by Ibn Abu Mulaika.",
  },
  {
    id: "mecca-sanctuary",
    input: "According to the Prophet, who made Mecca a sanctuary?",
    expected: "The Prophet said Allah, not the people, made Mecca a sanctuary.",
  },
  {
    id: "mecca-fighting-permission",
    input: "Who gave the Prophet permission to fight in Mecca, and for how long?",
    expected:
      "Allah gave the Prophet permission to fight in Mecca for only a few hours on the day of the conquest, a permission not extended to anyone after him.",
  },
  {
    id: "convey-to-absent-duty",
    input: "What duty does the Prophet place on those present when knowledge is shared?",
    expected: "It is incumbent on those who are present to convey the information to those who are absent.",
  },
  {
    id: "sanctity-blood-property-honor",
    input: "What did the Prophet say is sacred, comparing it to the sanctity of a specific day?",
    expected:
      "The Prophet said blood, property, and honor are sacred to one another, like the sanctity of that day in that month.",
  },
  {
    id: "narrator-sanctity-speech",
    input: "Who narrated the hadith about the sanctity of blood, property, and honor?",
    expected: "It was narrated by Abu Bakra.",
  },
  {
    id: "ali-lie-warning",
    input: "What did Ali report the Prophet said about lying against him?",
    expected: "Ali reported the Prophet said whoever intentionally tells a lie against him will enter the Hellfire.",
  },
  {
    id: "zubair-lie-warning",
    input: "What did Az-Zubair say he heard the Prophet say about lying against him?",
    expected: "Az-Zubair heard the Prophet say whoever lies against him intentionally should occupy his seat in Hellfire.",
  },
  {
    id: "anas-hesitation",
    input: "Why did Anas say he limited how many hadiths he narrated?",
    expected:
      "Anas said he was cautious because the Prophet warned that whoever lies against him intentionally should occupy his seat in Hellfire.",
  },
  {
    id: "salama-ascribe-warning",
    input: "What did Salama hear the Prophet say about falsely ascribing statements to him?",
    expected:
      "Salama heard the Prophet say whoever intentionally ascribes to him what he did not say should occupy his seat in Hellfire.",
  },
  {
    id: "abu-huraira-name-kunya-dream",
    input: "According to Abu Huraira, what did the Prophet say about using his name, his Kunya, and dreaming of him?",
    expected:
      "The Prophet said to use his name but not his Kunya (Abul Qasim), that whoever sees him in a dream has truly seen him since Satan cannot impersonate him, and that whoever lies against him intentionally should occupy his seat in Hellfire.",
  },
];

const model = getModel();

await runEvalCli({
  name: "hadith-correctness",
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
  ],
});
