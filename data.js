// البيانات الكاملة للتطبيق
const batches = [
  {
    id: 1,
    name: 'المصطلحات السياسية والقانونية - الدفعة الأولى',
    description: 'مصطلحات سياسية وقانونية أساسية'
  },
  {
    id: 2,
    name: 'المصطلحات الاقتصادية والتجارية - الدفعة الثانية',
    description: 'مصطلحات اقتصادية وتجارية'
  }
];

const terms = {
  1: [
    { id: 1, english: 'Cooperative', arabic: 'تعاوني' },
    { id: 2, english: 'Sovereignty', arabic: 'السيادة' },
    { id: 3, english: 'Globalized', arabic: 'عولمة' },
    { id: 4, english: 'Era', arabic: 'عصر' },
    { id: 5, english: 'Multilateral', arabic: 'متعدد الأطراف' },
    { id: 6, english: 'Associated', arabic: 'مرتبط' },
    { id: 7, english: 'Absolute right', arabic: 'حق مطلق' },
    { id: 8, english: 'Emergence', arabic: 'ظهور' },
    { id: 9, english: 'Pandemics', arabic: 'أوبئة' },
    { id: 10, english: 'Revealed', arabic: 'كشف' },
    { id: 11, english: 'Starkly', arabic: 'بوضوح صارخ' },
    { id: 12, english: 'Compell', arabic: 'يجبر' }
    // ملاحظة: يمكنك إضافة باقي الـ 60 كلمة هنا بنفس التنسيق
  ],
  2: []
};

// نصوص القراءة والتحليل
const readingTexts = {
  1: {
    title: "Cooperative Sovereignty in a Globalized Era",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty, driven by the growing power of international institutions and multilateral agreements. 

Sovereignty, in its classical sense, has long been associated with the absolute right of a state to control its territory, resources, and population without external interference. However, the emergence of transnational challenges such as climate change, cyber-organized crime, and global pandemics has starkly revealed the limits of this concept. 

States are no longer capable of confronting these challenges individually, which has compelled them to negotiate and cede portions of their authority to global governance bodies. This shift propels a model known as "cooperative sovereignty" or "sovereignty as responsibility." 

Proponents argue that in an interconnected world, the ultimate exercise of sovereignty is the ability to participate effectively in international systems, shape global norms, and protect one's citizens from threats that originate beyond borders. This requires a pragmatic surrender of absolute autonomy in exchange for influence and collective security. 

For example, a country adhering to World Trade Organization rules accepts constraints on its domestic trade policies but gains access to a dispute resolution mechanism and a vast global market.

Critics, however, view this evolution with suspicion, interpreting it as a dilution of statehood and a potential infringement on national self-determination. They warn that powerful states or unaccountable bureaucracies in international organizations can dominate the rule-setting process, effectively imposing their will on smaller nations under the guise of global cooperation.`
  }
};

const sentenceExercises = {
  1: [
    {
      id: 51,
      sentence: "National __________ is a core principle of international law.",
      blank: 'Sovereignty',
      options: ['Sovereignty', 'Autonomy', 'Independence', 'Power'],
      explanation: 'Sovereignty (السيادة) - تعني سلطة الدولة المطلقة'
    }
    // يمكنك إضافة باقي الـ 10 تمارين هنا
  ],
  2: []
};

// دوال مساعدة
function getTermsByBatch(batchId) { return terms[batchId] || []; }
function getExercisesByBatch(batchId) { return sentenceExercises[batchId] || []; }
function getReadingTextByBatch(batchId) { return readingTexts[batchId] || null; }
function getRandomTerms(count, batchId = 1) {
  const batchTerms = getTermsByBatch(batchId);
  const shuffled = [...batchTerms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
