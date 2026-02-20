class App {
    constructor() {
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
        this.quizOptions = [];
        this.isWaiting = false;

        // البيانات المخزنة
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        // مصفوفة خاصة فقط للكلمات التي لا نريد رؤيتها في "البطاقات" فقط
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];

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
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
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

    // --- 1. تعديل وظيفة الحذف (للبطاقات فقط) ---
    deleteFromCards(id) {
        if (confirm('إزالة من البطاقات؟ (ستبقى موجودة في الاختبارات)')) {
            this.hiddenFromCards.push(String(id));
            this.saveData();
            this.currentCardIndex = 0;
            this.render();
        }
    }

    // --- 2. فصل الاختبارات التام ---
    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        
        // في الاختبار، نستخدم كل الكلمات حتى المحذوفة من البطاقات
        let pool = [...terms];
        
        if (this.isUnlockTest) {
            // اختبار فتح الدرس: 50% من كلمات الدرس السابق فقط
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(pool.length * 0.5));
        }

        this.quizQuestions = pool.sort(() => 0.5 - Math.random());
        this.quizIndex = 0;
        this.quizScore = 0;
        this.isWaiting = false;
        this.generateOptions();
    }

    generateOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        const q = this.quizQuestions[this.quizIndex];
        
        // جلب خيارات من مستودع الكلمات الكامل لضمان عدم النقص
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allWords = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        
        let wrongs = [...new Set(allWords.filter(a => a !== q.arabic))];
        wrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        while(wrongs.length < 3) wrongs.push("خيار مكمل " + (wrongs.length + 1));
        this.quizOptions = [q.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    // --- 3. إصلاح ظهور الألوان (أخضر وأحمر) ---
    handleAnswer(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const btns = document.querySelectorAll('.quiz-opt-btn');
        const isCorrect = (selected.trim() === correct.trim());

        btns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.innerText.trim() === correct.trim()) {
                btn.setAttribute('style', 'background-color: #22c55e !important; color: white !important; width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px;');
            } else if (btn.innerText.trim() === selected.trim() && !isCorrect) {
                btn.setAttribute('style', 'background-color: #ef4444 !important; color: white !important; width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px;');
            }
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions();
            this.isWaiting = false;
            this.render();
        }, 3000);
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || (this.isWaiting && btn.dataset.action === 'ansQ')) return;
            const { action, param, correct, total } = btn.dataset;

            switch(action) {
                case 'goHome': this.currentPage = 'home'; break;
                case 'selLevel': this.selectedLevel = param; this.currentPage = 'lessons'; break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel];
                    const unlocked = (list[0].id == param) || this.unlockedLessons.includes(String(param));
                    if (unlocked) { 
                        this.selectedLessonId = param; 
                        this.currentPage = 'reading'; 
                    } else {
                        // اختبار فتح درس منفصل تماماً
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        const prevTerms = window.lessonsData[list[prevIdx].id].terms;
                        this.tempLessonToUnlock = param;
                        this.prepareQuiz(prevTerms, true); 
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    if (param === 'quiz') {
                        const lesson = window.lessonsData[this.selectedLessonId];
                        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
                        // اختبار داخل الدرس: يشمل المضاف ولا يتأثر بحذف البطاقات
                        this.prepareQuiz([...lesson.terms, ...added], false);
                    }
                    this.currentPage = param; break;
                case 'ansQ': this.handleAnswer(param, correct); break;
                case 'deleteWord': this.deleteFromCards(param); break;
                case 'masterWord': this.masteredWords.push(param); this.saveData(); this.render(); break;
                case 'resetReview': 
                    const ids = JSON.parse(param);
                    this.masteredWords = this.masteredWords.filter(id => !ids.includes(String(id)));
                    this.hiddenFromCards = this.hiddenFromCards.filter(id => !ids.includes(String(id)));
                    this.saveData(); this.render(); break;
                case 'speak': window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
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
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];

        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        // العداد في الهيدر يحسب المتبقي في البطاقات فقط
        const cardTerms = terms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${cardTerms.length})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:100%;">📸 كاميرا / إضافة نص</button><div class="features-grid" style="margin-top:20px;">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← الرئيسية</button><div class="features-grid" style="margin-top:20px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
        }

        // --- 4. وضع النص داخل تبويب داخلي مرتب ---
        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← الدروس</button>
                <div class="reading-card" style="margin-top:15px; border-top: 5px solid #1e40af;">
                    <div style="max-height:400px; overflow-y:auto; padding-right:10px;">${lesson.content}</div>
                </div>
                <div style="background:#f0fdf4; padding:15px; border-radius:12px; margin-top:15px; border:1px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="كلمة جديدة" style="width:100%; padding:8px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="المعنى" style="width:100%; padding:8px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%;">+ إضافة للقاموس</button>
                </div></main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && score >= 70) { this.unlockedLessons.push(String(this.tempLessonToUnlock)); this.saveData(); }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${score}%</h2><p>صح: ${this.quizScore} من ${this.quizQuestions.length}</p><button class="hero-btn" data-action="goHome">إنهاء</button></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">✕ خروج</button>
                    <b style="font-size:1.2rem;">${this.quizIndex + 1} / ${this.quizQuestions.length}</b>
                </div>
                <div class="reading-card" style="text-align:center; margin-top:15px;">
                    <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button>
                    <div style="margin-top:20px;">${this.quizOptions.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o}" data-correct="${q.arabic}">${o}</button>`).join('')}</div>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            // تصفية الكلمات المحذوفة من البطاقات فقط
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (!active.length) return `<main class="main-content" style="text-align:center;"><h2>🎉 انتهت البطاقات!</h2><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(allTerms.map(t=>t.id))}'>إعادة مراجعة الكل</button></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">← رجوع</button>
                    <b>${this.currentCardIndex+1} / ${active.length}</b>
                </div>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div>
                </div>
                <div style="display:flex; gap:10px;"><button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:1;">✅ حفظتها</button><button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; flex:1;">🗑️ إزالة من هنا</button></div>
                <div style="text-align:center; margin-top:15px;"><button class="hero-btn" data-action="prevC">السابق</button><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
            </main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button><div class="reading-card" style="margin-top:15px;">
                <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrT').value=r.data.text;}) }">
                <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6;">📸 فتح الكاميرا</button>
                <textarea id="ocrT" placeholder="النص المستخرج..." style="width:100%; height:150px; margin-top:10px; padding:10px;"></textarea>
                <button class="hero-btn" onclick="const t=document.getElementById('ocrT').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="width:100%; background:#16a34a; margin-top:10px;">حفظ الدرس</button>
            </div></main>`;
        }
    }
}
window.onload = () => { window.appInstance = new App(); };
