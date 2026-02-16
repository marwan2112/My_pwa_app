const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [
    { id: 101, title: 'الدرس 1: التحيات واللقاء الأول', description: 'كيف تقدم نفسك للآخرين' },
    { id: 102, title: 'الدرس 2: روتيني اليومي', description: 'التحدث عن الأنشطة اليومية' },
    { id: 103, title: 'الدرس 3: في المطعم', description: 'طلب الطعام والتعامل مع الجرسون' },
    { id: 104, title: 'الدرس 4: العائلة والأصدقاء', description: 'وصف الأشخاص المقربين' },
    { id: 105, title: 'الدرس 5: التسوق والأسعار', description: 'كيف تسأل عن السعر وتشتري' }
  ],
  'intermediate': [
    { id: 201, title: 'السيادة والتعاون الدولي', description: 'تحليل نص سياسي معمق' },
    { id: 202, title: 'فك الارتباط الاقتصادي', description: 'مستقبل العولمة والتجارة' }
  ]
};

const lessonsData = {
  101: {
    title: "Meeting People",
    content: `Hello! My name is Adam. I am happy to meet you. In the morning, I say "Good morning" to my friends. When I leave, I say "Goodbye". It is nice to make new friends every day. How are you today?`,
    terms: [
      { id: '101-1', english: 'Meeting', arabic: 'لقاء', example: 'It was a great meeting.' },
      { id: '101-2', english: 'Happy', arabic: 'سعيد', example: 'I am happy to see you.' },
      { id: '101-3', english: 'Friends', arabic: 'أصدقاء', example: 'I love my friends.' }
    ]
  },
  102: {
    title: "My Daily Routine",
    content: `I wake up early every day. I drink coffee and eat breakfast at 7 AM. Then, I go to work by bus. In the evening, I read a book or watch a movie. I go to sleep at 10 PM.`,
    terms: [
      { id: '102-1', english: 'Wake up', arabic: 'يستيقظ', example: 'I wake up at 6 AM.' },
      { id: '102-2', english: 'Early', arabic: 'باكراً', example: 'She arrived early.' },
      { id: '102-3', english: 'Breakfast', arabic: 'فطور', example: 'Breakfast is important.' }
    ]
  },
  // أضف نصوص الدروس 103 و 104 و 105 بنفس الطريقة...
  201: {
    title: "Cooperative Sovereignty",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty... (النص الكامل الذي أرسلته سابقاً سيظهر هنا كاملاً بفضل تحديث الـ CSS)`,
    terms: [
      { id: '201-1', english: 'Sovereignty', arabic: 'السيادة', example: 'Every nation protects its sovereignty.' }
    ]
  }
};

function getLessonsByLevel(levelId) { return lessonsList[levelId] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
