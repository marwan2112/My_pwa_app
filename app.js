class App {
    constructor() {
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];

        // تحسين تحميل البيانات لتجنب الشاشة البيضاء
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];

        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;
        this.init();
    }

    init() {
        this.render();
        this.setupGlobalEvents();
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
    }

    isLessonUnlocked(lessonId, levelId) {
        const levelLessons = (window.lessonsList && window.lessonsList[levelId]) ? window.lessonsList[levelId] : [];
        if (levelLessons.length > 0 && String(levelLessons[0].id) === String(lessonId)) return true;
        return this.unlockedLessons.includes(String(lessonId));
    }

    // تجهيز الاختبار مع ضمان 4 خيارات ومنع التكرار
    prepareQuiz(terms) {
        const shuffled = [...terms].sort(() => 0.5 - Math.random());
        const limit = this.isUnlockTest ? Math.max(1, Math.floor(terms.length / 2)) : terms.length;
        this.quizQuestions = shuffled.slice(0, limit);
        this.quizIndex = 0;
        this.quizScore = 0;
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'goHome') { this.currentPage = 'home'; this.selectedLessonId = null; this.selectedLevel = null; }
            else if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
            else if (action === 'selLesson') {
                if (this.isLessonUnlocked(param, this.selectedLevel)) {
                    this.selectedLessonId = param; this.currentPage = 'reading';
                } else {
                    if (confirm('الدرس مقفل. هل تود اجتياز اختبار الفتح؟')) {
                        this.isUnlockTest = true;
                        this.tempLessonToUnlock = param;
                        // جلب كلمات الدرس السابق
                        const list = window.lessonsList[this.selectedLevel];
                        const idx = list.findIndex(l => String(l.id) === String(param));
                        const prevId = list[idx - 1].id;
                        const prevTerms = [...(window.lessonsData[prevId].terms || []), ...this.userVocabulary.filter(v => String(v.lessonId) === String(prevId))];
                        this.prepareQuiz(prevTerms);
                        this.currentPage = 'quiz';
                    }
                }
            }
            else if (action === 'setPage') {
                if (param === 'quiz') {
                    const lesson = window.lessonsData[this.selectedLessonId];
                    const added = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
                    this.prepareQuiz([...(lesson?.terms || []), ...added].filter(t => !this.masteredWords.includes(t.id)));
                }
                this.currentPage = param;
            }
            else if (action === 'ansQ') { this.handleAnswer(btn, param, correct); }
            else if (action === 'speak') { window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); }
            else if (action === 'masterWord') { this.toggleMastered(param); }
            else if (action === 'deleteWord') { this.deleteWord(param); }
            else if (action === 'nextC') { if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; }
            else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
            else if (action === 'addNewWord') { this.manualAddWord(); }

            this.render();
        });
    }

    handleAnswer(btn, selected, correct) {
        const btns = document.querySelectorAll('.quiz-opt-btn');
        btns.forEach(b => {
            b.style.pointerEvents = 'none';
            if (b.dataset.param === correct) b.style.background = "#22c55e";
            else if (b.dataset.param === selected) b.style.background = "#ef4444";
            b.style.color = "white";
        });
        if (selected === correct) this.quizScore++;
        setTimeout(() => { this.quizIndex++; this.render(); }, 1000);
    }

    toggleMastered(id) {
        if (this.masteredWords.includes(id)) this.masteredWords = this.masteredWords.filter(i => i !== id);
        else this.masteredWords.push(id);
        this.saveData();
    }

    deleteWord(id) {
        if (confirm('حذف الكلمة؟')) {
            this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            this.saveData();
        }
    }

    manualAddWord() {
        const eng = document.getElementById('newEng').value.trim();
        const arb = document.getElementById('newArb').value.trim();
        if (eng && arb) {
            this.userVocabulary.push({ id: "u" + Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
            this.saveData();
            this.render();
        }
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData ? window.lessonsData[this.selectedLessonId] : null;
        const added = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
        const allTerms = [...(lesson?.terms || []), ...added];

        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        const activeCount = terms.filter(t => !this.masteredWords.includes(t.id)).length;
        return `
        <header class="header">
            <div class="header-content">
                <h2 data-action="goHome" style="cursor:pointer">English Booster</h2>
                ${this.selectedLessonId ? `
                <nav class="nav-menu">
                    <button class="nav-btn ${this.currentPage === 'reading' ? 'active' : ''}" data-action="setPage" data-param="reading">النص</button>
                    <button class="nav-btn ${this.currentPage === 'flashcards' ? 'active' : ''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button>
                    <button class="nav-btn ${this.currentPage === 'quiz' ? 'active' : ''}" data-action="setPage" data-param="quiz">الاختبار</button>
                </nav>` : ''}
            </div>
        </header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <div class="hero"><h1>خطة الاحتراف</h1></div>
                <div class="features-grid">${(window.levels || []).map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div>
            </main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← العودة للرئيسية</button>
                <div class="features-grid" style="margin-top:15px;">
                    ${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${this.isLessonUnlocked(l.id, this.selectedLevel) ? '' : 'opacity:0.5; position:relative;'}">
                        <h3>${l.title}</h3>${this.isLessonUnlocked(l.id, this.selectedLevel) ? '' : '🔒'}
                    </div>`).join('')}
                </div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← عودة للدروس</button>
                <div class="reading-card" style="flex:1; overflow-y:auto; margin-top:10px; text-align:left; font-size:1.1rem; line-height:1.6;">${lesson?.content}</div>
                <div style="background:#f0fdf4; padding:10px; border-radius:12px; margin-top:10px;">
                    <input type="text" id="newEng" placeholder="الكلمة بالإنجليزية" style="width:100%; padding:8px; margin-bottom:5px; border-radius:5px; border:1px solid #ccc;">
                    <input type="text" id="newArb" placeholder="المعنى بالعربي" style="width:100%; padding:8px; margin-bottom:5px; border-radius:5px; border:1px solid #ccc;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ حفظ الكلمة</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) return `<main class="main-content" style="text-align:center"><h2>🎉 أحسنت! أنهيت كل الكلمات.</h2></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; gap:10px; margin:15px 0;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; margin:0;">✅ حفظتها</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; margin:0;">🗑️ حذف</button>
                </div>
                <div class="controls">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <span>${this.currentCardIndex + 1} / ${active.length}</span>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore / this.quizQuestions.length) * 100;
                if (this.isUnlockTest) {
                    if (score >= 70) {
                        return `<main class="main-content" style="text-align:center"><h2>نجحت! (${score.toFixed(0)}%)</h2><button class="hero-btn" onclick="appInstance.unlockedLessons.push('${this.tempLessonToUnlock}'); appInstance.saveData(); appInstance.isUnlockTest=false; appInstance.selectedLessonId='${this.tempLessonToUnlock}'; appInstance.currentPage='reading'; appInstance.render();">افتح الدرس الآن</button></main>`;
                    }
                    return `<main class="main-content" style="text-align:center"><h2>لم تنجح (${score.toFixed(0)}%)</h2><p>تحتاج 70% لفتح الدرس.</p><button class="hero-btn" data-action="goHome">عودة</button></main>`;
                }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore} من ${this.quizQuestions.length}</h2><button class="hero-btn" data-action="setPage" data-param="reading">عودة للدرس</button></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            // تجهيز 4 خيارات
            let options = [q];
            let pool = allTerms.filter(t => t.id !== q.id);
            options = [...options, ...pool.sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());

            return `<main class="main-content">
                <div class="reading-card">
                    <h3 style="text-align:center;">سؤال ${this.quizIndex + 1} من ${this.quizQuestions.length}</h3>
                    <h1 style="text-align:center; margin:30px 0;">${q.english}</h1>
                    <div class="options-grid">
                        ${options.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}
                    </div>
                </div>
            </main>`;
        }
    }
}

// التشغيل الآمن
window.addEventListener('load', () => {
    window.appInstance = new App();
});
