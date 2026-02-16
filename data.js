window.levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

window.lessonsList = {
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
    { id: '301', title: 'نص متقدم 1', description: 'اضغط لتعديل العنوان' },
    { id: '302', title: 'نص متقدم 2', description: 'اضغط لتعديل العنوان' }
  ]
};

window.lessonsData = {
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
    content: "A consistent routine shapes our lives. Every morning, I prioritize my tasks to stay productive. I typically start my day with a brief exercise, followed by a nutritious breakfast. Discipline in daily habits leads to long-term success.",
    terms: [
      { id: '102-1', english: 'Consistent', arabic: 'ثابت / مستمر' },
      { id: '102-2', english: 'Prioritize', arabic: 'يرتب الأولويات' }
    ]
  },
  '103': {
    title: "Family Dynamics",
    content: "Family is the core of society. My family members have distinct personalities.",
    terms: [{ id: '103-1', english: 'Core', arabic: 'جوهر' }]
  },
  '104': {
    title: "Culinary Preferences",
    content: "Food is a universal language. I enjoy exploring various cuisines.",
    terms: [{ id: '104-1', english: 'Cuisine', arabic: 'مطبخ / أسلوب طهي' }]
  },
  '105': {
    title: "Environment and Space",
    content: "My neighborhood is peaceful and well-maintained.",
    terms: [{ id: '105-1', english: 'Neighborhood', arabic: 'حي' }]
  },
  '201': {
    title: "International Sovereignty",
    content: "Sovereignty is the supreme authority within a territory.",
    terms: [{ id: '201-1', english: 'Sovereignty', arabic: 'السيادة' }]
  },
  // --- النصوص المتقدمة ---
  '301': {
    title: "العنوان بالانجليزي هنا",
    content: `ضع النص السياسي الأول هنا...`,
    terms: [{ id: '301-1', english: 'Word', arabic: 'كلمة' }]
  },
  '302': {
    title: "عنوان النص الثاني",
    content: `محتوى النص الثاني هنا...`,
    terms: [{ id: '302-1', english: 'Word', arabic: 'كلمة' }]
  }
};
