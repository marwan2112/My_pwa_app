const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [
    { id: 101, title: 'الدرس 1: كسر الجليد', description: 'التعريف الاحترافي بالنفس' },
    { id: 102, title: 'الدرس 2: الروتين الفعال', description: 'الأفعال اليومية الحركية' },
    { id: 103, title: 'الدرس 3: الروابط العائلية', description: 'وصف الشخصيات والقرابة' },
    { id: 104, title: 'الدرس 4: لغة الطعام', description: 'التعبير عن الأذواق والطلبات' },
    { id: 105, title: 'الدرس 5: المكان والبيئة', description: 'وصف المحيط بدقة' }
  ],
  'intermediate': [
    { id: 201, title: 'السيادة الدولية', description: 'تحليل نص سياسي معمق' }
  ]
};

const lessonsData = {
  101: {
    title: "Breaking the Ice",
    content: "Allow me to introduce myself. My name is Adam, and I am currently focusing on improving my English skills. I live in a vibrant city where I meet diverse people every day. It is a pleasure to meet you, and I look forward to our conversation. Establishing a good first impression is essential in any language.",
    terms: [
      { id: '101-1', english: 'Introduce', arabic: 'يقدّم', example: 'Let me introduce myself.' },
      { id: '101-2', english: 'Improve', arabic: 'يُحسّن', example: 'I want to improve my skills.' },
      { id: '101-3', english: 'Vibrant', arabic: 'حيوي', example: 'The city is vibrant.' }
    ]
  },
  102: {
    title: "The Power of Routine",
    content: "A consistent routine shapes our lives. Every morning, I prioritize my tasks to stay productive. I typically start my day with a brief exercise, followed by a nutritious breakfast. Discipline in daily habits leads to long-term success.",
    terms: [
      { id: '102-1', english: 'Consistent', arabic: 'ثابت / مستمر', example: 'Practice must be consistent.' },
      { id: '102-2', english: 'Prioritize', arabic: 'يرتب الأولويات', example: 'Prioritize your goals.' },
      { id: '102-3', english: 'Productive', arabic: 'مُنتج', example: 'I had a productive day.' }
    ]
  },
  103: {
    title: "Family Dynamics",
    content: "Family is the core of society. My family members have distinct personalities. My father is very ambitious, while my mother is incredibly supportive. We share a strong bond.",
    terms: [
      { id: '103-1', english: 'Core', arabic: 'جوهر', example: 'Core values are important.' },
      { id: '103-2', english: 'Ambitious', arabic: 'طموح', example: 'He is an ambitious man.' },
      { id: '103-3', english: 'Supportive', arabic: 'داعم', example: 'My family is supportive.' }
    ]
  },
  104: {
    title: "Culinary Preferences",
    content: "Food is a universal language. I enjoy exploring various cuisines. I prefer balanced meals that include fresh ingredients. When dining out, I look for authentic flavors.",
    terms: [
      { id: '104-1', english: 'Cuisine', arabic: 'مطبخ / طهي', example: 'I love Italian cuisine.' },
      { id: '104-2', english: 'Ingredients', arabic: 'مكونات', example: 'Use fresh ingredients.' },
      { id: '104-3', english: 'Authentic', arabic: 'أصيل', example: 'This is authentic food.' }
    ]
  },
  105: {
    title: "Environment and Space",
    content: "My neighborhood is peaceful and well-maintained. There is a spacious park nearby where people gather to relax. The atmosphere is very welcoming. I appreciate a clean environment.",
    terms: [
      { id: '105-1', english: 'Neighborhood', arabic: 'حي', example: 'I love my neighborhood.' },
      { id: '105-2', english: 'Spacious', arabic: 'واسع', example: 'The house is spacious.' },
      { id: '105-3', english: 'Appreciate', arabic: 'يقدّر', example: 'I appreciate your time.' }
    ]
  }
};

function getLessonsByLevel(id) { return lessonsList[id] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
