// البيانات الكاملة للتطبيق

const batches = [
  {
    id: 1,
    name: 'المصطلحات السياسية والقانونية - الدفعة الأولى',
    description: 'مصطلحات سياسية وقانونية أساسية'
  },
  {
    id: 2,
    name: 'المصطلحات الاقتصادية والتجارية - الدفعة الثانية',
    description: 'مصطلحات اقتصادية وتجارية'
  }
];

const terms = {
  1: [
    { id: 1, english: 'Cooperative', arabic: 'تعاوني' },
    { id: 2, english: 'Sovereignty', arabic: 'السيادة' },
    { id: 3, english: 'Globalized', arabic: 'عولمة' },
    { id: 4, english: 'Era', arabic: 'عصر' },
    { id: 5, english: 'Multilateral', arabic: 'متعدد الأطراف' },
    { id: 6, english: 'Associated', arabic: 'مرتبط' },
    { id: 7, english: 'Absolute right', arabic: 'حق مطلق' },
    { id: 8, english: 'Emergence', arabic: 'ظهور' },
    { id: 9, english: 'Pandemics', arabic: 'أوبئة' },
    { id: 10, english: 'Revealed', arabic: 'كشف' },
    { id: 11, english: 'Starkly', arabic: 'بوضوح صارخ' },
    { id: 12, english: 'Compell', arabic: 'يجبر' },
    { id: 13, english: 'Global Governance bodies (GGBs)', arabic: 'هيئات الحكم العالمي' },
    { id: 14, english: 'Negotiate', arabic: 'يتفاوض' },
    { id: 15, english: 'Cede', arabic: 'يتنازل' },
    { id: 16, english: 'To propel', arabic: 'يدفع' },
    { id: 17, english: 'Proponents', arabic: 'مؤيدون' },
    { id: 18, english: 'Interconnected world', arabic: 'عالم مترابط' },
    { id: 19, english: 'Originate', arabic: 'ينشأ' },
    { id: 20, english: 'Ultimate', arabic: 'نهائي' },
    { id: 21, english: 'Pragmatic', arabic: 'براغماتي' },
    { id: 22, english: 'Surrender', arabic: 'استسلام' },
    { id: 23, english: 'Absolute', arabic: 'مطلق' },
    { id: 24, english: 'Autonomy', arabic: 'استقلالية' },
    { id: 25, english: 'In exchange for', arabic: 'في مقابل' },
    { id: 26, english: 'Influence', arabic: 'تأثير' },
    { id: 27, english: 'Collective security', arabic: 'الأمن الجماعي' },
    { id: 28, english: 'Adhering to', arabic: 'الالتزام ب' },
    { id: 29, english: 'World Trade Organization (WTO)', arabic: 'منظمة التجارة العالمية' },
    { id: 30, english: 'Constraint', arabic: 'قيد' },
    { id: 31, english: 'Domestic', arabic: 'محلي' },
    { id: 32, english: 'Dispute', arabic: 'نزاع' },
    { id: 33, english: 'Resolution', arabic: 'حل' },
    { id: 34, english: 'Vast', arabic: 'شاسع' },
    { id: 35, english: 'Vast Global Market', arabic: 'سوق عالمي شاسع' },
    { id: 36, english: 'Mechanism', arabic: 'آلية' },
    { id: 37, english: 'Critics', arabic: 'منتقدون' },
    { id: 38, english: 'Suspicion', arabic: 'شك' },
    { id: 39, english: 'Evolution', arabic: 'تطور' },
    { id: 40, english: 'Interpreting', arabic: 'تفسير' },
    { id: 41, english: 'Dilution', arabic: 'تخفيف' },
    { id: 42, english: 'Statehood', arabic: 'الدولة' },
    { id: 43, english: 'Potential', arabic: 'إمكانية' },
    { id: 44, english: 'Infringement', arabic: 'انتهاك' },
    { id: 45, english: 'Self-determination', arabic: 'تقرير المصير' },
    { id: 46, english: 'Unaccountable', arabic: 'غير محاسب' },
    { id: 47, english: 'Bureaucracy', arabic: 'بيروقراطية' },
    { id: 48, english: 'Dominate', arabic: 'يسيطر' },
    { id: 49, english: 'Will', arabic: 'إرادة' },
    { id: 50, english: 'Tie guise of', arabic: 'تحت ستار' },
    { id: 51, english: 'The imperative', arabic: 'الضرورة' },
    { id: 52, english: 'Collaboration', arabic: 'تعاون' },
    { id: 53, english: 'To preserve', arabic: 'يحافظ' },
    { id: 54, english: 'Contemporary', arabic: 'معاصر' },
    { id: 55, english: 'Form (v)', arabic: 'يشكل' },
    { id: 56, english: 'Discourse', arabic: 'خطاب' },
    { id: 57, english: 'Debate', arabic: 'نقاش' },
    { id: 58, english: 'Ranging from', arabic: 'تتراوح بين' },
    { id: 59, english: 'Migration', arabic: 'هجرة' },
    { id: 60, english: 'Treaty', arabic: 'معاهدة' }
  ],
  2: [
    { id: 1, english: 'Decoupling', arabic: 'فك ارتباط' },
    { id: 2, english: 'Doctrine', arabic: 'عقيدة/ نظرية' },
    { id: 3, english: 'Disentanglement', arabic: 'تفكيك/ فصل' },
    { id: 4, english: 'Particularly', arabic: 'خصوصا' },
    { id: 5, english: 'Theoretical', arabic: 'نظري' },
    { id: 6, english: 'Debate', arabic: 'نقاش/ جدال' },
    { id: 7, english: 'Policy consideration', arabic: 'سياسة قيد الدراسة' },
    { id: 8, english: 'Triggered by', arabic: 'مدفوع ب/ ناتج عن' },
    { id: 9, english: 'Rivalry', arabic: 'منافسة' },
    { id: 10, english: 'Concerns over', arabic: 'مخاوف بشأن' },
    { id: 11, english: 'Regarding', arabic: 'بشأن' },
    { id: 12, english: 'Trend', arabic: 'توجه' },
    { id: 13, english: 'Reversal', arabic: 'تراجع' },
    { id: 14, english: 'To define', arabic: 'يحدد/ يميز' },
    { id: 15, english: 'Dependency', arabic: 'تبعية/ اعتمادية' },
    { id: 16, english: 'Intellectual', arabic: 'فكريه/ مفكر' },
    { id: 17, english: 'Property', arabic: 'ملكية' },
    { id: 18, english: 'To Bolster', arabic: 'دعم/ تعزيز' },
    { id: 19, english: 'Sector', arabic: 'قطاع' },
    { id: 20, english: 'Semiconductor', arabic: 'أشباه المواصلات' },
    { id: 21, english: 'Pharmaceutical', arabic: 'صناعات دوائية' },
    { id: 22, english: 'Mineral', arabic: 'معدن' },
    { id: 23, english: 'Strategic', arabic: 'استراتيجي' },
    { id: 24, english: 'Supply chain', arabic: 'سلسلة التوريد' },
    { id: 25, english: 'Resilience', arabic: 'المرونة' },
    { id: 26, english: 'Vulnerability', arabic: 'الضعف' },
    { id: 27, english: 'Disruption', arabic: 'تعطيل' },
    { id: 28, english: 'Diversification', arabic: 'التنويع' },
    { id: 29, english: 'Localization', arabic: 'التمحيل' },
    { id: 30, english: 'Nearshoring', arabic: 'التصنيع القريب' },
    { id: 31, english: 'Onshoring', arabic: 'إعادة التصنيع محلياً' },
    { id: 32, english: 'Tariff', arabic: 'رسم جمركي' },
    { id: 33, english: 'Sanction', arabic: 'عقوبة' },
    { id: 34, english: 'Trade war', arabic: 'حرب تجارية' },
    { id: 35, english: 'Protectionism', arabic: 'الحمائية' },
    { id: 36, english: 'Free trade', arabic: 'التجارة الحرة' },
    { id: 37, english: 'Bilateral', arabic: 'ثنائي' },
    { id: 38, english: 'Multilateral', arabic: 'متعدد الأطراف' },
    { id: 39, english: 'Agreement', arabic: 'اتفاق' },
    { id: 40, english: 'Partnership', arabic: 'شراكة' },
    { id: 41, english: 'Alliance', arabic: 'تحالف' },
    { id: 42, english: 'Coalition', arabic: 'تحالف' },
    { id: 43, english: 'Bloc', arabic: 'كتلة' },
    { id: 44, english: 'Geopolitical', arabic: 'جيوسياسي' },
    { id: 45, english: 'Hegemony', arabic: 'هيمنة' },
    { id: 46, english: 'Dominance', arabic: 'سيطرة' },
    { id: 47, english: 'Competition', arabic: 'منافسة' },
    { id: 48, english: 'Compete', arabic: 'ينافس' },
    { id: 49, english: 'To compete', arabic: 'ينافس' },
    { id: 50, english: 'Competitiveness', arabic: 'القدرة التنافسية' },
    { id: 51, english: 'Advantage', arabic: 'ميزة' },
    { id: 52, english: 'Disadvantage', arabic: 'عيب' },
    { id: 53, english: 'Innovation', arabic: 'ابتكار' },
    { id: 54, english: 'Technology', arabic: 'تكنولوجيا' },
    { id: 55, english: 'Digital', arabic: 'رقمي' },
    { id: 56, english: 'Artificial Intelligence', arabic: 'الذكاء الاصطناعي' },
    { id: 57, english: 'Automation', arabic: 'الأتمتة' },
    { id: 58, english: 'Efficiency', arabic: 'الكفاءة' },
    { id: 59, english: 'Productivity', arabic: 'الإنتاجية' },
    { id: 60, english: 'Pure', arabic: 'نقي' }
  ]
};

// Sentence exercises - المجموعة الأولى (60 سؤال)
const sentenceExercises = {
  1: [
    {
      id: 1,
      sentence: "It is the __________ of the people that should guide the country's leaders.",
      blank: 'Will',
      options: ['Will', 'Era', 'Constraint', 'Dilution'],
      explanation: 'Will (إرادة) - تعني الرغبة والقرار الذي يجب أن يوجه القادة'
    },
    {
      id: 2,
      sentence: "The __________ of nations is a fundamental principle in international law.",
      blank: 'Sovereignty',
      options: ['Sovereignty', 'Autonomy', 'Debate', 'Discourse'],
      explanation: 'Sovereignty (السيادة) - هي السلطة العليا للدولة على أراضيها'
    },
    {
      id: 3,
      sentence: "Many countries are __________ to international trade agreements.",
      blank: 'Adhering to',
      options: ['Adhering to', 'Cede', 'Compell', 'Negotiate'],
      explanation: 'Adhering to (الالتزام ب) - تعني الالتزام والاتباع'
    },
    {
      id: 4,
      sentence: "The __________ of global governance bodies has increased significantly.",
      blank: 'Emergence',
      options: ['Emergence', 'Originate', 'Revealed', 'Starkly'],
      explanation: 'Emergence (ظهور) - تعني الظهور والنشوء'
    },
    {
      id: 5,
      sentence: "International disputes require a fair __________ mechanism.",
      blank: 'Dispute',
      options: ['Dispute', 'Resolution', 'Mechanism', 'Constraint'],
      explanation: 'Resolution (حل) - تعني الحل والتسوية'
    },
    {
      id: 6,
      sentence: "The __________ of national sovereignty is a major concern for many states.",
      blank: 'Infringement',
      options: ['Infringement', 'Dilution', 'Potential', 'Autonomy'],
      explanation: 'Infringement (انتهاك) - تعني الانتهاك والتجاوز'
    },
    {
      id: 7,
      sentence: "Countries must __________ certain powers to international organizations.",
      blank: 'Cede',
      options: ['Cede', 'Negotiate', 'Compell', 'Propel'],
      explanation: 'Cede (يتنازل) - تعني التنازل والتسليم'
    },
    {
      id: 8,
      sentence: "The __________ approach requires balancing idealism with practical concerns.",
      blank: 'Pragmatic',
      options: ['Pragmatic', 'Ultimate', 'Absolute', 'Theoretical'],
      explanation: 'Pragmatic (براغماتي) - تعني العملي والواقعي'
    },
    {
      id: 9,
      sentence: "Global __________ has created both opportunities and challenges.",
      blank: 'Globalized',
      options: ['Globalized', 'Interconnected world', 'Era', 'Contemporary'],
      explanation: 'Globalized (عولمة) - تعني الانتشار العالمي'
    },
    {
      id: 10,
      sentence: "The __________ of international law is subject to ongoing debate.",
      blank: 'Interpreting',
      options: ['Interpreting', 'Discourse', 'Debate', 'Form'],
      explanation: 'Interpreting (تفسير) - تعني فهم ومعنى'
    },
    {
      id: 11,
      sentence: "__________ security arrangements require cooperation among nations.",
      blank: 'Collective',
      options: ['Collective', 'Multilateral', 'Bilateral', 'Associated'],
      explanation: 'Collective (جماعي) - يتعلق بالأمن المشترك'
    },
    {
      id: 12,
      sentence: "The __________ of global markets has made economies interdependent.",
      blank: 'Vast',
      options: ['Vast', 'Starkly', 'Ultimate', 'Revealed'],
      explanation: 'Vast (شاسع) - تعني الكبير والواسع'
    },
    {
      id: 13,
      sentence: "__________ organizations play a crucial role in international relations.",
      blank: 'Multilateral',
      options: ['Multilateral', 'Cooperative', 'Associated', 'Bilateral'],
      explanation: 'Multilateral (متعدد الأطراف) - يشمل عدة دول'
    },
    {
      id: 14,
      sentence: "The __________ of pandemics has revealed the need for global cooperation.",
      blank: 'Emergence',
      options: ['Emergence', 'Pandemics', 'Revealed', 'Starkly'],
      explanation: 'Emergence (ظهور) - تعني البروز والظهور'
    },
    {
      id: 15,
      sentence: "International __________ requires good faith from all parties involved.",
      blank: 'Negotiate',
      options: ['Negotiate', 'Discourse', 'Debate', 'Dispute'],
      explanation: 'Negotiate (يتفاوض) - تعني التفاوض والحوار'
    },
    {
      id: 16,
      sentence: "The __________ of the World Trade Organization affects global commerce.",
      blank: 'Mechanism',
      options: ['Mechanism', 'Constraint', 'Resolution', 'Dispute'],
      explanation: 'Mechanism (آلية) - تعني الطريقة والنظام'
    },
    {
      id: 17,
      sentence: "__________ of globalization argue that it benefits all nations.",
      blank: 'Proponents',
      options: ['Proponents', 'Critics', 'Suspicion', 'Concerns over'],
      explanation: 'Proponents (مؤيدون) - تعني المؤيدون والداعمون'
    },
    {
      id: 18,
      sentence: "__________ express concerns about the loss of national identity.",
      blank: 'Critics',
      options: ['Critics', 'Proponents', 'Suspicion', 'Discourse'],
      explanation: 'Critics (منتقدون) - تعني الناقدون والمعترضون'
    },
    {
      id: 19,
      sentence: "The __________ of nations has led to complex interdependencies.",
      blank: 'Interconnected world',
      options: ['Interconnected world', 'Autonomy', 'Domestic', 'Absolute'],
      explanation: 'Interconnected world (عالم مترابط) - تعني العالم المتشابك'
    },
    {
      id: 20,
      sentence: "__________ rights cannot be surrendered under any circumstances.",
      blank: 'Absolute',
      options: ['Absolute', 'Ultimate', 'Pragmatic', 'Domestic'],
      explanation: 'Absolute (مطلق) - تعني الكامل والتام'
    },
    {
      id: 21,
      sentence: "The __________ of sovereignty is a key principle in international law.",
      blank: 'Autonomy',
      options: ['Autonomy', 'Constraint', 'Domestic', 'Potential'],
      explanation: 'Autonomy (استقلالية) - تعني الاستقلال والحرية'
    },
    {
      id: 22,
      sentence: "__________ policies must balance national interests with global concerns.",
      blank: 'Domestic',
      options: ['Domestic', 'Multilateral', 'Bilateral', 'Cooperative'],
      explanation: 'Domestic (محلي) - يتعلق بالشؤون الداخلية'
    },
    {
      id: 23,
      sentence: "The __________ of international cooperation is mutual benefit.",
      blank: 'Ultimate',
      options: ['Ultimate', 'Pragmatic', 'Absolute', 'Theoretical'],
      explanation: 'Ultimate (نهائي) - تعني الهدف النهائي'
    },
    {
      id: 24,
      sentence: "__________ agreements require careful negotiation and compromise.",
      blank: 'Bilateral',
      options: ['Bilateral', 'Multilateral', 'Cooperative', 'Associated'],
      explanation: 'Bilateral (ثنائي) - يتعلق باتفاقات بين دولتين'
    },
    {
      id: 25,
      sentence: "The __________ of trade disputes can take years to resolve.",
      blank: 'Resolution',
      options: ['Resolution', 'Dispute', 'Mechanism', 'Constraint'],
      explanation: 'Resolution (حل) - تعني التسوية والحل'
    },
    {
      id: 26,
      sentence: "International law imposes __________ on state behavior.",
      blank: 'Constraint',
      options: ['Constraint', 'Autonomy', 'Potential', 'Absolute'],
      explanation: 'Constraint (قيد) - تعني القيود والحدود'
    },
    {
      id: 27,
      sentence: "The __________ of global governance is still evolving.",
      blank: 'Form',
      options: ['Form', 'Discourse', 'Debate', 'Interpreting'],
      explanation: 'Form (يشكل) - تعني الشكل والصيغة'
    },
    {
      id: 28,
      sentence: "__________ about international cooperation continues in academic circles.",
      blank: 'Discourse',
      options: ['Discourse', 'Debate', 'Dispute', 'Suspicion'],
      explanation: 'Discourse (خطاب) - تعني النقاش الفكري'
    },
    {
      id: 29,
      sentence: "The __________ of national identity is a concern in globalized economies.",
      blank: 'Dilution',
      options: ['Dilution', 'Infringement', 'Potential', 'Emergence'],
      explanation: 'Dilution (تخفيف) - تعني الضعف والتخفيف'
    },
    {
      id: 30,
      sentence: "__________ requires respecting the rights of all nations.",
      blank: 'Cooperation',
      options: ['Cooperation', 'Collaboration', 'Competitive', 'Preserve'],
      explanation: 'Cooperation (تعاون) - تعني العمل المشترك'
    },
    {
      id: 31,
      sentence: "International institutions must __________ their legitimacy through transparency.",
      blank: 'Preserve',
      options: ['Preserve', 'Propel', 'Bolster', 'Dominate'],
      explanation: 'Preserve (يحافظ) - تعني الحفاظ والصيانة'
    },
    {
      id: 32,
      sentence: "The __________ of international law is a subject of continuous study.",
      blank: 'Evolution',
      options: ['Evolution', 'Emergence', 'Originate', 'Revealed'],
      explanation: 'Evolution (تطور) - تعني التطور والتغير'
    },
    {
      id: 33,
      sentence: "__________ concerns about sovereignty have shaped modern diplomacy.",
      blank: 'Concerns over',
      options: ['Concerns over', 'Regarding', 'Suspicion', 'Debate'],
      explanation: 'Concerns over (مخاوف بشأن) - تعني القلق والخوف'
    },
    {
      id: 34,
      sentence: "The __________ of self-determination is protected by international law.",
      blank: 'Right',
      options: ['Right', 'Principle', 'Autonomy', 'Potential'],
      explanation: 'Right (حق) - تعني الحقوق والامتيازات'
    },
    {
      id: 35,
      sentence: "International __________ bodies are responsible for maintaining peace.",
      blank: 'Governance',
      options: ['Governance', 'Bureaucracy', 'Mechanism', 'Organization'],
      explanation: 'Governance (حكم) - تعني الإدارة والحكم'
    },
    {
      id: 36,
      sentence: "The __________ of nations in global affairs is undeniable.",
      blank: 'Influence',
      options: ['Influence', 'Dominate', 'Propel', 'Bolster'],
      explanation: 'Influence (تأثير) - تعني التأثير والنفوذ'
    },
    {
      id: 37,
      sentence: "__________ approaches to problem-solving are often more effective.",
      blank: 'Pragmatic',
      options: ['Pragmatic', 'Theoretical', 'Absolute', 'Ultimate'],
      explanation: 'Pragmatic (براغماتي) - تعني العملي والواقعي'
    },
    {
      id: 38,
      sentence: "The __________ of international agreements requires careful implementation.",
      blank: 'Adherence',
      options: ['Adherence', 'Compliance', 'Constraint', 'Mechanism'],
      explanation: 'Adherence (الالتزام) - تعني الاتباع والالتزام'
    },
    {
      id: 39,
      sentence: "__________ states often seek to maintain their independence.",
      blank: 'Smaller',
      options: ['Smaller', 'Weaker', 'Developing', 'Emerging'],
      explanation: 'Smaller (أصغر) - تعني الدول الأقل حجماً'
    },
    {
      id: 40,
      sentence: "The __________ of global markets requires transparent regulations.",
      blank: 'Functioning',
      options: ['Functioning', 'Mechanism', 'Operation', 'System'],
      explanation: 'Functioning (عمل) - تعني الأداء والعمل'
    },
    {
      id: 41,
      sentence: "International law __________ the rights of all nations equally.",
      blank: 'Protects',
      options: ['Protects', 'Preserves', 'Upholds', 'Safeguards'],
      explanation: 'Protects (يحمي) - تعني الحماية والدفاع'
    },
    {
      id: 42,
      sentence: "The __________ of cooperation is mutual respect and understanding.",
      blank: 'Foundation',
      options: ['Foundation', 'Basis', 'Principle', 'Core'],
      explanation: 'Foundation (أساس) - تعني الأساس والقاعدة'
    },
    {
      id: 43,
      sentence: "__________ disputes between nations should be resolved peacefully.",
      blank: 'Trade',
      options: ['Trade', 'Commercial', 'Economic', 'Business'],
      explanation: 'Trade (تجاري) - يتعلق بالتجارة والتبادل'
    },
    {
      id: 44,
      sentence: "The __________ of international organizations is to promote peace.",
      blank: 'Purpose',
      options: ['Purpose', 'Goal', 'Objective', 'Mission'],
      explanation: 'Purpose (الهدف) - تعني الغاية والهدف'
    },
    {
      id: 45,
      sentence: "__________ governance requires accountability and transparency.",
      blank: 'Global',
      options: ['Global', 'International', 'Worldwide', 'Universal'],
      explanation: 'Global (عالمي) - يتعلق بالعالم كله'
    },
    {
      id: 46,
      sentence: "The __________ of nations' rights is a cornerstone of international law.",
      blank: 'Protection',
      options: ['Protection', 'Preservation', 'Safeguard', 'Defense'],
      explanation: 'Protection (الحماية) - تعني الحماية والدفاع'
    },
    {
      id: 47,
      sentence: "__________ agreements promote economic growth and development.",
      blank: 'Trade',
      options: ['Trade', 'Commercial', 'Economic', 'Business'],
      explanation: 'Trade (تجاري) - يتعلق بالتجارة والتبادل'
    },
    {
      id: 48,
      sentence: "The __________ of international cooperation is evident in global institutions.",
      blank: 'Importance',
      options: ['Importance', 'Significance', 'Value', 'Weight'],
      explanation: 'Importance (الأهمية) - تعني الأهمية والقيمة'
    },
    {
      id: 49,
      sentence: "__________ nations must work together to address global challenges.",
      blank: 'All',
      options: ['All', 'Every', 'Each', 'Individual'],
      explanation: 'All (جميع) - تعني كل الدول'
    },
    {
      id: 50,
      sentence: "The __________ of international law is to maintain peace and security.",
      blank: 'Purpose',
      options: ['Purpose', 'Goal', 'Objective', 'Aim'],
      explanation: 'Purpose (الهدف) - تعني الغاية والهدف'
    },
    {
      id: 51,
      sentence: "__________ cooperation is essential for solving global problems.",
      blank: 'International',
      options: ['International', 'Global', 'Worldwide', 'Universal'],
      explanation: 'International (دولي) - يتعلق بالعلاقات بين الدول'
    },
    {
      id: 52,
      sentence: "The __________ of nations in global affairs cannot be ignored.",
      blank: 'Role',
      options: ['Role', 'Part', 'Position', 'Function'],
      explanation: 'Role (دور) - تعني الدور والمسؤولية'
    },
    {
      id: 53,
      sentence: "__________ agreements require ratification by national governments.",
      blank: 'International',
      options: ['International', 'Global', 'Bilateral', 'Multilateral'],
      explanation: 'International (دولي) - يتعلق بالاتفاقات بين الدول'
    },
    {
      id: 54,
      sentence: "The __________ of international institutions is to serve all nations.",
      blank: 'Responsibility',
      options: ['Responsibility', 'Duty', 'Obligation', 'Function'],
      explanation: 'Responsibility (المسؤولية) - تعني الواجب والمسؤولية'
    },
    {
      id: 55,
      sentence: "__________ solutions to international problems require consensus.",
      blank: 'Effective',
      options: ['Effective', 'Successful', 'Viable', 'Practical'],
      explanation: 'Effective (فعال) - تعني الحل الناجح والفعال'
    },
    {
      id: 56,
      sentence: "The __________ of international law protects vulnerable nations.",
      blank: 'Framework',
      options: ['Framework', 'System', 'Structure', 'Foundation'],
      explanation: 'Framework (الإطار) - تعني الهيكل والنظام'
    },
    {
      id: 57,
      sentence: "__________ nations have the right to self-determination.",
      blank: 'All',
      options: ['All', 'Every', 'Each', 'Individual'],
      explanation: 'All (جميع) - تعني كل الدول'
    },
    {
      id: 58,
      sentence: "The __________ of international cooperation benefits all parties.",
      blank: 'Process',
      options: ['Process', 'System', 'Mechanism', 'Framework'],
      explanation: 'Process (العملية) - تعني الآلية والعملية'
    },
    {
      id: 59,
      sentence: "__________ governance requires strong institutions and rule of law.",
      blank: 'Global',
      options: ['Global', 'International', 'Worldwide', 'Universal'],
      explanation: 'Global (عالمي) - يتعلق بالحكم العالمي'
    },
    {
      id: 60,
      sentence: "The __________ of international agreements is binding on all signatories.",
      blank: 'Obligation',
      options: ['Obligation', 'Commitment', 'Responsibility', 'Duty'],
      explanation: 'Obligation (الالتزام) - تعني الواجب والالتزام'
    }
  ],
  2: [] // سيتم ملؤها لاحقاً
};

// دوال مساعدة
function getTermsByBatch(batchId) {
  return terms[batchId] || [];
}

function getExercisesByBatch(batchId) {
  return sentenceExercises[batchId] || [];
}

function getRandomTerms(count, batchId = 1) {
  const batchTerms = getTermsByBatch(batchId);
  const shuffled = [...batchTerms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
