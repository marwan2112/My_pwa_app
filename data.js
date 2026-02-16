const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [
    { id: 101, title: '1. كسر الجليد', description: 'التعريف الاحترافي بالنفس' },
    { id: 102, title: '2. الروتين الفعال', description: 'استخدام الأفعال الحركية اليومية' },
    { id: 103, title: '3. الروابط العائلية', description: 'وصف الشخصيات والقرابة' },
    { id: 104, title: '4. لغة الطعام', description: 'التعبير عن الاحتياجات والأذواق' },
    { id: 105, title: '5. المكان والزمان', description: 'وصف محيطك بدقة' }
  ],
  'intermediate': [
    { id: 201, title: 'السيادة الدولية', description: 'Cooperative Sovereignty' }
  ]
};

const lessonsData = {
  101: {
    title: "Lesson 1: Breaking the Ice",
    content: "Allow me to introduce myself. My name is Adam, and I am currently focusing on improving my English skills. I live in a vibrant city where I meet diverse people every day. It is a pleasure to meet you, and I look forward to our conversation. Establishing a good first impression is essential in any language.",
    terms: [
      { id: '101-1', english: 'Introduce', arabic: 'يقدّم (نفسه/غيره)', example: 'Let me introduce my friend.' },
      { id: '101-2', english: 'Improve', arabic: 'يُحسّن / يطوّر', example: 'I want to improve my accent.' },
      { id: '101-3', english: 'Vibrant', arabic: 'حيوي / مفعم بالحياة', example: 'The market is very vibrant.' },
      { id: '101-4', english: 'Diverse', arabic: 'متنوع', example: 'I have diverse interests.' },
      { id: '101-5', english: 'Impression', arabic: 'انطباع', example: 'First impressions last long.' }
    ]
  },
  102: {
    title: "Lesson 2: The Power of Routine",
    content: "A consistent routine shapes our lives. Every morning, I prioritize my tasks to stay productive. I typically start my day with a brief exercise, followed by a nutritious breakfast. Discipline in daily habits leads to long-term success. How do you manage your time effectively?",
    terms: [
      { id: '102-1', english: 'Consistent', arabic: 'ثابت / مستمر', example: 'Consistent practice is key.' },
      { id: '102-2', english: 'Prioritize', arabic: 'يرتب الأولويات', example: 'You must prioritize your work.' },
      { id: '102-3', english: 'Productive', arabic: 'مُنتج', example: 'I had a very productive day.' },
      { id: '102-4', english: 'Nutritious', arabic: 'مغذي', example: 'Eat nutritious food.' },
      { id: '102-5', english: 'Discipline', arabic: 'الانضباط', example: 'Success requires discipline.' }
    ]
  },
  103: {
    title: "Lesson 3: Family Dynamics",
    content: "Family is the core of society. My family members have distinct personalities. My father is very ambitious, while my mother is incredibly supportive. We share a strong bond, even though we have different perspectives. Understanding your roots helps you grow as an individual.",
    terms: [
      { id: '103-1', english: 'Core', arabic: 'جوهر / قلب', example: 'Family is the core of life.' },
      { id: '103-2', english: 'Distinct', arabic: 'مميز / مختلف', example: 'They have distinct styles.' },
      { id: '103-3', english: 'Ambitious', arabic: 'طموح', example: 'She is an ambitious student.' },
      { id: '103-4', english: 'Supportive', arabic: 'داعم', example: 'My team is very supportive.' },
      { id: '103-5', english: 'Perspective', arabic: 'وجهة نظر', example: 'I have a new perspective.' }
    ]
  },
  104: {
    title: "Lesson 4: Culinary Preferences",
    content: "Food is a universal language. I enjoy exploring various cuisines, from traditional dishes to modern fusion. I prefer balanced meals that include fresh ingredients. When dining out, I always look for authentic flavors. Cooking at home is also a relaxing hobby that allows for creativity.",
    terms: [
      { id: '104-1', english: 'Cuisine', arabic: 'مطبخ / أسلوب طهي', example: 'I love Italian cuisine.' },
      { id: '104-2', english: 'Ingredients', arabic: 'مكونات', example: 'Fresh ingredients are better.' },
      { id: '104-3', english: 'Authentic', arabic: 'أصيل / حقيقي', example: 'This is an authentic recipe.' },
      { id: '104-4', english: 'Dining out', arabic: 'الأكل خارج المنزل', example: 'We enjoy dining out on Fridays.' },
      { id: '104-5', english: 'Creativity', arabic: 'إبداع', example: 'Cooking requires creativity.' }
    ]
  },
  105: {
    title: "Lesson 5: Environment and Space",
    content: "My neighborhood is peaceful and well-maintained. There is a spacious park nearby where people gather to relax. The atmosphere is very welcoming. I appreciate living in a clean and safe environment. It is important to protect our local surroundings for future generations.",
    terms: [
      { id: '105-1', english: 'Neighborhood', arabic: 'حي / منطقة سكنية', example: 'It is a quiet neighborhood.' },
      { id: '105-2', english: 'Spacious', arabic: 'واسع / فسيح', example: 'The living room is spacious.' },
      { id: '105-3', english: 'Atmosphere', arabic: 'أجواء', example: 'The restaurant has a nice atmosphere.' },
      { id: '105-4', english: 'Appreciate', arabic: 'يقدر / يمتن', example: 'I appreciate your help.' },
      { id: '105-5', english: 'Surroundings', arabic: 'البيئة المحيطة', example: 'Keep your surroundings clean.' }
    ]
  }
};

function getLessonsByLevel(levelId) { return lessonsList[levelId] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
function shuffleArray(array) { return [...array].sort(() => Math.random() - 0.5); }
