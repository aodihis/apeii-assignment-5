import { runHadithEvalSuite, type HadithEvalCase } from "./shared";

// Bukhari, Book 3, Hadith 103: Aisha asking again until she understood; reckoning on the Day of Resurrection.
const cases: HadithEvalCase[] = [
  {
    id: "aisha-ask-again",
    input: "What did Aisha do whenever she heard something she did not understand?",
    expected: "Whenever Aisha heard something she did not understand, she used to ask again until she understood it completely.",
    citationPattern: "Hadith 103",
  },
  {
    id: "called-to-account",
    input: "What did the Prophet say happens to whoever is called to account on the Day of Resurrection?",
    expected: "The Prophet said whoever is called to account about his deeds will surely be punished.",
    citationPattern: "Hadith 103",
  },
  {
    id: "aisha-quran-objection",
    input: "Which Quranic verse did Aisha quote back to the Prophet about an easy reckoning?",
    expected: "Aisha quoted the verse that says he will receive an easy reckoning (84:8).",
    citationPattern: "Hadith 103",
  },
  {
    id: "prophet-clarify-reckoning",
    input: "How did the Prophet clarify the meaning of an easy reckoning after Aisha's question?",
    expected:
      "The Prophet explained that an easy reckoning means only the presentation of accounts, but whoever is argued about his account will be ruined.",
    citationPattern: "Hadith 103",
  },
  {
    id: "narrator-asking-again",
    input: "Who narrated the hadith about Aisha asking questions until she understood?",
    expected: "It was narrated by Ibn Abu Mulaika.",
    citationPattern: "Hadith 103",
  },
];

await runHadithEvalSuite("hadith-asking-until-understood", cases);
