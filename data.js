const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [
    { id: 101, title: 'الدرس الأول: التحيات والتعارف', description: 'أساسيات التواصل اليومي' }
  ],
  'intermediate': [
    { id: 201, title: 'الدرس الأول: السيادة والتعاون', description: 'Cooperative Sovereignty' },
    { id: 202, title: 'الدرس الثاني: فك الارتباط والاقتصاد', description: 'Decoupling & Globalization' }
  ],
  'advanced': []
};

const lessonsData = {
  101: {
    title: "Greetings and Introductions",
    content: `Welcome to your first English lesson! 
    Learning how to greet people is the first step to fluency. 
    Common greetings include: "Hello", "Good morning", and "How are you?".
    When you meet someone for the first time, you can say: "Nice to meet you".`,
    terms: [
      { id: 1, english: 'Hello', arabic: 'مرحباً' },
      { id: 2, english: 'Good morning', arabic: 'صباح الخير' },
      { id: 3, english: 'Nice to meet you', arabic: 'سعدت بلقائك' },
      { id: 4, english: 'How are you?', arabic: 'كيف حالك؟' }
    ]
  },
  201: {
    title: "Cooperative Sovereignty in a Globalized Era",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty, driven by the growing power of international institutions and multilateral agreements. Sovereignty, in its classical sense, has long been associated with the absolute right of a state to control its territory without external interference.`,
    terms: [
      { id: 11, english: 'Sovereignty', arabic: 'السيادة' },
      { id: 12, english: 'Multilateral', arabic: 'متعدد الأطراف' },
      { id: 13, english: 'Interference', arabic: 'تدخل' },
      { id: 14, english: 'Pandemics', arabic: 'أوبئة' },
      { id: 15, english: 'Transformation', arabic: 'تحول' }
    ]
  },
  202: {
    title: "Decoupling and the Future of Globalization",
    content: `The economic doctrine of "decoupling" – the strategic disentanglement of national economies, particularly between major powers like the United States and China – has moved from theoretical debate to active policy consideration. This trend marks a potential reversal of the globalization that defined the late 20th and early 21st centuries.`,
    terms: [
      { id: 21, english: 'Decoupling', arabic: 'فك الارتباط' },
      { id: 22, english: 'Disentanglement', arabic: 'فك التشابك' },
      { id: 23, english: 'Resilience', arabic: 'المرونة' },
      { id: 24, english: 'Semiconductors', arabic: 'أشباه الموصلات' },
      { id: 25, english: 'Anxieties', arabic: 'مخاوف' }
    ]
  }
};

function getLessonsByLevel(levelId) { return lessonsList[levelId] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
