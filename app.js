/**
 * BOOSTER APP - PRO VERSION (Marwan Edition)
 * كود شامل: قفل المستويات، الكاميرا، البطاقات، الاختبارات الملونة، والترجمة التلقائية.
 */

class App {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // التأكد من تحميل البيانات قبل التشغيل لمنع الشاشة البيضاء
        if (!window.levels || !window.lessonsData) {
            setTimeout(() => this.init(), 500);
            return;
        }

        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;
        this.typingTimer = null; 

        // استعادة البيانات من الذاكرة
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        // دمج الدروس المضافة من الكاميرا
        Object.assign(window.lessonsData, this.customLessons);

        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;

        this.setupGlobalEvents();
        this.render();
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
    }

    // --- ميزة الترجمة التلقائية عند الكتابة ---
    async translateWord(word) {
        if (!word || word.trim().length < 2) return "";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ar`);
            const data = await res.json();
            return data.responseData ? data.responseData.translatedText : "";
        } catch (error) { return ""; }
    }

    handleTypingTranslate(word) {
        clearTimeout(this.typingTimer);
        const arbInput = document.getElementById('newArb');
        this.typingTimer = setTimeout(async () => {
            if (word.trim().length > 1) {
                const suggested = await this.translateWord(word);
                if (suggested && (arbInput.value.trim() === "" || arbInput.dataset.auto === "true")) {
                    arbInput.value = suggested;
                    arbInput.dataset.auto = "true";
                }
            } else { arbInput.value = ""; }
        }, 500); 
    }

    // --- نظام الاختبار والخيارات الأربعة ---
    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        let pool = [...terms]; 
        if (this.isUnlockTest) {
            let halfCount = Math.max(1, Math.floor(pool.length / 2));
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, halfCount);
        }
        this.quizQuestions = pool.sort(() => 0.5 - Math.random());
        this.quizIndex = 0;
        this.quizScore = 0;
        this.isWaiting = false;
        this.generateOptions();
    }

    generateOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        const currentQ = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allPool = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        let wrongs = [...new Set(allPool.filter(a => a !== currentQ.arabic))].sort(() => 0.5 - Math.random()).slice(0, 3);
        while(wrongs.length < 3) wrongs.push("خيار " + (wrongs.length + 1));
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected.trim() === correct.trim());
        const btns = document.querySelectorAll('.quiz-opt-btn');

        btns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.innerText.trim() === correct.trim()) {
                btn.classList.add('correct-flash'); // اللون الأخضر
            } else if (btn === btnElement && !isCorrect) {
                btn.classList.add('wrong-flash'); // اللون الأحمر
            }
        });

        if (isCorrect) this.quizScore++;

        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions();
            this.isWaiting = false;
            this.render();
        }, 1500);
    }

    // --- إدارة الأحداث (Events) ---
    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }

            switch(action) {
                case 'goHome': this.currentPage = 'home'; this.selectedLessonId = null; break;
                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isUnlocked = this.unlockedLessons.includes(String(param)) || (list[0] && list[0].id == param) || this.selectedLevel === 'custom_list';
                    if (isUnlocked) {
                        this.selectedLessonId = param;
                        this.currentPage = 'reading';
                    } else {
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        this.tempLessonToUnlock = param;
                        this.selectedLessonId = list[prevIdx].id;
                        this.prepareQuiz(window.lessonsData[list[prevIdx].id].terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    if (param === 'quiz') {
                        const l = window.lessonsData[this.selectedLessonId];
                        const a = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
                        this.prepareQuiz([...l.terms, ...a], false);
                    }
                    this.currentPage = param; 
                    break;
                case 'masterWord':
                    this.masteredWords.push(param); this.saveData(); this.render(); break;
                case 'deleteWord':
                    if(confirm('حذف البطاقة؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); this.render(); } break;
                case 'speak': 
                    const u = new SpeechSynthesisUtterance(param); u.lang = 'en-US';
                    window.speechSynthesis.speak(u); break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    if(eng && arb) {
                        this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                        this.saveData(); this.render();
                    } break;
                case 'restartCards': this.currentCardIndex = 0; this.render(); break;
            }
            this.render();
        });
    }

    // --- الرسم (Rendering) ---
    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        const active = terms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest && !['home', 'lessons', 'custom_lessons_view'].includes(this.currentPage)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${active.length})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome">Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-bottom:20px;">📸 إضافة نص من الكاميرا</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="background:#fef3c7; border:2px solid #f59e0b;"><h3>📂 نصوصي المحفوظة</h3></div>` : ''}
                </div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <div class="features-grid" style="margin-top:20px;">${list.map(l => {
                    const ok = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id)));
                    return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${ok?'':'opacity:0.6;'}"><h3>${ok?'':'🔒 '}${l.title}</h3></div>`;
                }).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← عودة</button>
                <h2 style="margin-top:15px;">${lesson.title}</h2>
                <div class="reading-card" style="direction:ltr; text-align:left; font-family:'Poppins';">${lesson.content}</div>
                <div style="background:white; padding:15px; border-radius:12px; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <h4>أضف كلمة جديدة:</h4>
                    <input id="newEng" placeholder="English Word" style="width:100%; padding:10px; margin:5px 0;" oninput="appInstance.handleTypingTranslate(this.value)">
                    <input id="newArb" placeholder="المعنى بالعربي" style="width:100%; padding:10px; margin-bottom:10px;" oninput="this.dataset.auto='false'">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#16a34a;">+ حفظ الكلمة</button>
                </div></main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const s = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && s >= 70) { 
                    this.unlockedLessons.push(String(this.tempLessonToUnlock)); 
                    this.saveData(); 
                }
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card"><h1>النتيجة: ${s}%</h1>
                    <button class="hero-btn" data-action="goHome">متابعة</button></div></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div class="reading-card" style="text-align:center;">
                    <p>سؤال ${this.quizIndex+1}/${this.quizQuestions.length}</p>
                    <h1>${q.english}</h1>
                    <div style="margin-top:30px; display:grid; gap:10px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) return `<div class="main-content"><h2>انتهت الكلمات! 🎉</h2><button class="hero-btn" data-action="goHome">عودة</button></div>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:1;">✅ حفظت</button>
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="flex:1;">🔊 نطق</button>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button>
                </div></main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>📸 استخراج نص من الكاميرا</h3>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6;">فتح الكاميرا</button>
                    <textarea id="ocrText" placeholder="النص سيظهر هنا..." style="width:100%; height:150px; margin-top:10px;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); 
                        const newL={id, title:'نص مصور ' + new Date().toLocaleDateString(), content:t, terms:[]};
                        appInstance.customLessons[id]=newL;
                        window.lessonsData[id]=newL; 
                        appInstance.saveData(); 
                        appInstance.selectedLessonId=id;
                        appInstance.currentPage='reading';
                        appInstance.render(); 
                    }" style="width:100%; background:#16a34a; margin-top:10px;">حفظ النص</button>
                </div></main>`;
        }
    }
}
const appInstance = new App();
