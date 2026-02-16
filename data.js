const batches = [
  { id: 1, name: "المجموعة الأولى" }
];

const terms = [
  { id: 1, batch: 1, english: "Democracy", arabic: "الديمقراطية" },
  { id: 2, batch: 1, english: "Constitution", arabic: "الدستور" },
  { id: 3, batch: 1, english: "Election", arabic: "الانتخابات" },
  { id: 4, batch: 1, english: "Parliament", arabic: "البرلمان" }
];

const exercisesData = [
  {
    batch: 1,
    sentence: "The people vote in an _____ every four years.",
    blank: "_____",
    options: ["election", "army", "law", "court"],
    correctIndex: 0,
    explanation: "Election تعني انتخابات"
  }
];

function getTermsByBatch(batchId) {
  return terms.filter(t => t.batch === batchId);
}

function getExercisesByBatch(batchId) {
  return exercisesData.filter(e => e.batch === batchId);
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
