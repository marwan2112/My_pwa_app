class App {
    constructor() {
        // الحماية من الشاشة البيضاء: التأكد من تحميل البيانات
        if (!window.levels) {
            setTimeout(() => location.reload(), 500);
            return;
        }

        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = []; // لتخزين الخيارات ومنع تغيرها عند ضغط الصوت
        this.isWaiting = false;

        // البيانات المخزنة
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];

        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;

        this.init();
    }

    init() {
        this.setupGlobalEvents();
        this.render();
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
    }

    playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = type === 'correct' ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(type === 'correct' ? 520 : 200, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }

    // --- 1. الحذف النهائي الفوري ---
    deleteWord(id) {
        if (confirm('هل تريد حذف هذه الكلمة نهائياً من التطبيق؟')) {
            this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            this.masteredWords = this.masteredWords.filter(m => String(m) !== String(id));
            this.saveData();
            // تصفير المؤشر لضمان عدم حدوث خطأ
            this.currentCardIndex = 0;
            this.render();
        }
    }

    // --- 2. إعداد الاختبار (منع الخيارات من التغير عند ضغط الصوت) ---
    prepareQuiz(terms) {
        if (!terms || terms.length === 0) {
            alert("لا توجد كلمات كافية للاختبار");
            this.currentPage = 'reading';
            this.render();
            return;
        }

        let pool = [...terms];
        // إذا كان اختبار فتح مستوى (يأخذ 50% فقط)
        if (this.isUnlockTest) {
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(pool.length * 0.5));
        }

        this.quizQuestions = pool.sort(() => 0.5 - Math.random());
        this.quizIndex = 0;
        this.quizScore = 0;
        this.isWaiting = false;
        this.generateCurrentOptions();
    }

    generateCurrentOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        
        const q = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLevel);
        const allPossible = [...lesson.terms, ...added, ...this.userVocabulary];

        let wrongs = allPossible
            .filter(t => t.arabic !== q.arabic)
            .map(t => t.arabic);
        
        // إزالة التكرار
        wrongs = [...new Set(wrongs)].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // إذا لم توجد كلمات كافية
        while(wrongs.length < 3) wrongs.push("خيار إضافي " + (wrongs.length + 1));

        this.quizOptions = [q.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    // --- 3. معالجة الإجابة (التوقيت والألوان) ---
    handleAnswer(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const btns = document.querySelectorAll('.quiz-opt-btn');
        const isCorrect = (selected.trim() === correct.trim());

        btns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.innerText.trim() === correct.trim()) {
                btn.classList.add('correct-flash');
            } else if (btn.innerText.trim() === selected.trim() && !isCorrect) {
                btn.classList.add('wrong-flash');
            }
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        // انتظار 3 ثوانٍ كاملة قبل الانتقال المتزامن
        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) {
                this.generateCurrentOptions();
            }
            this.isWaiting = false;
            this.render();
        }, 3000);
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            // منع الضغط أثناء الانتظار في الاختبار
            if (this.isWaiting && btn.dataset.action === 'ansQ') return;

            const { action, param, correct, total } = btn.dataset;

            switch(action) {
                case 'goHome': 
                    this.currentPage = 'home'; this.selectedLessonId = null; this.isUnlockTest = false; 
                    break;
                case 'selLevel': 
                    this.selectedLevel = param; this.currentPage = 'lessons'; 
                    break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel];
                    const isUnlocked = (list[0].id == param) || this.unlockedLessons.includes(String(param));
                    if (isUnlocked) {
                        this.selectedLessonId = param; this.currentPage = 'reading';
                    } else {
                        if (confirm('هذا الدرس مقفل. هل تريد تقديم اختبار لفتحه؟')) {
                            this.isUnlockTest = true;
                            this.tempLessonToUnlock = param;
                            const prevIdx = list.findIndex(l => l.id == param) - 1;
                            const prevLessonId = list[prevIdx].id;
                            const prevTerms = window.lessonsData[prevLessonId].terms;
                            this.prepareQuiz(prevTerms);
                            this.currentPage = 'quiz';
                        }
                    }
                    break;
                case 'setPage':
                    if (param === 'quiz') {
                        const lesson = window.lessonsData[this.selectedLessonId];
                        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
                        const pool = [...lesson.terms, ...added].filter(t => !this.masteredWords.includes(t.id));
                        this.isUnlockTest = false;
                        this.prepareQuiz(pool);
                    }
                    this.currentPage = param;
                    break;
                case 'ansQ': this.handleAnswer(param, correct); break;
                case 'deleteWord': this.deleteWord(param); break;
                case 'masterWord': 
                    this.masteredWords.push(param); this.saveData(); this.render(); 
                    break;
                case 'resetReview': // إعادة تكرار قبل الحفظ
                    const allIds = JSON.parse(param);
                    this.masteredWords = this.masteredWords.filter(id => !allIds.includes(id));
                    this.saveData(); this.currentCardIndex = 0; this.render();
                    break;
                case 'speak': 
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); 
                    break;
                case 'nextC': 
                    if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; 
                    break;
                case 'prevC': 
                    if (this.currentCardIndex > 0) this.currentCardIndex--; 
                    break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    if(eng && arb) {
                        this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                        this.saveData(); this.render();
                    }
                    break;
            }
            this.render();
        });

        // ترجمة تلقائية
        document.addEventListener('input', (e) => {
            if (e.target.id === 'newEng') {
                const arbInput = document.getElementById('newArb');
                fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(e.target.value)}&langpair=en|ar`)
                .then(res => res.json()).then(data => { if(data.responseData.translatedText) arbInput.value = data.responseData.translatedText; });
            }
        });
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];

        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        const activeCount = terms.filter(t => !this.masteredWords.includes(t.id)).length;
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest) {
            nav = `
                <nav class="nav-menu">
                    <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                    <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button>
                    <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
                </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        // --- الصفحة الرئيسية ---
        if (this.currentPage === 'home') {
            return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:100%;">📸 إضافة نص / كاميرا</button><div class="features-grid" style="margin-top:20px;">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div></main>`;
        }

        // --- قائمة الدروس ---
        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← خروج للرئيسية</button><div class="features-grid" style="margin-top:20px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3>${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'🔒'}</div>`).join('')}</div></main>`;
        }

        // --- صفحة القراءة ---
        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← خروج للقائمة</button>
                <div class="reading-card" style="margin-top:15px; line-height:1.8;">${lesson.content}</div>
                <div style="background:#f0fdf4; padding:15px; border-radius:12px; margin-top:15px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="الكلمة بالإنجليزية" style="width:100%; padding:10px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="المعنى" style="width:100%; padding:10px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ إضافة للقائمة</button>
                </div></main>`;
        }

        // --- صفحة الاختبار (حل مشكلة التزامن وتغير الخيارات) ---
        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore / this.quizQuestions.length) * 100;
                if (this.isUnlockTest && score >= 70) {
                    this.unlockedLessons.push(String(this.tempLessonToUnlock));
                    this.saveData();
                    return `<main class="main-content" style="text-align:center"><h2>نجحت! 🥳 (${score.toFixed(0)}%)</h2><button class="hero-btn" data-action="goHome">فتح الدرس والعودة</button></main>`;
                }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${score.toFixed(0)}%</h2><button class="hero-btn" data-action="setPage" data-param="reading">← العودة للدرس</button></main>`;
            }

            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="reading">← إنهاء الاختبار</button>
                <div class="reading-card" style="text-align:center; margin-top:15px;">
                    <div style="display:flex; justify-content:center; align-items:center; gap:10px;">
                        <h1>${q.english}</h1>
                        <button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button>
                    </div>
                    <div style="margin-top:25px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        // --- صفحة البطاقات (حل مشكلة إعادة التكرار والحذف) ---
        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) {
                return `<main class="main-content" style="text-align:center;"><h2>🎉 أحسنت! أنهيت الكلمات.</h2><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(allTerms.map(t=>t.id))}'>إعادة مراجعة المحفوظ</button></main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="reading">← خروج للدرس</button>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; gap:10px;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:1;">✅ حفظتها</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; flex:1;">🗑️ حذف نهائي</button>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <span>${this.currentCardIndex+1} / ${active.length}</span>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button>
                    <br><br>
                    <button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(active.map(x=>x.id))}' style="background:#64748b;">🔄 إعادة تكرار القائمة الحالية</button>
                </div></main>`;
        }

        return ``;
    }
}

// تشغيل التطبيق
window.onload = () => { window.appInstance = new App(); };
