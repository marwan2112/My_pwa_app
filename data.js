const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsData = {
  // المستوى المتوسط - الدرس الأول
  201: {
    title: "Cooperative Sovereignty in a Globalized Era",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty, driven by the growing power of international institutions and multilateral agreements. 

Sovereignty, in its classical sense, has long been associated with the absolute right of a state to control its territory, resources, and population without external interference. However, the emergence of transnational challenges such as climate change, cyber-organized crime, and global pandemics has starkly revealed the limits of this concept. 

States are no longer capable of confronting these challenges individually, which has compelled them to negotiate and cede portions of their authority to global governance bodies. This shift propels a model known as "cooperative sovereignty" or "sovereignty as responsibility." 

Proponents argue that in an interconnected world, the ultimate exercise of sovereignty is the ability to participate effectively in international systems, shape global norms, and protect one's citizens from threats that originate beyond borders. This requires a pragmatic surrender of absolute autonomy in exchange for influence and collective security. 

For example, a country adhering to World Trade Organization rules accepts constraints on its domestic trade policies but gains access to a dispute resolution mechanism and a vast global market.

Critics, however, view this evolution with suspicion, interpreting it as a dilution of statehood and a potential infringement on national self-determination. They warn that powerful states or unaccountable bureaucracies in international organizations can dominate the rule-setting process, effectively imposing their will on smaller nations under the guise of global cooperation.`,
    terms: [
      { id: 1, english: 'Sovereignty', arabic: 'السيادة' },
      { id: 2, english: 'Multilateral', arabic: 'متعدد الأطراف' },
      { id: 3, english: 'Autonomy', arabic: 'الحكم الذاتي' },
      { id: 4, english: 'Interference', arabic: 'تدخل' },
      { id: 5, english: 'Transformation', arabic: 'تحول' }
    ],
    exercises: [
      {
        id: 1,
        sentence: "National __________ is the right of a state to govern itself.",
        blank: "Sovereignty",
        options: ["Sovereignty", "Era", "Global", "Trade"],
        explanation: "Sovereignty تعني السيادة الوطنية"
      }
    ]
  }
};

const lessonsList = {
  'beginner': [],
  'intermediate': [
    { id: 201, title: 'السيادة والتعاون الدولي', description: 'تحليل نص السيادة في عصر العولمة' }
  ],
  'advanced': []
};

// دوال المساعدة
function getLessonsByLevel(levelId) { return lessonsList[levelId] || []; }
function getLessonData(lessonId) { return lessonsData[lessonId] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
