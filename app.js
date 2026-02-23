/**
 * BOOSTER APP - ULTIMATE COMPLETE EDITION (EXTENDED)
 * المبرمج: مروان
 * التعديلات: إصلاح شامل مع الحفاظ على كافة الميزات السابقة (557+ سطر منطقي)
 */

class App {
    constructor() {
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
        if (!window.levels || !window.lessonsData || !window.placementBank) {
            setTimeout(() => this.init(), 500);
            return;
        }

        // استعادة كافة البيانات المخزنة
        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        // دمج الدروس المخصصة مع البيانات الأساسية
        Object.assign(window.lessonsData, this.customLessons);

        this.currentPage = this.userData ? 'home' : 'auth';
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
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.setupGlobalEvents();
        this.render();
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        if (this.userData) localStorage.setItem('userAccount', JSON.stringify(this.userData));
    }

    // --- نظام النطق المحسن (إصلاح النقطة 2) ---
    speak(text) {
        if (!text) return;
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.rate = 0.85;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
    }

    async translateAuto(text, targetId) {
        const el = document.getElementById(targetId);
        if(!el) return;
        el.innerText = "...";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
            const data = await res.json();
            el.innerText = data.responseData.translatedText;
        } catch(e) {
            el.innerText = "خطأ في الترجمة";
        }
    }

    playTone(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(type === 'correct' ? 800 : 300, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
    }

    // --- اختبار المستوى التكيفي (إصلاح النقطة 5 و 6) ---
    getAdaptiveQuestion() {
        const levelQuestions = window.placementBank[this.currentDifficulty];
        const available = levelQuestions.filter(q => !this.placementHistory.includes(q.q));
        const list = available.length > 0 ? available : levelQuestions;
        const selected = list[Math.floor(Math.random() * list.length)];
        this.placementHistory.push(selected.q);
        return selected;
    }

    handlePlacement(selected, correct) {
        if(this.isWaiting) return;
        this.isWaiting = true;

        // تنظيف النص لضمان المطابقة (إصلاح تعليق الأسئلة)
        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let idx = levels.indexOf(this.currentDifficulty);

        if (isCorrect) {
            this.playTone('correct');
            if (idx < levels.length - 1) this.currentDifficulty = levels[idx + 1];
        } else {
            this.playTone('error');
            // هبوط المستوى عند الخطأ (إصلاح النقطة 6)
            if (idx > 0) this.currentDifficulty = levels[idx - 1];
        }

        this.placementStep++;
        setTimeout(() => { 
            this.isWaiting = false; 
            this.render(); 
        }, 600);
    }

    getIeltsEquivalent(level) {
        const map = { 'A1': '2.0 - 3.0', 'A2': '3.0 - 4.0', 'B1': '4.0 - 5.0', 'B2': '5.5 - 6.5', 'C1': '7.0 - 8.0', 'C2': '8.5 - 9.0' };
        return map[level];
    }

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
        while(wrongs.length < 3) wrongs.push("خيار " + (wrongs.length + 1));
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
        }, 1100);
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
                    this.isUnlockTest = false;
                    break;
                case 'logout': 
                    if(confirm('هل تريد تسجيل الخروج؟')){ localStorage.clear(); location.reload(); } 
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
                        this.isUnlockTest = false;
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
                    this.currentPage = param;
                    if (param === 'quiz' && this.selectedLessonId) this.prepareQuiz(window.lessonsData[this.selectedLessonId].terms, false);
                    this.currentCardIndex = 0; 
                    break;
                case 'masterWord': 
                    if(!this.masteredWords.includes(String(param))) this.masteredWords.push(String(param)); 
                    this.saveData(); this.render();
                    break;
                case 'deleteWord': 
                    if(confirm('حذف من البطاقات؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); this.render(); } 
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
                case 'restartCards': 
                    // إصلاح النقطة 3: إمكانية تكرار المتبقي أو الكل
                    if(param === 'all') {
                        const lessonWords = window.lessonsData[this.selectedLessonId].terms.map(t => String(t.id));
                        this.masteredWords = this.masteredWords.filter(id => !lessonWords.includes(id));
                    }
                    this.currentCardIndex = 0;
                    this.saveData();
                    this.render();
                    break;
                case 'addNewWord':
                    this.handleNewWord();
                    break;
                case 'backToLessons': 
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false;
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
        const pass = document.getElementById('authPass').value;
        if (name && email && pass) {
            this.userData = { name, email, pass };
            this.saveData();
            this.currentPage = 'home';
            this.render();
        } else {
            alert("يرجى ملء كافة الحقول");
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

    // --- الكاميرا والـ OCR (إصلاح النقطة 1) ---
    async processOCR(input) {
        const file = input.files[0];
        if (!file) return;
        const textArea = document.getElementById('ocrText');
        textArea.value = "⏳ جاري استخراج النص... انتظر قليلاً";
        
        try {
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            textArea.value = ret.data.text;
            await worker.terminate();
        } catch (e) {
            textArea.value = "❌ حدث خطأ أثناء المعالجة";
        }
    }

    saveNewCustomLesson() {
        const title = document.getElementById('newLessonTitle').value.trim() || "نص مخصص " + (Object.keys(this.customLessons).length + 1);
        const content = document.getElementById('ocrText').value.trim();
        if (content) {
            const id = 'c' + Date.now();
            const newL = { id, title, content, terms: [] };
            this.customLessons[id] = newL;
            window.lessonsData[id] = newL;
            this.saveData();
            this.selectedLessonId = id;
            this.currentPage = 'reading';
            this.render();
        } else {
            alert("النص فارغ!");
        }
    }

    deleteCustomLesson(id) {
        if (confirm('حذف هذا النص نهائياً؟')) {
            delete this.customLessons[id];
            delete window.lessonsData[id];
            this.saveData();
            this.currentPage = 'home';
            this.render();
        }
    }

    editLessonTitle(id) {
        const newTitle = prompt("العنوان الجديد:", this.customLessons[id].title);
        if (newTitle) { this.customLessons[id].title = newTitle; this.saveData(); this.render(); }
    }

    editLessonContent(id) {
        const newContent = prompt("تعديل النص:", this.customLessons[id].content);
        if (newContent) { this.customLessons[id].content = newContent; this.saveData(); this.render(); }
    }

    // --- العرض (Render) ---
    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        
        app.innerHTML = this.getHeader() + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
        
        // الترجمة التلقائية للبطاقة الحالية
        if(this.currentPage === 'flashcards' && allTerms.length > 0) {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if(active[this.currentCardIndex]) {
                this.translateAuto(active[this.currentCardIndex].english, 'auto-trans-text');
            }
        }
    }

    getHeader() {
        if (this.currentPage === 'auth') return '';
        let nav = '';
        // إصلاح النقطة 4: إخفاء الأزرار أثناء اختبار الفتح
        if (this.selectedLessonId && ['reading', 'flashcards', 'quiz'].includes(this.currentPage) && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">🏠 Home</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'auth') {
            return `<main class="main-content"><div class="reading-card auth-form">
                <h2>🚀 Welcome to Booster</h2>
                <input id="authName" placeholder="الاسم الكامل">
                <input id="authEmail" placeholder="البريد الإلكتروني">
                <input type="password" id="authPass" placeholder="كلمة المرور">
                <button class="hero-btn" data-action="doAuth">انضم الآن ✨</button>
            </div></main>`;
        }

        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <div class="reading-card welcome-msg">
                    <h3>مرحباً، ${this.userData.name} 👋</h3>
                    <p>المستوى المحقق: ${this.masteredWords.length} كلمات</p>
                </div>
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6;">📸 إضافة نص (كاميرا / ملف / صورة)</button>
                <button class="hero-btn" data-action="setPage" data-param="placement_test" style="width:100%; background:#ec4899; margin:15px 0;">🧠 اختبار مستوى IELTS الذكي</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:1px solid #f97316;"><h3>📂 نصوصي الخاصة</h3></div>` : ''}
                </div>
                <button data-action="logout" class="logout-link">تسجيل الخروج</button>
            </main>`;
        }

        if (this.currentPage === 'placement_test') {
            if (this.placementStep >= 25) {
                return `<div class="reading-card result-view">
                    <h2>النتيجة النهائية</h2>
                    <div class="lvl-badge">${this.currentDifficulty}</div>
                    <p>يعادل IELTS: ${this.getIeltsEquivalent(this.currentDifficulty)}</p>
                    <button class="hero-btn" data-action="goHome">ابدأ التعلم</button>
                </div>`;
            }
            const q = this.getAdaptiveQuestion();
            return `<div class="reading-card">
                <div class="quiz-progress">السؤال ${this.placementStep + 1} / 25</div>
                <h3 class="placement-q">${q.q}</h3>
                <div class="options-grid-vertical">
                    ${q.options.map(o => `<button class="quiz-opt-btn" onclick="appInstance.handlePlacement('${o}', '${q.correct}')">${o}</button>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn back-btn" data-action="goHome">← الرئيسية</button>
                <div class="features-grid">
                    ${list.map(l => { 
                        const isOk = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id))); 
                        return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isOk?'':'opacity:0.6;'}"><h3>${isOk?'':'🔒 '}${l.title}</h3></div>`; 
                    }).join('')}
                </div></main>`;
        }

        if (this.currentPage === 'reading') {
            const isCustom = String(this.selectedLessonId).startsWith('c');
            return `<main class="main-content">
                <div class="lesson-header">
                    <h2>${lesson.title}</h2>
                    ${isCustom ? `<button onclick="appInstance.deleteCustomLesson('${this.selectedLessonId}')" class="del-btn">🗑️</button>` : ''}
                </div>
                <div class="reading-card lesson-body">
                    <div class="scrollable-text">${lesson.content}</div>
                </div>
                <div class="reading-card add-word-box">
                    <h4>إضافة كلمة جديدة:</h4>
                    <input id="newEng" placeholder="English Word">
                    <input id="newArb" placeholder="الترجمة">
                    <button class="hero-btn" data-action="addNewWord" style="background:#10b981;">حفظ</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<div class="reading-card empty-state">
                    <h3>🎉 اكتملت المراجعة!</h3>
                    <button class="hero-btn" data-action="restartCards" data-param="all">إعادة تكرار الكل 🔁</button>
                </div>`;
            }
            const t = active[this.currentCardIndex];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <button class="inner-speak" data-action="speak" data-param="${t.english}" onclick="event.stopPropagation()">🔊</button>
                            <h1>${t.english}</h1>
                        </div>
                        <div class="flashcard-back"><h1 id="auto-trans-text">${t.arabic}</h1></div>
                    </div>
                </div>
                <div class="card-controls-row">
                    <button class="ctrl-btn speak" data-action="speak" data-param="${t.english}">🔊 نطق</button>
                    <button class="ctrl-btn ok" data-action="masterWord" data-param="${t.id}">✅ حفظ</button>
                    <button class="ctrl-btn del" data-action="deleteWord" data-param="${t.id}">🗑️ حذف</button>
                </div>
                <div class="card-nav-row">
                    <button class="nav-arrow" data-action="prevC">السابق</button>
                    <button class="hero-btn retry-btn" data-action="restartCards" data-param="remaining">🔁 تكرار المتبقي</button>
                    <button class="nav-arrow" data-action="nextC" data-total="${active.length}">التالي</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore/this.quizQuestions.length) >= 0.75;
                if (this.isUnlockTest && score) this.unlockedLessons.push(String(this.tempLessonToUnlock));
                this.saveData();
                return `<div class="reading-card finish-quiz">
                    <h2>${score ? "نجحت! 🎉" : "حاول مجدداً 💪"}</h2>
                    <button class="hero-btn" data-action="backToLessons">متابعة</button>
                </div>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div class="reading-card quiz-card">
                    <div class="quiz-stat">السؤال ${this.quizIndex+1}/${this.quizQuestions.length}</div>
                    <h2>${q.english}</h2>
                    <button class="quiz-speak" data-action="speak" data-param="${q.english}">🔊</button>
                    <div class="quiz-options-list">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content"><div class="reading-card">
                <h3>📸 إضافة نص ذكي</h3>
                <p>اختر صورة، ملف PDF، أو التقط صورة مباشرة</p>
                <input type="file" id="filePicker" accept="image/*, application/pdf" onchange="appInstance.processOCR(this)" style="margin:20px 0;">
                <input id="newLessonTitle" placeholder="عنوان النص (اختياري)">
                <textarea id="ocrText" placeholder="النص سيظهر هنا بعد الاختيار..." style="height:150px;"></textarea>
                <button class="hero-btn" onclick="appInstance.saveNewCustomLesson()" style="width:100%; background:#10b981; margin-top:10px;">💾 حفظ النص والبدء</button>
            </div></main>`;
        }
        return `<div>Loading...</div>`;
    }
}

const appInstance = new App();
