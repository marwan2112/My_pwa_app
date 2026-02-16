const levels = [
  { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
  { id: 'intermediate', name: 'المستوى المتوسط', icon: '🌿' },
  { id: 'advanced', name: 'المستوى المتقدم', icon: '🌳' }
];

const lessons = {
  'beginner': [
    { id: 101, title: 'الدرس الأول: أساسيات التواصل', description: 'تعلم أهم الجمل اليومية' },
    { id: 102, title: 'الدرس الثاني: العائلة والمنزل', description: 'مصطلحات الحياة الأسرية' }
  ],
  'intermediate': [
    { id: 201, title: 'الدرس الأول: السيادة والتعاون', description: 'تحليل نص Cooperative Sovereignty' }
  ],
  'advanced': [
    { id: 301, title: 'الدرس الأول: الاقتصاد المعمق', description: 'تحليل تقارير البورصة' }
  ]
};

const readingTexts = {
  201: {
    title: "Cooperative Sovereignty in a Globalized Era",
    content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty... (ضع النص الكامل هنا)`
  }
};

const terms = {
  201: [
    { id: 1, english: 'Sovereignty', arabic: 'السيادة' },
    { id: 2, english: 'Multilateral', arabic: 'متعدد الأطراف' }
    // أضف الكلمات التابعة لهذا الدرس هنا
  ]
};

// دوال الجلب
function getLessonsByLevel(levelId) { return lessons[levelId] || []; }
function getReadingTextByLesson(lessonId) { return readingTexts[lessonId] || null; }
function getTermsByLesson(lessonId) { return terms[lessonId] || []; }
