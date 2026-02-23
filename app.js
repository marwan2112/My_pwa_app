/**
 * BOOSTER APP - PRO EDITION 2026
 * المبرمج: مروان
 * كود كامل وشامل لجميع المتطلبات
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
        if (!window.levels || !window.lessonsData || !window.placementBank) {
            setTimeout(() => this.init(), 500);
            return;
        }

        // تحميل البيانات من LocalStorage
        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        Object.assign(window.lessonsData, this.customLessons);
        
        this.currentPage = this.userData ? 'home' : 'auth';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.isWaiting = false;
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

    // --- محرك الصوت والترجمة ---
    speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }

    async getTranslation(text) {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
            const data = await res.json();
            return data.responseData.translatedText;
        } catch(e) { return "ترجمة مقترحة..."; }
    }

    playTone(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(type === 'correct' ? 800 : 300, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
    }

    // --- نظام اختبار المستوى ---
    handlePlacementAnswer(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected === correct);
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let idx = levels.indexOf(this.currentDifficulty);

        if (isCorrect) {
            this.playTone('correct');
            if (idx < levels.length - 1) this.currentDifficulty = levels[idx + 1];
        } else {
            this.playTone('error');
            if (idx > 0) this.currentDifficulty = levels[idx - 1];
        }

        this.placementStep++;
        setTimeout(() => { this.isWaiting = false; this.render(); }, 1000);
    }

    // --- نظام الاختبارات وفتح الدروس ---
    prepareQuiz(lessonId, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        const lesson = window.lessonsData[lessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == lessonId);
        let pool = [...lesson.terms, ...added].filter(t => !this.hiddenFromCards.includes(String(t.id)));
        
        // اختبار الفتح يأخذ نصف الكلمات فقط
        this.quizQuestions = isUnlockMode ? pool.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(pool.length/2)) : pool;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.generateOptions();
    }

    generateOptions() {
        const currentQ = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId];
        let allArb = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        let wrongs = [...new Set(allArb.filter(a => a !== currentQ.arabic))].sort(() => 0.5 - Math.random()).slice(0, 3);
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    // --- الأحداث العامة ---
    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct } = btn.dataset;

            switch(action) {
                case 'doAuth':
                    const n = document.getElementById('authName').value;
                    const em = document.getElementById('authEmail').value;
                    const ps = document.getElementById('authPass').value;
                    if(n && em && ps) { this.userData = {name:n, email:em}; this.saveData(); this.currentPage='home'; }
                    break;
                case 'goHome': this.currentPage = 'home'; this.selectedLessonId = null; break;
                case 'selLevel': this.selectedLevel = param; this.currentPage = (param==='custom'?'custom_view':'lessons'); break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isFirst = list[0] && list[0].id == param;
                    if (isFirst || this.unlockedLessons.includes(String(param)) || this.selectedLevel === 'custom') {
                        this.selectedLessonId = param; this.currentPage = 'reading';
                    } else {
                        const curIdx = list.findIndex(l => l.id == param);
                        this.tempUnlockId = param;
                        this.selectedLessonId = list[curIdx-1].id;
                        this.prepareQuiz(this.selectedLessonId, true);
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage': this.currentPage = param; if(param==='quiz') this.prepareQuiz(this.selectedLessonId, false); break;
                case 'speak': this.speak(param); break;
                case 'nextC': this.currentCardIndex++; break;
                case 'prevC': this.currentCardIndex--; break;
                case 'masterWord': this.masteredWords.push(param); this.saveData(); break;
                case 'deleteWord': if(confirm('حذف؟')){this.hiddenFromCards.push(param); this.saveData();} break;
                case 'resetCards': 
                    if(param==='all') {
                        const lessonWords = window.lessonsData[this.selectedLessonId].terms.map(t=>String(t.id));
                        this.masteredWords = this.masteredWords.filter(id => !lessonWords.includes(id));
                    }
                    this.currentCardIndex = 0; this.saveData(); break;
            }
            this.render();
        });
    }

    // --- الواجهة الرسومية (Render) ---
    render() {
        const app = document.getElementById('app');
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];

        // الهيدر
        let header = '';
        if (this.currentPage !== 'auth') {
            let nav = '';
            if (this.selectedLessonId && ['reading','flashcards','quiz'].includes(this.currentPage)) {
                nav = `<div class="nav-tabs">
                    <button class="${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                    <button class="${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                    <button class="${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
                </div>`;
            }
            header = `<header class="main-header">
                <div class="header-inner"><h2 data-action="goHome">🏠 Home</h2>${nav}</div>
            </header>`;
        }

        app.innerHTML = header + `<div class="content-area">${this.getView(lesson, allTerms)}</div>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'auth') {
            return `<div class="auth-card">
                <h2>IELTS Booster 🚀</h2>
                <input id="authName" placeholder="الاسم الكامل">
                <input id="authEmail" placeholder="البريد الإلكتروني">
                <input type="password" id="authPass" placeholder="كلمة المرور">
                <button class="btn-primary" data-action="doAuth">إنشاء حساب</button>
            </div>`;
        }

        if (this.currentPage === 'home') {
            return `<div class="home-grid">
                <div class="welcome-banner"><h3>مرحباً، ${this.userData.name}</h3><p>أتقنت ${this.masteredWords.length} كلمة</p></div>
                <button class="btn-hero" data-action="setPage" data-param="camera">📸 إضافة نص من الكاميرا</button>
                <button class="btn-hero" data-action="setPage" data-param="placement">🧠 فحص المستوى الذكي</button>
                <div class="levels-container">
                    ${window.levels.map(l => `<div class="level-card" data-action="selLevel" data-param="${l.id}">${l.icon} <h4>${l.name}</h4></div>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'placement') {
            if (this.placementStep >= 25) {
                return `<div class="result-card"><h2>مستواك هو: ${this.currentDifficulty}</h2><button data-action="goHome">ابدأ الآن</button></div>`;
            }
            const q = window.placementBank[this.currentDifficulty][this.placementStep % 5];
            return `<div class="quiz-card">
                <div class="progress-bar"><div style="width:${(this.placementStep/25)*100}%"></div></div>
                <p>السؤال ${this.placementStep+1}/25</p>
                <h3>${q.q}</h3>
                <div class="options-list">
                    ${q.options.map(o => `<button class="opt-btn" onclick="appInstance.handlePlacementAnswer('${o}','${q.correct}')">${o}</button>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'reading') {
            return `<div class="reading-view">
                <button class="btn-back" data-action="backToLessons">⬅ رجوع</button>
                <div class="text-container"><h2>${lesson.title}</h2><div class="scrollable-text">${lesson.content}</div></div>
                <div class="add-word-zone">
                    <input id="newEng" placeholder="Word" oninput="appInstance.getTranslation(this.value).then(t=>document.getElementById('newArb').value=t)">
                    <input id="newArb" placeholder="الترجمة">
                    <button onclick="appInstance.addNewWord()">إضافة كلمة</button>
                </div>
            </div>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0 || this.currentCardIndex >= active.length) {
                return `<div class="end-screen">
                    <h3>🎊 انتهت الكلمات!</h3>
                    <button data-action="resetCards" data-param="all">إعادة تكرار الكل 🔁</button>
                    <button data-action="goHome">الرئيسية</button>
                </div>`;
            }
            const t = active[this.currentCardIndex];
            return `<div class="flashcard-view">
                <div class="card" onclick="this.classList.toggle('flipped')">
                    <div class="front"><h1>${t.english}</h1></div>
                    <div class="back"><h1>${t.arabic}</h1></div>
                </div>
                <div class="controls">
                    <button data-action="speak" data-param="${t.english}">🔊</button>
                    <button data-action="masterWord" data-param="${t.id}">✅ حفظ</button>
                    <button data-action="deleteWord" data-param="${t.id}">🗑️ حذف</button>
                </div>
                <div class="nav-btns">
                    <button data-action="prevC" ${this.currentCardIndex===0?'disabled':''}>السابق</button>
                    <button data-action="resetCards" data-param="remaining" title="إعادة تكرار المتبقي">🔁</button>
                    <button data-action="nextC">التالي</button>
                </div>
            </div>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const pass = (this.quizScore/this.quizQuestions.length) >= 0.75;
                if(pass && this.isUnlockTest) this.unlockedLessons.push(String(this.tempUnlockId));
                this.saveData();
                return `<div class="quiz-result"><h2>${pass?'نجحت!':'حاول مجدداً'}</h2><button data-action="goHome">متابعة</button></div>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<div class="quiz-card">
                <h3>${q.english}</h3>
                <button class="btn-speak" data-action="speak" data-param="${q.english}">🔊 استمع</button>
                <div class="options-grid">
                    ${this.quizOptions.map(o => `<button class="opt-btn" onclick="appInstance.checkAnswer(this,'${o}','${q.arabic}')">${o}</button>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'camera') {
            return `<div class="camera-view">
                <input type="file" accept="image/*" capture="environment" onchange="appInstance.doOCR(this)">
                <textarea id="ocrRes" placeholder="النص المستخرج..."></textarea>
                <button onclick="appInstance.saveCameraText()">حفظ النص</button>
            </div>`;
        }
    }

    // --- وظائف إضافية مكملة ---
    checkAnswer(el, selected, correct) {
        if(this.isWaiting) return; this.isWaiting = true;
        const isRight = selected === correct;
        el.style.background = isRight ? '#10b981' : '#ef4444';
        if(isRight) { this.quizScore++; this.playTone('correct'); } else { this.playTone('error'); }
        setTimeout(() => { this.quizIndex++; if(this.quizIndex < this.quizQuestions.length) this.generateOptions(); this.isWaiting=false; this.render(); }, 1000);
    }

    addNewWord() {
        const eng = document.getElementById('newEng').value;
        const arb = document.getElementById('newArb').value;
        if(eng && arb) {
            this.userVocabulary.push({id: Date.now(), lessonId: this.selectedLessonId, english: eng, arabic: arb});
            this.saveData(); this.render();
        }
    }

    async doOCR(input) {
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(input.files[0]);
        document.getElementById('ocrRes').value = text;
        await worker.terminate();
    }

    saveCameraText() {
        const txt = document.getElementById('ocrRes').value;
        if(txt) {
            const id = 'c'+Date.now();
            this.customLessons[id] = {id, title: "نص كاميرا", content: txt, terms: []};
            this.saveData(); this.currentPage='home'; this.render();
        }
    }
}

const appInstance = new App();
