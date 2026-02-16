// تحديث قائمة الدروس المتوسطة
lessonsList['intermediate'] = [
  { id: '201', title: '1. السيادة والتعاون', description: 'تحليل العلاقة بين الدول في العصر الحديث' },
  { id: '202', title: '2. الذكاء الاصطناعي', description: 'تأثير التكنولوجيا على سوق العمل' },
  { id: '203', title: '3. التغير المناخي', description: 'المسؤولية الأخلاقية والحلول المستدامة' },
  { id: '204', title: '4. الاقتصاد الرقمي', description: 'العملات المشفرة ومستقبل التجارة' },
  { id: '205', title: '5. الصحة النفسية', description: 'توازن العمل والحياة في القرن الـ 21' }
];

// إضافة محتوى الدروس المتوسطة
Object.assign(lessonsData, {
  '201': {
    title: "National Sovereignty vs Global Cooperation",
    content: "In the contemporary era, the traditional concept of sovereignty is facing unprecedented challenges. Global issues like pandemics and climate change compel nations to collaborate, often at the expense of absolute autonomy. This shift towards 'Cooperative Sovereignty' revealed that isolated policies are no longer viable. International law serves as a framework to balance national interests with global welfare.",
    terms: [
      { id: '201-1', english: 'Sovereignty', arabic: 'السيادة', example: 'Respecting national sovereignty is a core principle.' },
      { id: '201-2', english: 'Unprecedented', arabic: 'غير مسبوق', example: 'We are facing unprecedented economic growth.' },
      { id: '201-3', english: 'Compel', arabic: 'يجبر / يضطر', example: 'Circumstances compel us to change our plans.' },
      { id: '201-4', english: 'Autonomy', arabic: 'الحكم الذاتي / الاستقلالية', example: 'The region gained more autonomy.' },
      { id: '201-5', english: 'Viable', arabic: 'قابل للتطبيق / حيوي', example: 'The project is no longer economically viable.' }
    ]
  },
  '202': {
    title: "Artificial Intelligence and the Workforce",
    content: "The rapid evolution of Artificial Intelligence (AI) has sparked a global debate regarding job displacement. While automation enhances efficiency and reduces human error, it also necessitates a massive reskilling of the workforce. Experts argue that AI should be viewed as a tool for augmentation rather than a replacement. Adapting to this technological paradigm shift is crucial for future economic stability.",
    terms: [
      { id: '202-1', english: 'Displacement', arabic: 'إحلال / إزاحة', example: 'Job displacement is a concern in the tech age.' },
      { id: '202-2', english: 'Automation', arabic: 'الأتمتة', example: 'Automation speeds up manufacturing.' },
      { id: '202-3', english: 'Augmentation', arabic: 'تعزيز / زيادة', example: 'The system focuses on human augmentation.' },
      { id: '202-4', english: 'Paradigm shift', arabic: 'تحول جذري في المفاهيم', example: 'The internet caused a paradigm shift in communication.' },
      { id: '202-5', english: 'Efficiency', arabic: 'كفاءة', example: 'We need to improve energy efficiency.' }
    ]
  },
  '203': {
    title: "The Ethics of Sustainability",
    content: "Sustainability is no longer a choice but a moral obligation. Corporations are under immense pressure to adopt eco-friendly practices and reduce their carbon footprint. Greenwashing, the practice of making misleading environmental claims, has become a significant hurdle for conscious consumers. Real change requires transparent supply chains and a transition to renewable energy sources.",
    terms: [
      { id: '203-1', english: 'Sustainability', arabic: 'الاستدامة', example: 'Sustainability is key to our future.' },
      { id: '203-2', english: 'Obligation', arabic: 'التزام / واجب', example: 'We have a moral obligation to help.' },
      { id: '203-3', english: 'Carbon footprint', arabic: 'البصمة الكربونية', example: 'Try to reduce your carbon footprint.' },
      { id: '203-4', english: 'Hurdle', arabic: 'عقبة / عائق', example: 'Lack of funding is the main hurdle.' },
      { id: '203-5', english: 'Renewable', arabic: 'متجدد', example: 'Solar power is a renewable energy.' }
    ]
  },
  '204': {
    title: "The Digital Economy & Blockchain",
    content: "The emergence of decentralized finance has disrupted traditional banking systems. Blockchain technology ensures transparency and security in digital transactions. However, the volatility of cryptocurrencies remains a major deterrent for conservative investors. As we move towards a cashless society, regulatory frameworks must evolve to prevent cyber-fraud and ensure financial inclusivity.",
    terms: [
      { id: '204-1', english: 'Decentralized', arabic: 'لامركزي', example: 'Blockchain is a decentralized system.' },
      { id: '204-2', english: 'Volatility', arabic: 'تقلب / عدم استقرار', example: 'Market volatility can be dangerous.' },
      { id: '204-3', english: 'Deterrent', arabic: 'رادع / مانع', example: 'High taxes are a deterrent to investment.' },
      { id: '204-4', english: 'Cashless', arabic: 'غير نقدي', example: 'Sweden is becoming a cashless society.' },
      { id: '204-5', english: 'Inclusivity', arabic: 'الشمولية', example: 'We strive for financial inclusivity.' }
    ]
  },
  '205': {
    title: "Psychological Well-being in the Modern Era",
    content: "In a hyper-connected world, maintaining mental health has become increasingly complex. The phenomenon of 'Burnout' is prevalent among professionals who struggle to disconnect from digital notifications. Establishing healthy boundaries and practicing mindfulness are effective strategies to mitigate stress. Society must destigmatize seeking professional help for emotional challenges.",
    terms: [
      { id: '205-1', english: 'Well-being', arabic: 'رفاهية / عافية', example: 'Physical exercise improves well-being.' },
      { id: '205-2', english: 'Prevalent', arabic: 'سائد / منتشر', example: 'This belief is prevalent in many cultures.' },
      { id: '205-3', english: 'Mitigate', arabic: 'يخفف / يلطف', example: 'New laws will mitigate the pollution.' },
      { id: '205-4', english: 'Destigmatize', arabic: 'إزالة الوصمة', example: 'We must destigmatize mental illness.' },
      { id: '205-5', english: 'Mindfulness', arabic: 'اليقظة الذهنية', example: 'Mindfulness reduces anxiety.' }
    ]
  }
});
