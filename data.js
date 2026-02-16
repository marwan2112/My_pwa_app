const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessonsList = {
  'beginner': [
    { id: '101', title: '1. كسر الجليد', description: 'التعريف الاحترافي بالنفس' },
    { id: '102', title: '2. الروتين الفعال', description: 'الأفعال اليومية الحركية' },
    { id: '103', title: '3. الروابط العائلية', description: 'وصف الشخصيات والقرابة' },
    { id: '104', title: '4. لغة الطعام', description: 'التعبير عن الأذواق والطلبات' },
    { id: '105', title: '5. المكان والبيئة', description: 'وصف المحيط بدقة' }
  ],
  'intermediate': [
    { id: '201', title: 'السيادة الدولية', description: 'تحليل نص سياسي معمق' }
  ],
  'advanced': [
    // --- هنا تبدأ بإضافة عناوين نصوصك الـ 28 ---
    { id: '301', title: '1. نص سياسي جديد', description: 'وصف النص الأول هنا' },
    { id: '302', title: '2. نص سياسي جديد', description: 'وصف النص الثاني هنا' }
  ]
};

const lessonsData = {
  '101': {
    title: "Breaking the Ice",
    content: "Allow me to introduce myself. My name is Adam, and I am currently focusing on improving my English skills. I live in a vibrant city where I meet diverse people every day. It is a pleasure to meet you, and I look forward to our conversation. Establishing a good first impression is essential in any language.",
    terms: [
      { id: '101-1', english: 'Introduce', arabic: 'يقدّم' },
      { id: '101-2', english: 'Improve', arabic: 'يُحسّن' },
      { id: '101-3', english: 'Vibrant', arabic: 'حيوي' },
      { id: '101-4', english: 'Pleasure', arabic: 'سرور / متعة' },
      { id: '101-5', english: 'Essential', arabic: 'ضروري / أساسي' }
    ]
  },
  '102': {
    title: "The Power of Routine",
    content: "A consistent routine shapes our lives. Every morning, I prioritize my tasks to stay productive. I typically start my day with a brief exercise, followed by a nutritious breakfast. Discipline in daily habits leads to long-term success. Success doesn't happen by chance; it happens by choice.",
    terms: [
      { id: '102-1', english: 'Consistent', arabic: 'ثابت / مستمر' },
      { id: '102-2', english: 'Prioritize', arabic: 'يرتب الأولويات' },
      { id: '102-3', english: 'Productive', arabic: 'مُنتج' },
      { id: '102-4', english: 'Discipline', arabic: 'انضباط' },
      { id: '102-5', english: 'Nutritious', arabic: 'مغذي' }
    ]
  },
  '103': {
    title: "Family Dynamics",
    content: "Family is the core of society. My family members have distinct personalities. My father is very ambitious, while my mother is incredibly supportive. We share a strong bond, and we always help each other during difficult times. Understanding your family history is very important.",
    terms: [
      { id: '103-1', english: 'Core', arabic: 'جوهر' },
      { id: '103-2', english: 'Ambitious', arabic: 'طموح' },
      { id: '103-3', english: 'Supportive', arabic: 'داعم' },
      { id: '103-4', english: 'Bond', arabic: 'رابطة / علاقة' },
      { id: '103-5', english: 'Distinct', arabic: 'مميز / مختلف' }
    ]
  },
  '104': {
    title: "Culinary Preferences",
    content: "Food is a universal language. I enjoy exploring various cuisines, from spicy to sweet. I prefer balanced meals that include fresh ingredients. When dining out, I always look for authentic flavors that represent the culture. Cooking is not just a chore; it's an art.",
    terms: [
      { id: '104-1', english: 'Cuisine', arabic: 'مطبخ / أسلوب طهي' },
      { id: '104-2', english: 'Ingredients', arabic: 'مكونات' },
      { id: '104-3', english: 'Authentic', arabic: 'أصيل' },
      { id: '104-4', english: 'Universal', arabic: 'عالمي' },
      { id: '104-5', english: 'Balanced', arabic: 'متوازن' }
    ]
  },
  '105': {
    title: "Environment and Space",
    content: "My neighborhood is peaceful and well-maintained. There is a spacious park nearby where people gather to relax. The atmosphere is very welcoming and friendly. I appreciate a clean environment and I always try to reduce waste. Protecting our nature is our collective responsibility.",
    terms: [
      { id: '105-1', english: 'Neighborhood', arabic: 'حي' },
      { id: '105-2', english: 'Spacious', arabic: 'واسع' },
      { id: '105-3', english: 'Appreciate', arabic: 'يقدّر' },
      { id: '105-4', english: 'Peaceful', arabic: 'هادئ / مسالم' },
      { id: '105-5', english: 'Atmosphere', arabic: 'أجواء' }
    ]
  },
  '201': {
    title: "International Sovereignty",
    content: "Sovereignty is the supreme authority within a territory. It is a modern concept of political power.",
    terms: [{ id: '201-1', english: 'Sovereignty', arabic: 'السيادة' }]
  },

  // --- ابدأ بإضافة نصوصك الـ 28 هنا (Advanced) ---
  '301': {
    title: "عنوان النص الأول هنا",
    content: `هنا ضع النص السياسي الأول بالكامل...`,
    terms: [
      { id: '301-1', english: 'كلمة انجليزية', arabic: 'معناها بالعربي' }
    ]
  },
  '302': {
    title: "عنوان النص الثاني هنا",
    content: `محتوى النص الثاني...`,
    terms: [
      { id: '302-1', english: 'Word', arabic: 'كلمة' }
    ]
  }
};

// الدوال المساعدة لربط البيانات
function getLessonsByLevel(id) { return lessonsList[id] || []; }
function getLessonData(id) { return lessonsData[id] || null; }
