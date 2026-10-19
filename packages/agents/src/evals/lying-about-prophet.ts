import { runHadithEvalSuite, type HadithEvalCase } from "./shared";

// Bukhari, Book 3, Hadith 106-110: the sin of lying against the Prophet.
const cases: HadithEvalCase[] = [
  {
    id: "ali-lie-warning",
    input: "What did Ali report the Prophet said about lying against him?",
    expected: "Ali reported the Prophet said whoever intentionally tells a lie against him will enter the Hellfire.",
    citationPattern: "Hadith 106",
  },
  {
    id: "zubair-lie-warning",
    input: "What did Az-Zubair say he heard the Prophet say about lying against him?",
    expected: "Az-Zubair heard the Prophet say whoever lies against him intentionally should occupy his seat in Hellfire.",
    citationPattern: "Hadith 107",
  },
  {
    id: "anas-hesitation",
    input: "Why did Anas say he limited how many hadiths he narrated?",
    expected: "Anas said he was cautious because the Prophet warned that whoever lies against him intentionally should occupy his seat in Hellfire.",
    citationPattern: "Hadith 108",
  },
  {
    id: "salama-ascribe-warning",
    input: "What did Salama hear the Prophet say about falsely ascribing statements to him?",
    expected:
      "Salama heard the Prophet say whoever intentionally ascribes to him what he did not say should occupy his seat in Hellfire.",
    citationPattern: "Hadith 109",
  },
  {
    id: "abu-huraira-name-kunya-dream",
    input: "According to Abu Huraira, what did the Prophet say about using his name, his Kunya, and dreaming of him?",
    expected:
      "The Prophet said to use his name but not his Kunya (Abul Qasim), that whoever sees him in a dream has truly seen him since Satan cannot impersonate him, and that whoever lies against him intentionally should occupy his seat in Hellfire.",
    citationPattern: "Hadith 110",
  },
];

await runHadithEvalSuite("hadith-lying-about-prophet", cases);
