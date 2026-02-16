const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [],
  'intermediate': [
    { id: 201, title: 'الدرس الأول: السيادة والتعاون', description: 'Cooperative Sovereignty' },
    { id: 202, title: 'الدرس الثاني: فك الارتباط والاقتصاد', description: 'Decoupling & Globalization' }
  ],
  'advanced': []
};

const lessonsData = {
  201: {
    title: "Cooperative Sovereignty in a Globalized Era",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty...`, // النص الأول
    terms: [
      { id: 1, english: 'Sovereignty', arabic: 'السيادة' },
      { id: 2, english: 'Multilateral', arabic: 'متعدد الأطراف' },
      { id: 3, english: 'Pandemics', arabic: 'أوبئة' }
    ]
  },
  202: {
    title: "Decoupling and the Future of Globalization",
    content: `The economic doctrine of "decoupling" – the strategic disentanglement of national economies...`, // النص الجديد
    terms: [
      { id: 101, english: 'Decoupling', arabic: 'فك الارتباط' },
      { id: 102, english: 'Disentanglement', arabic: 'فك التشابك' },
      { id: 103, english: 'Resilience', arabic: 'المرونة / القدرة على التعافي' },
      { id: 104, english: 'Semiconductors', arabic: 'أشباه الموصلات' },
      { id: 105, english: 'Nuanced', arabic: 'دقيق / متعدد الأوجه' }
    ]
  }
};

function getLessonsByLevel(levelId) { return lessonsList[levelId] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
