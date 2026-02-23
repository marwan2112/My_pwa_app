/**
 * BOOSTER APP - ULTIMATE COMPLETE EDITION
 * المبرمج: مروان
 * الميزات: اختبار مستوى تكيفي، OCR كاميرا، بطاقات تعليمية، نظام حماية الدروس، حفظ سحابي محلي.
 */

class App {
    constructor() {
        // متغيرات اختبار المستوى التكيفي
        this.placementStep = 0;
        this.currentDifficulty = 'A2';
        this.placementHistory = [];
        this.placementScore = 0;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // التأكد من تحميل البيانات من ملف data.js
        if (!window.levels || !window.lessonsData || !window.placementBank) {
            setTimeout(() => this.init(), 500);
            return;
        }

        // تحميل بيانات المستخدم
        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.currentPage = this.userData ? 'home' : 'auth';
        
        // متغيرات الحالة (State)
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;
        this.scrollPos = 0; 
        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;

        // تحميل المجموعات والتقدم
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        // دمج الدروس المخصصة
        Object.assign(window.lessonsData, this.customLessons);

        // تهيئة الصوت
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.setupGlobalEvents();
        this.render();
    }

    // --- الدوال المساعدة والمنطق ---

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        if (this.userData) localStorage.setItem('userAccount', JSON.stringify(this.userData));
    }

    speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }

    playTone(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(type === 'correct' ? 800 : 300, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
    }

    // --- محرك اختبار تحديد المستوى (IELTS Engine) ---

    getAdaptiveQuestion() {
        const levelQuestions = window.placementBank[this.currentDifficulty];
        const available = levelQuestions.filter(q => !this.placementHistory.includes(q.q));
        const list = available.length > 0 ? available : levelQuestions;
        const selected = list[Math.floor(Math.random() * list.length)];
        this.placementHistory.push(selected.q);
        return selected;
    }

    handlePlacement(selected, correct) {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let idx = levels.indexOf(this.currentDifficulty);
        if (selected === correct) {
            if (idx < levels.length - 1) this.currentDifficulty = levels[idx + 1];
        } else {
            if (idx > 0) this.currentDifficulty = levels[idx - 1];
        }
        this.placementStep++;
        this.render();
    }

    getIeltsEquivalent(level) {
        const map = { 'A1': '2.0 - 3.0', 'A2': '3.0 - 4.0', 'B1': '4.0 - 5.0', 'B2': '5.5 - 6.5', 'C1': '7.0 - 8.0', 'C2': '8.5 - 9.0' };
        return map[level];
    }

    // --- محرك الاختبارات العادية ---

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        const addedByUser = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const fullPool = [...terms, ...addedByUser].filter(t => !this.hiddenFromCards.includes(String(t.id)));
        
        if (this.isUnlockTest) {
            this.quizQuestions = fullPool.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(fullPool.length/2)));
        } else {
            this.quizQuestions = fullPool;
        }
        this.quizIndex = 0; 
        this.quizScore = 0;
        this.generateOptions();
    }

    generateOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        const currentQ = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allArb = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        let wrongs = [...new Set(allArb.filter(a => a !== currentQ.arabic))].sort(() => 0.5 - Math.random()).slice(0, 3);
        while(wrongs.length < 3) wrongs.push("Option " + (wrongs.length + 1));
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected.trim() === correct.trim());
        
        if (isCorrect) { 
            this.quizScore++; 
            this.playTone('correct'); 
            btnElement.classList.add('correct-flash');
        } else { 
            this.playTone('error'); 
            btnElement.classList.add('wrong-flash');
        }

        setTimeout(() => { 
            this.quizIndex++; 
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions(); 
            this.isWaiting = false; 
            this.render(); 
        }, 1200);
    }

    // --- إدارة الأحداث ---

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }

            switch(action) {
                case 'goHome': 
                    this.currentPage = 'home'; 
                    this.selectedLessonId = null; 
                    break;
                case 'logout': 
                    if(confirm('هل تريد تسجيل الخروج وحذف البيانات؟')){ localStorage.clear(); location.reload(); } 
                    break;
                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;
                case 'selLesson':
                    this.scrollPos = window.scrollY;
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isUnlocked = this.unlockedLessons.includes(String(param)) || (list[0] && list[0].id == param) || this.selectedLevel === 'custom_list';
                    if (isUnlocked) { 
                        this.selectedLessonId = param; 
                        this.currentPage = 'reading'; 
                    } else {
                        const curIdx = list.findIndex(l => l.id == param);
                        const prevId = list[curIdx - 1].id;
                        this.tempLessonToUnlock = param; 
                        this.selectedLessonId = prevId;
                        this.prepareQuiz(window.lessonsData[prevId].terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    if (param === 'placement_test') {
                        this.placementStep = 0;
                        this.currentDifficulty = 'A2';
                        this.placementHistory = [];
                    }
                    if (param === 'quiz' && this.selectedLessonId) {
                        this.prepareQuiz(window.lessonsData[this.selectedLessonId].terms, false);
                    }
                    this.currentPage = param; 
                    this.currentCardIndex = 0; 
                    break;
                case 'masterWord': 
                    if(!this.masteredWords.includes(param)) this.masteredWords.push(param); 
                    this.saveData(); 
                    break;
                case 'deleteWord': 
                    if(confirm('حذف الكلمة من القائمة؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); } 
                    break;
                case 'speak': 
                    this.speak(param); 
                    break;
                case 'nextC': 
                    if (this.currentCardIndex < (parseInt(total) - 1)) this.currentCardIndex++; 
                    break;
                case 'prevC': 
                    if (this.currentCardIndex > 0) this.currentCardIndex--; 
                    break;
                case 'addNewWord':
                    this.handleNewWord();
                    break;
                case 'backToLessons': 
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    this.selectedLessonId = null; 
                    this.render(); 
                    setTimeout(() => window.scrollTo(0, this.scrollPos), 50);
                    return;
                case 'doAuth': 
                    this.handleAuth(); 
                    return;
            }
            this.render();
        });
    }

    handleAuth() {
        const name = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        if (name && email) {
            this.userData = { name, email };
            this.saveData();
            this.currentPage = 'home';
            this.render();
        } else {
            alert("يرجى إدخال الاسم والبريد الإلكتروني");
        }
    }

    handleNewWord() {
        const eng = document.getElementById('newEng').value.trim();
        const arb = document.getElementById('newArb').value.trim();
        if(eng && arb) {
            this.userVocabulary.push({ 
                id: "u"+Date.now(), 
                lessonId: String(this.selectedLessonId), 
                english: eng, 
                arabic: arb 
            });
            this.saveData();
            document.getElementById('newEng').value = '';
            document.getElementById('newArb').value = '';
            this.render();
        }
    }

    // --- واجهة العرض (Render Engine) ---

    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        
        app.innerHTML = this.getHeader() + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader() {
        if (this.currentPage === 'auth') return '';
        let nav = '';
        if (this.selectedLessonId && !['home', 'lessons', 'custom_lessons_view', 'addLesson', 'placement_test'].includes(this.currentPage)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">🏠 Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        // 1. شاشة تسجيل الدخول
        if (this.currentPage === 'auth') {
            return `<main class="main-content"><div class="reading-card" style="text-align:center;">
                <h2>🚀 Booster App</h2>
                <input id="authName" placeholder="الاسم" style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd;">
                <input id="authEmail" placeholder="الإيميل" style="width:100%; padding:12px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd;">
                <button class="hero-btn" data-action="doAuth" style="width:100%; background:#6366f1;">ابدأ الآن ✨</button>
            </div></main>`;
        }

        // 2. شاشة اختبار تحديد المستوى الذكي
        if (this.currentPage === 'placement_test') {
            if (this.placementStep >= 25) {
                const finalLevel = this.currentDifficulty;
                return `<div class="reading-card" style="text-align:center; padding:40px 20px;">
                    <h2 style="color:#6366f1;">🎊 النتيجة النهائية</h2>
                    <div style="font-size:4rem; font-weight:bold; color:#4f46e5; margin:20px 0;">${finalLevel}</div>
                    <p style="font-size:1.2rem;">مستواك يعادل IELTS: <b style="color:#10b981;">${this.getIeltsEquivalent(finalLevel)}</b></p>
                    <button class="hero-btn" data-action="goHome" style="width:100%; margin-top:30px; background:#6366f1;">ابدأ الدراسة حسب مستواك</button>
                </div>`;
            }
            const q = this.getAdaptiveQuestion();
            return `<div class="reading-card">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#666; margin-bottom:15px;">
                    <span>السؤال: ${this.placementStep + 1} / 25</span>
                    <span>المستوى الحالي: <b style="color:#6366f1;">${this.currentDifficulty}</b></span>
                </div>
                <div style="width:100%; height:6px; background:#eee; border-radius:10px; margin-bottom:25px;">
                    <div style="width:${(this.placementStep/25)*100}%; height:100%; background:#6366f1; border-radius:10px; transition:0.3s;"></div>
                </div>
                <h3 style="direction:ltr; text-align:left; line-height:1.6; margin-bottom:30px; font-size:1.3rem;">
                    ${q.q.replace('___', '<span style="color:#6366f1; text-decoration:underline;">_______</span>')}
                </h3>
                <div style="display:grid; gap:12px; direction:ltr;">
                    ${q.options.map(o => `<button class="quiz-opt-btn" onclick="appInstance.handlePlacement('${o}', '${q.correct}')">${o}</button>`).join('')}
                </div>
            </div>`;
        }

        // 3. الشاشة الرئيسية
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <div class="reading-card" style="background:linear-gradient(135deg,#6366f1,#a855f7); color:white;">
                    <h3>مرحباً، ${this.userData.name} 👋</h3>
                    <p>لقد أتقنت ${this.masteredWords.length} كلمة حتى الآن</p>
                </div>
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin:15px 0;">📸 إضافة نص من الكاميرا</button>
                <button class="hero-btn" data-action="setPage" data-param="placement_test" style="width:100%; background:#ec4899; margin-bottom:15px;">🧠 اختبار مستوى IELTS الذكي</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="background:#fff7ed; border:1px solid #f97316;"><h3>📂 نصوصي الخاصة</h3></div>` : ''}
                </div></main>`;
        }

        // 4. عرض الدروس
        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← العودة للرئيسية</button>
                <div class="features-grid">
                    ${list.map(l => { 
                        const isOk = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id))); 
                        return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isOk?'':'opacity:0.6;'}"><h3>${isOk?'':'🔒 '}${l.title}</h3></div>`; 
                    }).join('')}
                </div></main>`;
        }

        // 5. عرض النصوص المخصصة
        if (this.currentPage === 'custom_lessons_view') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px;">← العودة للرئيسية</button>
                <div class="features-grid">
                    ${Object.values(this.customLessons).map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>📝 ${l.title}</h3></div>`).join('')}
                </div></main>`;
        }

        // 6. صفحة قراءة النص
        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b;">⬅ تراجع</button>
                <h2 style="margin-bottom:15px;">${lesson.title}</h2>
                <div class="reading-card" style="direction:ltr; text-align:left; max-height:350px; overflow-y:auto; font-size:1.15rem; line-height:1.7; border:2px solid #eef;">
                    ${lesson.content}
                </div>
                <div class="reading-card" style="margin-top:20px; background:#f9fafb; border:1px dashed #6366f1;">
                    <h4 style="margin-bottom:10px;">إضافة كلمة جديدة لهذا الدرس:</h4>
                    <input id="newEng" placeholder="الكلمة بالإنجليزية" style="width:100%; padding:10px; margin:5px 0; border:1px solid #ddd; border-radius:5px;">
                    <input id="newArb" placeholder="الترجمة بالعربية" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#10b981;">حفظ الكلمة</button>
                </div></main>`;
        }

        // 7. صفحة البطاقات التعليمية
        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card">
                        <h2>🎉 مراجعة رائعة!</h2>
                        <p>لقد أنهيت جميع كلمات هذا الدرس.</p>
                        <button class="hero-btn" data-action="goHome" style="background:#10b981;">العودة للرئيسية</button>
                    </div></main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b;">⬅ تراجع</button>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1><small>انقر للقلب</small></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:25px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="background:#6366f1;">🔊</button>
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#10b981;">✅</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#ef4444;">🗑️</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px;">
                    <button class="hero-btn" data-action="prevC" style="padding:10px 25px;">السابق</button>
                    <span>${this.currentCardIndex + 1} / ${active.length}</span>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}" style="padding:10px 25px;">التالي</button>
                </div></main>`;
        }

        // 8. صفحة الاختبار (Quiz)
        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const scorePercent = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                const isPassed = scorePercent >= 75;
                if (this.isUnlockTest && isPassed) { 
                    this.unlockedLessons.push(String(this.tempLessonToUnlock)); 
                    this.saveData(); 
                }
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card">
                        <h2>${isPassed ? "🎉 أحسنت، لقد نجحت!" : "💪 حاول مرة أخرى"}</h2>
                        <h1 style="font-size:3.5rem; color:${isPassed?'#10b981':'#ef4444'}; margin:20px 0;">${scorePercent}%</h1>
                        <p>${isPassed ? "تم فتح الدرس التالي بنجاح." : "تحتاج إلى 75% لفتح الدرس التالي."}</p>
                        <button class="hero-btn" data-action="backToLessons" style="background:#3b82f6; margin-top:20px;">متابعة</button>
                    </div></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b;">⬅ خروج</button>
                <div class="reading-card" style="text-align:center;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:20px; color:#666;">
                        <span>السؤال ${this.quizIndex+1}/${this.quizQuestions.length}</span>
                        <span>النتيجة: ${this.quizScore}</span>
                    </div>
                    <h2 style="font-size:2rem; margin-bottom:10px;">${q.english}</h2>
                    <button class="hero-btn" data-action="speak" data-param="${q.english}" style="background:#6366f1; border-radius:50%; width:50px; height:50px; margin-bottom:30px;">🔊</button>
                    <div style="display:grid; gap:12px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        // 9. صفحة إضافة نص (كاميرا / OCR)
        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="background:#64748b;">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>📸 إضافة نص ذكي</h3>
                    <p style="color:#666; font-size:0.9rem; margin-bottom:15px;">يمكنك تصوير نص من كتاب أو لصقه هنا</p>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6; margin-bottom:15px;">📷 التقاط صورة / اختيار ملف</button>
                    <textarea id="ocrText" placeholder="النص المستخرج سيظهر هنا أو يمكنك الكتابة..." style="width:100%; height:180px; padding:12px; border:1px solid #ddd; border-radius:8px;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); 
                        const newL={id, title:'نص مخصص '+(Object.keys(appInstance.customLessons).length+1), content:t, terms:[]};
                        appInstance.customLessons[id]=newL; 
                        window.lessonsData[id]=newL; 
                        appInstance.saveData(); 
                        appInstance.selectedLessonId=id; 
                        appInstance.currentPage='reading'; 
                        appInstance.render(); 
                    }" style="width:100%; background:#10b981; margin-top:15px;">💾 حفظ النص والبدء بالدراسة</button>
                </div></main>`;
        }

        return `<div style="padding:20px; text-align:center;">جاري التحميل...</div>`;
    }
}

// تشغيل التطبيق
const appInstance = new App();
