import { runHadithEvalSuite, type HadithEvalCase } from "./shared";

// Bukhari, Book 3, Hadith 101-102: fixing a day for women to learn religion.
const cases: HadithEvalCase[] = [
  {
    id: "women-day-request",
    input: "Why did some women ask the Prophet to set aside a special day for them?",
    expected:
      "Some women asked the Prophet to fix a day for them because the men were taking up all of his time; he agreed to give them one day for religious lessons and commandments.",
    citationPattern: "Hadith (101|102)",
  },
  {
    id: "three-children-shield",
    input: "What did the Prophet say about a woman whose three children died?",
    expected: "The Prophet said a woman whose three children die will be shielded by them from the Hellfire.",
    citationPattern: "Hadith (101|102)",
  },
  {
    id: "two-children-shield",
    input: "Does losing only two children also shield a mother from the Hellfire, according to the Prophet?",
    expected:
      "Yes - when asked about two children, the Prophet replied that even two children dying would shield her from the Hellfire.",
    citationPattern: "Hadith (101|102)",
  },
  {
    id: "children-age-qualifier",
    input: "According to Abu Huraira's note on this hadith, what age must the children be for this to apply?",
    expected:
      "Abu Huraira qualified that the three children referred to must not have reached the age of puberty (the age of committing sins).",
    citationPattern: "Hadith 102",
  },
  {
    id: "narrator-women-day",
    input: "Who narrated the hadith about women asking the Prophet for a day of religious teaching?",
    expected: "It was narrated by Abu Sa'id Al-Khudri.",
    citationPattern: "Hadith (101|102)",
  },
];

await runHadithEvalSuite("hadith-women-education", cases);
