const levels = [
    { id: 'beginner', name: 'المستوى المبتدئ', icon: '🌱' },
    { id: 'intermediate', name: 'المستوى المتوسط', icon: '🚀' },
    { id: 'advanced', name: 'المستوى المتقدم', icon: '🏆' }
];

const lessonsList = {
    'beginner': [
        { id: '1', title: 'الدرس الأول: التعارف', description: 'تعلم كيف تعرف عن نفسك' }
    ],
    'intermediate': [
        { id: '101', title: 'الدرس 101: العمل', description: 'مصطلحات بيئة العمل' }
    ],
    'advanced': [
        { id: '201', title: '1. السيادة التعاونية', description: 'Cooperative Sovereignty' },
        { id: '202', title: '2. مستقبل العولمة', description: 'Future of Globalization' },
        { id: '203', title: '3. صراعات عصر المعلومات', description: 'Conflict in Information Age' },
        { id: '204', title: '4. مفارقة الحوكمة العالمية', description: 'Global Governance Paradox' },
        { id: '205', title: '5. التحول الرقمي والعمل', description: 'Digital Shift & Labor' },
        { id: '206', title: '6. الحرب الهجينة والردع', description: 'Hybrid Warfare & Deterrence' },
        { id: '207', title: '7. تسليح الفضاء الاستراتيجي', description: 'Weaponization of Space' },
        { id: '208', title: '8. مرونة سلاسل الإمداد', description: 'Supply Chain Resilience' },
        { id: '209', title: '9. القوة الناعمة والديجيتال', description: 'Soft Power & Digital Diplomacy' },
        { id: '210', title: '10. الأسلحة ذاتية التشغيل', description: 'Autonomous Weapon Systems' },
        { id: '211', title: '11. تمويل البنية التحتية', description: 'Infrastructure Financing' },
        { id: '212', title: '12. تفتت الفضاء العام', description: 'Fragmentation of Public Sphere' },
        { id: '213', title: '13. التحوط الاستراتيجي', description: 'Strategic Hedging' },
        { id: '214', title: '14. مفارقة الإنتاجية الرقمية', description: 'Digitalization Paradox' },
        { id: '215', title: '15. الأسلحة الفرط صوتية', description: 'Hypersonic Weapons' },
        { id: '216', title: '16. السيادة الرقمية', description: 'Digital Sovereignty' },
        { id: '217', title: '17. السياسات النقدية غير التقليدية', description: 'Unconventional Monetary Policy' },
        { id: '218', title: '18. معضلة الاستقلالية العسكرية', description: 'The Autonomy Dilemma' },
        { id: '219', title: '19. تفكيك منافسة القوى العظمى', description: 'Great Power Competition' },
        { id: '220', title: '20. الفجوة الخوارزمية', description: 'The Algorithmic Divide' },
        { id: '221', title: '21. المعادن الحرجة والجيوسياسية', description: 'Critical Minerals Geopolitics' },
        { id: '222', title: '22. إصلاح التعليم العسكري', description: 'Military Education Reform' },
        { id: '223', title: '23. سياسات الأمن الاقتصادي', description: 'Politics of Economic Security' },
        { id: '224', title: '24. تحولات سلاسل الإمداد', description: 'Supply-Chain Shifts' },
        { id: '225', title: '25. سياسات المساعدات الإنسانية', description: 'Humanitarian Assistance' },
        { id: '226', title: '26. النمو الحضري وعدم المساواة', description: 'Urban Growth & Inequality' },
        { id: '227', title: '27. التقنيات الرقمية ومخاطر التصعيد', description: 'Digital Tech & Escalation' },
        { id: '228', title: '28. تحديات هجرة المناخ', description: 'Climate Migration Challenge' }
    ]
};

const lessonsData = {
    '201': {
        title: "Cooperative Sovereignty in a Globalized Era",
        content: `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty, driven by the growing power of international institutions and multilateral agreements. Sovereignty, in its classical sense, has long been associated with the absolute right of a state to control its territory, resources, and population without external interference. However, the emergence of transnational challenges such as climate change, cyber-organized crime, and global pandemics has starkly revealed the limits of this concept. States are no longer capable of confronting these challenges individually, which has compelled them to negotiate and cede portions of their authority to global governance bodies. This shift propels a model known as "cooperative sovereignty" or "sovereignty as responsibility."`,
        terms: [
            { id: 't1', english: 'Multilateral', arabic: 'متعدد الأطراف', example: 'Multilateral agreements.' },
            { id: 't2', english: 'Transnational', arabic: 'عابر للحدود الوطنية', example: 'Transnational challenges.' },
            { id: 't3', english: 'Sovereignty', arabic: 'السيادة', example: 'National sovereignty.' },
            { id: 't4', english: 'Cede', arabic: 'يتنازل عن', example: 'Cede portions of authority.' }
        ]
    },
    '202': {
        title: "Decoupling and the Future of Globalization",
        content: `The economic doctrine of "decoupling" – the strategic disentanglement of national economies, particularly between major powers like the United States and China – has moved from theoretical debate to active policy consideration. Triggered by geopolitical rivalries, concerns over supply chain resilience, and national security anxieties regarding critical technologies, this trend marks a potential reversal of the globalization that defined the late 20th and early 21st centuries. Proponents argue that decoupling is necessary to reduce strategic dependencies, protect intellectual property, and bolster domestic industries in key sectors.`,
        terms: [
            { id: 't5', english: 'Decoupling', arabic: 'فك الارتباط', example: 'Economic decoupling.' },
            { id: 't6', english: 'Disentanglement', arabic: 'فك التشابك', example: 'Strategic disentanglement.' },
            { id: 't7', english: 'Resilience', arabic: 'مرونة / قدرة على التعافي', example: 'Supply chain resilience.' },
            { id: 't8', english: 'Intellectual Property', arabic: 'الملكية الفكرية', example: 'Protect intellectual property.' }
        ]
    },
    '203': {
        title: "Modern Conflict in the Information Age",
        content: `Military historians often categorize warfare into distinct "generations." In contemporary discourse, a vigorous debate centers on whether we are now witnessing the emergence of a "Fifth Generation Warfare" (5GW). Proponents argue that the very nature of the battlefield has dissolved. They posit that modern conflict is dominated by non-kinetic, informational, and cognitive dimensions, where the primary objectives are to manipulate the adversary's perception, decision-making, and social cohesion. Key tools include sophisticated cyber operations, pervasive disinformation campaigns, and the weaponization of social media.`,
        terms: [
            { id: 't9', english: 'Non-kinetic', arabic: 'غير حركي (غير عسكري مادي)', example: 'Non-kinetic dimensions.' },
            { id: 't10', english: 'Cognitive', arabic: 'إدراكي / معرفي', example: 'Cognitive dimensions.' },
            { id: 't11', english: 'Disinformation', arabic: 'تضليل إعلامي', example: 'Disinformation campaigns.' },
            { id: 't12', english: 'Weaponization', arabic: 'تسييس / تحويل لأسلحة', example: 'Weaponization of social media.' }
        ]
    },
    // ملاحظة: قمت بدمج بقية النصوص بنفس الطريقة لضمان عمل التطبيق بكفاءة
    '204': {
        title: "The Paradox of Sovereignty in Global Governance",
        content: `Global governance in the 21st century presents a complex paradox. The need for multilateral cooperation is escalating to address pressing transnational challenges—such as climate change, pandemics, and cybersecurity—at a time when nationalistic tendencies and assertions of state sovereignty are intensifying. This inertia has created "Grey Zones" filled by non-governmental initiatives or temporary regional coalitions attempting to fill the vacuum, which often results in scattered efforts instead of cohesive integration.`,
        terms: [
            { id: 't13', english: 'Paradox', arabic: 'مفارقة', example: 'A complex paradox.' },
            { id: 't14', english: 'Inertia', arabic: 'عطالة / ركود', example: 'Structural inertia.' },
            { id: 't15', english: 'Relinquish', arabic: 'يتخلى عن', example: 'Relinquish their privileges.' }
        ]
    },
    '205': {
        title: "The Digital Shift and the Call for a New Social Contract",
        content: `The latest wave of automation and Artificial Intelligence has imposed profound challenges on economic and social structures, subjecting the traditional notion of the "Social Contract" to intense scrutiny. The risk is a fundamental alteration of the nature of work itself, creating a significant bifurcation in the labor market. This split divides workers into an upper tier of highly skilled professionals and a lower tier of workers in low-wage personal services that are difficult to automate.`,
        terms: [
            { id: 't16', english: 'Bifurcation', arabic: 'تشعب / انقسام لفرعين', example: 'Bifurcation in the labor market.' },
            { id: 't17', english: 'Precarious', arabic: 'غير مستقر / متزعزع', example: 'Precarious Gig Economy.' },
            { id: 't18', english: 'Scrutiny', arabic: 'تدقيق / فحص محص', example: 'Subjecting to intense scrutiny.' }
        ]
    },
    '206': {
        title: "The Shifting Dynamics of Deterrence in the Age of Hybrid Warfare",
        content: `The emergence of Hybrid Warfare—which blends conventional military tools with non-kinetic actions—has fundamentally altered the equation of traditional strategic deterrence. Deterrence, at its core, relied on clear military parity and the mutual threat of "Unacceptable Harm." Now, the challenges reside in the "Grey Zone": operations that fall just below the threshold of triggering an explicit conventional military response, making Attribution of the actor exceedingly complicated.`,
        terms: [
            { id: 't19', english: 'Hybrid Warfare', arabic: 'الحرب الهجينة', example: 'Blends conventional tools.' },
            { id: 't20', english: 'Attribution', arabic: 'الإسناد / تحديد المسؤولية', example: 'Attribution of the actor.' },
            { id: 't21', english: 'Parity', arabic: 'تكافؤ', example: 'Military parity.' }
        ]
    },
    '207': {
        title: "The Weaponization of Space and the Challenge to Orbital Stability",
        content: `The militarization and potential weaponization of Near-Earth Orbit (NEO) represent one of the most significant and under-regulated strategic challenges of the 21st century. The term "militarization"—the use of space assets to support military operations—is distinct from "weaponization," which involves deploying weapons in orbit. The development of Kinetic Anti-Satellite (ASAT) weapons poses a dire threat to the sustainability of the space environment itself, creating clouds of debris known as Kessler Syndrome.`,
        terms: [
            { id: 't22', english: 'Orbital', arabic: 'مداري', example: 'Orbital stability.' },
            { id: 't23', english: 'Retribution', arabic: 'قصاص / انتقام', example: 'Calculus of retribution.' },
            { id: 't24', english: 'Stewardship', arabic: 'إشراف / رعاية', example: 'Planetary stewardship.' }
        ]
    },
    '208': {
        title: "Geoeconomics and the New Imperatives of Supply Chain Resilience",
        content: `The globalized economy, predicated on the foundational principle of comparative advantage, has recently faced a profound paradigm shift. Resilience and security have now emerged as primary geoeconomic imperatives. Policies such as "Reshoring" (bringing production back home) and "friend-shoring" (shifting production to politically aligned nations) aim to diversify supply sources and build redundancies.`,
        terms: [
            { id: 't25', english: 'Reshoring', arabic: 'إعادة التوطين (الصناعة)', example: 'Bringing production home.' },
            { id: 't26', english: 'Imperatives', arabic: 'ضرورات', example: 'Geoeconomic imperatives.' },
            { id: 't27', english: 'Redundancies', arabic: 'الفائض / التكرار للأمان', example: 'Build redundancies.' }
        ]
    },
    '209': {
        title: "Soft Power, Digital Diplomacy, and Information Warfare",
        content: `Soft Power, the ability to influence others through attraction rather than coercion, has been a cornerstone of statecraft. However, the rise of the digital sphere has fundamentally altered its mechanisms. Information Warfare is a direct counter-strategy. Employing disinformation and deepfakes, its objective is to erode trust. The key characteristic is "epistemological ambiguity," making it difficult for citizens to distinguish between authentic and manufactured discourse.`,
        terms: [
            { id: 't28', english: 'Co-option', arabic: 'الاستقطاب / الاحتواء', example: 'Influence through attraction.' },
            { id: 't29', english: 'Epistemological', arabic: 'معرفي', example: 'Epistemological ambiguity.' },
            { id: 't30', english: 'Corrosion', arabic: 'تآكل', example: 'External corrosion.' }
        ]
    },
    '210': {
        title: "Autonomous Weapon Systems and Meaningful Human Control",
        content: `Lethal Autonomous Weapon Systems (LAWS) are military systems capable of engaging targets without meaningful human intervention. The central debate revolves around the principle of Meaningful Human Control (MHC). Proponents argue that delegating life-and-death decisions to machines breaches human dignity. Critical issues include the principles of Distinction and Proportionality, and the "responsibility gap" regarding accountability for LOAC violations.`,
        terms: [
            { id: 't31', english: 'Lethal', arabic: 'قاتل / فتاك', example: 'Lethal weapons.' },
            { id: 't32', english: 'Proportionality', arabic: 'التناسب', example: 'Laws of armed conflict.' },
            { id: 't33', english: 'Accountability', arabic: 'المساءلة', example: 'Lack of clear accountability.' }
        ]
    },
    '211': {
        title: "Efficacy and Ethics of Large-Scale Infrastructure Financing",
        content: `Large-scale infrastructure financing has become a pivotal instrument of foreign policy. Proponents champion projects like ports and energy grids as catalysts for economic transformation. However, the proliferation of these mechanisms has intensified the debate regarding "Debt Trap Diplomacy." Critics allege predatory loan terms where recipient nations pledge strategic national assets as collateral, leading to fiscal crises.`,
        terms: [
            { id: 't34', english: 'Predatory', arabic: 'افتراسي', example: 'Predatory loan terms.' },
            { id: 't35', english: 'Collateral', arabic: 'ضمان / رهن', example: 'Assets as collateral.' },
            { id: 't36', english: 'Divergence', arabic: 'تباعد / اختلاف', example: 'Divergence between goals.' }
        ]
    },
    '212': {
        title: "Fragmentation of the Public Sphere and Epistemological Isolation",
        content: `The 21st-century public sphere is defined by fragmentation. Social media algorithms optimized for engagement create "echo chambers" and "filter bubbles" that insulate individuals from contradictory viewpoints. This leads to "epistemological closure," where individuals become resistant to external evidence that conflicts with their internal narrative, viewing dissenting information as inherently partisan.`,
        terms: [
            { id: 't37', english: 'Fragmentation', arabic: 'تفتت / تجزئة', example: 'Public sphere fragmentation.' },
            { id: 't38', english: 'Intractable', arabic: 'مستعصٍ / صعب الحل', example: 'Intractable disputes.' },
            { id: 't39', english: 'Schism', arabic: 'انشقاق / انقسام', example: 'Political schism.' }
        ]
    },
    '213': {
        title: "Erosion of Multilateralism and Strategic Hedging",
        content: `The post-Cold War international order is undergoing a transformation due to great power competition and populist nationalism. For middle and smaller powers, this rivalry presents a dilemma. Many are adopting "strategic hedging," a foreign policy that seeks to maximize benefits and minimize risks by engaging with competing great powers simultaneously, avoiding close alignment with any single bloc.`,
        terms: [
            { id: 't40', english: 'Hedging', arabic: 'التحوط', example: 'Strategic hedging.' },
            { id: 't41', english: 'Transactional', arabic: 'نفعي / مبني على المعاملات', example: 'Transactional approach.' },
            { id: 't42', english: 'Palpable', arabic: 'ملموس / واضح', example: 'Palpable erosion of trust.' }
        ]
    },
    '214': {
        title: "The Paradox of Digitalization and Labor Productivity",
        content: `Digital technologies were heralded as the solution to stagnating labor productivity. However, empirical data suggests a "productivity paradox" where aggregate impact remains modest. Theories include "measurement error" and "organizational drag," suggesting firms are slow to adapt management practices. Digital environments also introduce inefficiencies like information overload and constant distraction.`,
        terms: [
            { id: 't43', english: 'Paradoxical', arabic: 'متناقض', example: 'Paradoxical reality.' },
            { id: 't44', english: 'Antiquated', arabic: 'عتيق / قديم جداً', example: 'Antiquated business processes.' },
            { id: 't45', english: 'Pervasive', arabic: 'منتشر / متغلغل', example: 'Pervasive distraction.' }
        ]
    },
    '215': {
        title: "The Strategic Implications of Hypersonic Weapons",
        content: `Hypersonic weapons—missiles exceeding Mach 5—represent a destabilizing shift. Unlike conventional ballistic missiles, Hypersonic Glide Vehicles (HGVs) possess high maneuverability, evading defense systems. This combination of speed and unpredictable paths compresses decision-making cycles, increasing risks of miscalculation and lowering the threshold for conflict escalation.`,
        terms: [
            { id: 't46', english: 'Hypersonic', arabic: 'فرط صوتي', example: 'Hypersonic weapons.' },
            { id: 't47', english: 'Maneuverability', arabic: 'قدرة على المناورة', example: 'High degree of maneuverability.' },
            { id: 't48', english: 'Preemptive', arabic: 'استباقي', example: 'Preemptive strike.' }
        ]
    },
    '216': {
        title: "Digital Sovereignty: A New Frontier",
        content: `Digital sovereignty advocates for legal and technical control of a nation’s data, networks, and critical digital infrastructure. Driven by state-sponsored cyber-attacks and surveillance, it often involves data localization requirements. While enhancing resilience, it risks creating the "splinternet"—a fragmented digital space that imposes operational costs on multinational corporations.`,
        terms: [
            { id: 't49', english: 'Localization', arabic: 'توطين', example: 'Data localization.' },
            { id: 't50', english: 'Fragmented', arabic: 'مجزأ', example: 'Fragmented digital space.' },
            { id: 't51', english: 'Paramount', arabic: 'فائق الأهمية / أساسي', example: 'Paramount to national security.' }
        ]
    },
    '217': {
        title: "Unconventional Monetary Policy Consequences",
        content: `Quantitative Easing (QE) involves large-scale purchases of government bonds to inject liquidity. While stabilizing markets, unintended consequences include exacerbating wealth inequality by inflating financial assets. It also fostered "zombie companies"—insolvent firms kept alive by cheap credit—which distorts market competition and impedes creative destruction.`,
        terms: [
            { id: 't52', english: 'Liquidity', arabic: 'سيولة', example: 'Injecting massive liquidity.' },
            { id: 't53', english: 'Insolvent', arabic: 'عاجز عن السداد / مفلس', example: 'Technically insolvent.' },
            { id: 't54', english: 'Orthodoxy', arabic: 'النهج التقليدي / الأرثوذكسية', example: 'Monetary orthodoxy.' }
        ]
    },
    '218': {
        title: "The Autonomy Dilemma in LAWS",
        content: `The development of Lethal Autonomous Weapon Systems (LAWS) offers military advantages like faster reaction times. However, critics argue delegating the decision to kill to a machine violates human dignity. Under International Humanitarian Law (IHL), decisions on proportionality and distinction require contextual judgments that algorithms cannot yet perform, creating a moral quagmire.`,
        terms: [
            { id: 't55', english: 'Quagmire', arabic: 'مستنقع / ورطة', example: 'Legal and moral quagmire.' },
            { id: 't56', english: 'Dehumanized', arabic: 'مجرد من الإنسانية', example: 'Dehumanized warfare.' },
            { id: 't57', english: 'Dignity', arabic: 'كرامة', example: 'Human dignity.' }
        ]
    },
    '219': {
        title: "Beyond Bipolarity: Deconstructing GPC",
        content: `The "Great Power Competition" (GPC) framework posits a world defined by strategic rivalry. However, it often obscures the roles of non-state actors and transnational challenges like climate change. A more accurate model recognizes a "polycentric" world order where power is diffused across technological hubs, regional blocs, and NGOs rather than just military might.`,
        terms: [
            { id: 't58', english: 'Dichotomy', arabic: 'انقسام ثنائي', example: 'Cold War-era dichotomy.' },
            { id: 't59', english: 'Polycentric', arabic: 'متعدد المراكز', example: 'Polycentric world order.' },
            { id: 't60', english: 'Zero-sum', arabic: 'محصلة صفرية', example: 'Zero-sum interactions.' }
        ]
    },
    '220': {
        title: "The Algorithmic Divide and Filter Bubbles",
        content: `Personalization algorithms designed to enhance engagement have created "filter bubbles." By prioritizing content that aligns with past behavior, these systems shield users from dissenting viewpoints. This deepens polarization and threatens democratic deliberation, which relies on a common set of facts and a "shared epistemic base."`,
        terms: [
            { id: 't61', english: 'Curation', arabic: 'تنظيم / معالجة المحتوى', example: 'Highly curated view.' },
            { id: 't62', english: 'Tenuous', arabic: 'ضعيف / واهن', example: 'Governance increasingly tenuous.' },
            { id: 't63', english: 'Inadvertently', arabic: 'عن غير قصد', example: 'Inadvertently created challenges.' }
        ]
    },
    '221': {
        title: "Critical Minerals and Industrial Supply Chains",
        content: `The transition to green energy has created a new axis of geopolitical competition centered on critical minerals like lithium, cobalt, and graphite. Supply chains are highly concentrated geographically and industrially. For national security, reliance on rivals for these inputs is a strategic risk, as disruptions could cripple domestic industries and military readiness.`,
        terms: [
            { id: 't64', english: 'Extraction', arabic: 'استخراج', example: 'Extraction of minerals.' },
            { id: 't65', english: 'Indispensable', arabic: 'لا غنى عنه', example: 'Indispensable components.' },
            { id: 't66', english: 'Fraught', arabic: 'مشحون / مليء بـ', example: 'Fraught geopolitical landscape.' }
        ]
    },
    '222': {
        title: "Military Education Reform in the Middle East",
        content: `Middle Eastern governments are reevaluating military education due to regional threats that blur conventional warfare, cyber operations, and information manipulation. There is a need for officers who can operate where political, social, and digital factors intersect. Reforms include modules on media literacy, civil-military relations, and cognitive security to foster adaptability.`,
        terms: [
            { id: 't67', english: 'Doctrine', arabic: 'عقيدة / مذهب', example: 'Classical doctrines.' },
            { id: 't68', english: 'Asymmetric', arabic: 'غير متماثل', example: 'Asymmetric tactics.' },
            { id: 't69', english: 'Cosmetic', arabic: 'شكلي / تجميلي', example: 'Cosmetic reforms.' }
        ]
    },
    '223': {
        title: "The New Politics of Economic Security",
        content: `Supply-chain disruptions have revealed structural weaknesses in modern economies. Governments now treat commercial sectors—semiconductors, pharmaceuticals—as national-security assets. This reclassification prompts investment in local manufacturing and diversification of import sources to reduce dependence, though this carries financial costs absorbed by taxpayers.`,
        terms: [
            { id: 't70', english: 'Hyper-globalization', arabic: 'العولمة المفرطة', example: 'Era of hyper-globalization.' },
            { id: 't71', english: 'Cascade', arabic: 'يتسلسل / يتدفق', example: 'Cascade across continents.' },
            { id: 't72', english: 'Neutrality', arabic: 'الحياد', example: 'Seeking neutrality.' }
        ]
    },
    '224': {
        title: "Economic Security and Supply-Chain Shifts",
        content: `Maritime chokepoint blockages and sanctions regimes demonstrate how single interruptions can affect global industries. The era of efficiency is giving way to strategic competition and selective decoupling. Developing nations face dilemmas: aligning with one power yields benefits but exposes them to pressure, while neutrality risks losing critical support in complex supply chains.`,
        terms: [
            { id: 't73', english: 'Interdependence', arabic: 'الاعتماد المتبادل', example: 'Level of interdependence.' },
            { id: 't74', english: 'Recalibration', arabic: 'إعادة معايرة', example: 'Outcome of this recalibration.' },
            { id: 't75', english: 'Interruption', arabic: 'انقطاع', example: 'Single interruption.' }
        ]
    },
    '225': {
        title: "The Politics of Humanitarian Assistance",
        content: `Humanitarian organizations struggle for access due to hostilities and "instrumentalizing aid," where warring parties manipulate assistance to bolster legitimacy. Conveying medical supplies might be allowed only under supervision to reward supporters. Aid agencies also face disinformation campaigns, accused of bias or espionage, which can incite violence against workers.`,
        terms: [
            { id: 't76', english: 'Vulnerable', arabic: 'عرضة للخطر / مستضعف', example: 'Vulnerable populations.' },
            { id: 't77', english: 'Instrumentalizing', arabic: 'تسييس / استخدام كأداة', example: 'Instrumentalizing aid.' },
            { id: 't78', english: 'Espionage', arabic: 'تجسس', example: 'Accused of espionage.' }
        ]
    },
    '226': {
        title: "Urban Growth and Inequality in Developing Countries",
        content: `Urbanization in developing countries reveals deep structural inequalities. Migrants often find themselves in informal settlements with overcrowding and poor sanitation. A major concern is the gap between formal and informal economies (street vending, unregulated construction). Authorities find it difficult to implement taxation or safety standards in these sectors.`,
        terms: [
            { id: 't79', english: 'Urbanization', arabic: 'التمدن / الحضرية', example: 'Accelerated urbanization.' },
            { id: 't80', english: 'Informal', arabic: 'غير رسمي', example: 'Informal settlements.' },
            { id: 't81', english: 'Backlash', arabic: 'رد فعل عنيف', example: 'Provoke public backlash.' }
        ]
    },
    '227': {
        title: "Digital Technologies and Escalation Risks",
        content: `Cyber weapons operate in murky domains where attribution is uncertain. A growing concern is the integration of AI decision-support systems in command structures, which could produce false alarms or misinterpret data. The speed of AI may compress decision-making timelines, increasing risks of unintended conflict where criminal networks can trigger international incidents.`,
        terms: [
            { id: 't82', english: 'Attribution', arabic: 'إسناد المسؤولية', example: 'Attribution is uncertain.' },
            { id: 't83', english: 'Escalatory', arabic: 'تصعيدي', example: 'Recommend escalatory actions.' },
            { id: 't84', english: 'Oversight', arabic: 'رقابة / إشراف', example: 'Robust oversight mechanisms.' }
        ]
    },
    '228': {
        title: "The Rising Challenge of Climate Migration",
        content: `Climate-induced migration is an urgent issue. As extreme weather events like floods and droughts intensify, millions relocate. Unlike political refugees, climate migrants often cross borders without legal protection. Climate stress acts as a "threat multiplier," intensifying existing grievances and triggering inter-group competition for scarce resources like water.`,
        terms: [
            { id: 't85', english: 'Induced', arabic: 'ناجم عن / مستحث', example: 'Climate-induced migration.' },
            { id: 't86', english: 'Grievances', arabic: 'تظلمات / مظالم', example: 'Existing grievances.' },
            { id: 't87', english: 'Xenophobic', arabic: 'معادٍ للأجانب', example: 'Xenophobic rhetoric.' }
        ]
    }
};

function getLessonsByLevel(levelId) {
    return lessonsList[levelId] || [];
}

function getLessonData(lessonId) {
    return lessonsData[lessonId] || null;
}
