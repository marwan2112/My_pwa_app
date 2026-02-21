/**
 * BOOSTER APP - PRO VERSION (Marwan Edition)
 * كود كامل: يشمل الكاميرا، تعديل أسماء الدروس، القفل، البطاقات بالتنقل، والترجمة.
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

        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

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

    speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }

    async translateWord(word) {
        if (!word || word.trim().length < 2) return "";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ar`);
            const data = await res.json();
            return data.responseData ? data.responseData.translatedText : "";
        } catch (error) { return ""; }
    }

    handleTypingTranslate(word) {
        const arbInput = document.getElementById('newArb');
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(async () => {
            if (word.trim().length > 1) {
                const suggested = await this.translateWord(word);
                if (suggested && (arbInput.value.trim() === "" || arbInput.dataset.auto === "true")) {
                    arbInput.value = suggested;
                    arbInput.dataset.auto = "true";
                }
            }
        }, 500);
    }

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        let pool = terms.filter(t => !this.hiddenFromCards.includes(String(t.id)));
        if (this.isUnlockTest) {
            const halfCount = Math.max(1, Math.floor(pool.length / 2));
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, halfCount);
        }
        this.quizQuestions = pool; 
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
            if (btn.innerText.trim() === correct.trim()) btn.classList.add('correct-flash');
            else if (btn === btnElement && !isCorrect) btn.classList.add('wrong-flash');
        });
        if (isCorrect) this.quizScore++;
        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions();
            this.isWaiting = false;
            this.render();
        }, 1200);
    }

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
                        const currentIdx = list.findIndex(l => l.id == param);
                        const prevLessonId = list[currentIdx - 1].id;
                        this.tempLessonToUnlock = param;
                        this.selectedLessonId = prevLessonId;
                        this.prepareQuiz(window.lessonsData[prevLessonId].terms, true);
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
                    this.currentCardIndex = 0; 
                    break;
                case 'masterWord':
                    if(!this.masteredWords.includes(param)) this.masteredWords.push(param); 
                    this.saveData(); this.render(); break;
                case 'deleteWord':
                    if(confirm('حذف نهائي؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); this.render(); } break;
                case 'speak': this.speak(param); break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'repeatList': this.currentCardIndex = 0; this.render(); break;
                case 'renameLesson':
                    const newName = prompt('أدخل الاسم الجديد للدرس:', this.customLessons[param].title);
                    if (newName) {
                        this.customLessons[param].title = newName;
                        window.lessonsData[param].title = newName;
                        this.saveData(); this.render();
                    }
                    break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    if(eng && arb) {
                        this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                        this.saveData(); this.render();
                    } break;
            }
            this.render();
        });
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        app.innerHTML = this.getHeader() + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader() {
        let nav = '';
        const list = window.lessonsList[this.selectedLevel] || [];
        const isUnlocked = this.selectedLessonId && (this.unlockedLessons.includes(String(this.selectedLessonId)) || (list[0] && list[0].id == this.selectedLessonId) || this.selectedLevel === 'custom_list');

        if (isUnlocked && !['home', 'lessons', 'custom_lessons_view', 'addLesson'].includes(this.currentPage)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">🏠 Home</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-bottom:20px;">📸 إضافة نص من الكاميرا</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="background:#fff7ed; border:1px solid #f97316;"><h3>📂 نصوصي المحفوظة</h3></div>` : ''}
                </div></main>`;
        }

        if (this.currentPage === 'custom_lessons_view') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <h3 style="margin:20px 0;">نصوصي الخاصة:</h3>
                <div class="features-grid">${Object.values(this.customLessons).map(l => `
                    <div class="feature-card" style="position:relative;">
                        <div data-action="selLesson" data-param="${l.id}"><h3>📝 ${l.title}</h3></div>
                        <button data-action="renameLesson" data-param="${l.id}" style="position:absolute; top:5px; left:5px; background:none; border:none; font-size:1rem;">✏️</button>
                    </div>`).join('')}</div></main>`;
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
                <h2 style="margin-bottom:15px;">${lesson.title}</h2>
                <div class="reading-card" style="direction:ltr; text-align:left; font-size:1.1rem; line-height:1.6;">${lesson.content}</div>
                <div class="reading-card" style="margin-top:20px; background:#f9fafb;">
                    <h4>أضف كلمة للبطاقات:</h4>
                    <input id="newEng" placeholder="English" style="width:100%; padding:10px; margin:5px 0;" oninput="appInstance.handleTypingTranslate(this.value)">
                    <input id="newArb" placeholder="العربية" style="width:100%; padding:10px; margin-bottom:10px;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#10b981;">حفظ في البطاقات</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) return `<main class="main-content" style="text-align:center;"><div class="reading-card"><h2>تم إنهاء الكلمات! 🎉</h2><button class="hero-btn" data-action="goHome">الرئيسية</button></div></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:20px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="background:#6366f1;">🔊 نطق</button>
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#10b981;">✅ حفظت</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#ef4444;">🗑️ حذف</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px;">
                    <button class="nav-btn" data-action="prevC">السابق</button>
                    <button class="nav-btn" data-action="repeatList" style="background:#f59e0b;">🔁 تكرار</button>
                    <button class="nav-btn" data-action="nextC" data-total="${active.length}">التالي</button>
                </div>
                <p style="text-align:center; margin-top:10px; color:#6b7280;">${this.currentCardIndex + 1} / ${active.length}</p>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const s = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                let msg = (this.isUnlockTest && s >= 50) ? "🎉 مبروك! تم فتح الدرس" : `النتيجة: ${s}%`;
                if (this.isUnlockTest && s >= 50) { this.unlockedLessons.push(String(this.tempLessonToUnlock)); this.saveData(); }
                return `<main class="main-content" style="text-align:center;"><div class="reading-card"><h2>${msg}</h2><button class="hero-btn" data-action="goHome">متابعة</button></div></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div class="reading-card" style="text-align:center;">
                    <span data-action="speak" data-param="${q.english}" style="cursor:pointer; font-size:1.5rem; float:right;">🔊</span>
                    <p>سؤال ${this.quizIndex+1}/${this.quizQuestions.length}</p>
                    <h1 style="margin:20px 0;">${q.english}</h1>
                    <div style="display:grid; gap:10px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>📸 تصوير نص جديد</h3>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6;">📷 فتح الكاميرا / الاستوديو</button>
                    <textarea id="ocrText" placeholder="النص سيظهر هنا..." style="width:100%; height:150px; margin-top:15px; padding:10px;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); 
                        const newL={id, title:'نص جديد', content:t, terms:[]};
                        appInstance.customLessons[id]=newL;
                        window.lessonsData[id]=newL; 
                        appInstance.saveData(); 
                        appInstance.selectedLessonId=id;
                        appInstance.currentPage='reading';
                        appInstance.render(); 
                    }" style="width:100%; background:#10b981; margin-top:10px;">💾 حفظ وبدء الدراسة</button>
                </div></main>`;
        }
    }
}
const appInstance = new App();
