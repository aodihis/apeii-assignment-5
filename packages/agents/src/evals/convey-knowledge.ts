import { runHadithEvalSuite, type HadithEvalCase } from "./shared";

// Bukhari, Book 3, Hadith 104-105: the duty to convey knowledge to those absent; Mecca's sanctity.
const cases: HadithEvalCase[] = [
  {
    id: "mecca-sanctuary",
    input: "According to the Prophet, who made Mecca a sanctuary?",
    expected: "The Prophet said Allah, not the people, made Mecca a sanctuary.",
    citationPattern: "Hadith (104|105)",
  },
  {
    id: "mecca-fighting-permission",
    input: "Who gave the Prophet permission to fight in Mecca, and for how long?",
    expected:
      "Allah gave the Prophet permission to fight in Mecca for only a few hours on the day of the conquest, a permission not extended to anyone after him.",
    citationPattern: "Hadith 104",
  },
  {
    id: "convey-to-absent-duty",
    input: "What duty does the Prophet place on those present when knowledge is shared?",
    expected: "It is incumbent on those who are present to convey the information to those who are absent.",
    citationPattern: "Hadith (104|105)",
  },
  {
    id: "sanctity-blood-property-honor",
    input: "What did the Prophet say is sacred, comparing it to the sanctity of a specific day?",
    expected:
      "The Prophet said blood, property, and honor are sacred to one another, like the sanctity of that day in that month.",
    citationPattern: "Hadith 105",
  },
  {
    id: "narrator-sanctity-speech",
    input: "Who narrated the hadith about the sanctity of blood, property, and honor?",
    expected: "It was narrated by Abu Bakra.",
    citationPattern: "Hadith 105",
  },
];

await runHadithEvalSuite("hadith-convey-knowledge", cases);
