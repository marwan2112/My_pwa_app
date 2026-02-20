class App {
    constructor() {
        if (!window.levels) {
            setTimeout(() => location.reload(), 500);
            return;
        }

        // الحالة العامة
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;

        // نظام التخزين (المحافظة على البيانات السابقة)
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.deletedStaticWords = JSON.parse(localStorage.getItem('deletedStaticWords')) || []; // الكلمات المحذوفة من data.js

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
        localStorage.setItem('deletedStaticWords', JSON.stringify(this.deletedStaticWords));
    }

    // --- 1. نظام الصوت المصلح ---
    playSound(type) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'correct') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        } else {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // Low buzz
        }

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }

    // --- 2. نظام الحذف الذكي (ثابت + مضاف) ---
    deleteWord(id) {
        if (confirm('حذف نهائي؟ لن تظهر هذه الكلمة مجدداً.')) {
            // إذا كانت كلمة مضافة من المستخدم
            if (String(id).startsWith('u')) {
                this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            } else {
                // إذا كانت من data.js (نضيفها للقائمة السوداء)
                this.deletedStaticWords.push(String(id));
            }
            this.masteredWords = this.masteredWords.filter(m => String(m) !== String(id));
            this.saveData();
            this.currentCardIndex = 0;
            this.render();
        }
    }

    // --- 3. تحضير الاختبار مع العداد ---
    prepareQuiz(terms) {
        // تصفية الكلمات المحذوفة نهائياً أولاً
        let pool = terms.filter(t => !this.deletedStaticWords.includes(String(t.id)));
        
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
        
        // جلب خيارات من كل الكلمات المتاحة (غير المحذوفة)
        let allPossible = [...lesson.terms, ...this.userVocabulary]
            .filter(t => !this.deletedStaticWords.includes(String(t.id)))
            .map(t => t.arabic);

        let wrongs = [...new Set(allPossible.filter(a => a !== q.arabic))];
        wrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        while(wrongs.length < 3) wrongs.push("خيار مكمل " + (wrongs.length + 1));
        this.quizOptions = [q.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const btns = document.querySelectorAll('.quiz-opt-btn');
        const isCorrect = (selected.trim() === correct.trim());

        btns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.innerText.trim() === correct.trim()) {
                btn.style.backgroundColor = '#22c55e';
                btn.style.color = 'white';
            } else if (btn.innerText.trim() === selected.trim() && !isCorrect) {
                btn.style.backgroundColor = '#ef4444';
                btn.style.color = 'white';
            }
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateCurrentOptions();
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
                case 'goHome': 
                    this.currentPage = 'home'; this.selectedLessonId = null; break;
                case 'selLevel': 
                    this.selectedLevel = param; this.currentPage = 'lessons'; break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel];
                    const unlocked = (list[0].id == param) || this.unlockedLessons.includes(String(param));
                    if (unlocked) { this.selectedLessonId = param; this.currentPage = 'reading'; }
                    else {
                        this.isUnlockTest = true; this.tempLessonToUnlock = param;
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        const prevTerms = window.lessonsData[list[prevIdx].id].terms;
                        this.prepareQuiz(prevTerms); this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    if (param === 'quiz') {
                        const lesson = window.lessonsData[this.selectedLessonId];
                        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
                        this.isUnlockTest = false;
                        this.prepareQuiz([...lesson.terms, ...added].filter(t => !this.masteredWords.includes(t.id)));
                    }
                    this.currentPage = param; break;
                case 'ansQ': this.handleAnswer(param, correct); break;
                case 'deleteWord': this.deleteWord(param); break;
                case 'masterWord': 
                    this.masteredWords.push(param); this.saveData(); this.render(); break;
                case 'resetReview':
                    const allIds = JSON.parse(param);
                    this.masteredWords = this.masteredWords.filter(id => !allIds.includes(String(id)));
                    this.saveData(); this.currentCardIndex = 0; this.render(); break;
                case 'speak': 
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); break;
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
        // تصفية المحذوف نهائياً من العرض
        const allTerms = (lesson ? [...lesson.terms, ...added] : [])
            .filter(t => !this.deletedStaticWords.includes(String(t.id)));

        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        const activeCount = terms.filter(t => !this.masteredWords.includes(t.id)).length;
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:100%;">📸 إضافة نص من الكاميرا / ملف</button><div class="features-grid" style="margin-top:20px;">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← الرئيسية</button><div class="features-grid" style="margin-top:15px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content"><button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← القائمة</button><div class="reading-card" style="margin-top:10px;">${lesson.content}</div>
                <div style="background:#f0fdf4; padding:15px; border-radius:12px; margin-top:10px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="English Word" style="width:100%; padding:10px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="المعنى العربي" style="width:100%; padding:10px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%;">+ إضافة</button>
                </div></main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && score >= 70) { this.unlockedLessons.push(String(this.tempLessonToUnlock)); this.saveData(); }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة النهائية: ${score}%</h2><p>صح: ${this.quizScore} من ${this.quizQuestions.length}</p><button class="hero-btn" data-action="goHome">العودة للرئيسية</button></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">✕ إنهاء</button>
                    <span style="font-weight:bold;">السؤال: ${this.quizIndex + 1} / ${this.quizQuestions.length}</span>
                </div>
                <div class="reading-card" style="text-align:center;">
                    <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button>
                    <div style="margin-top:20px;">${this.quizOptions.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o}" data-correct="${q.arabic}">${o}</button>`).join('')}</div>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) return `<main class="main-content" style="text-align:center;"><h2>🎉 اكتملت الكلمات!</h2><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(allTerms.map(t=>t.id))}'>إعادة مراجعة (المحفوظ فقط)</button></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">✕ خروج</button>
                    <span style="font-weight:bold;">${this.currentCardIndex+1} / ${active.length}</span>
                </div>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div>
                </div>
                <div style="display:flex; gap:10px;"><button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:1;">✅ حفظتها</button><button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; flex:1;">🗑️ حذف نهائي</button></div>
                <div style="text-align:center; margin-top:15px;"><button class="hero-btn" data-action="prevC">السابق</button><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
                <center><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(active.map(x=>x.id))}' style="background:#64748b; margin-top:10px;">🔄 إعادة تكرار هذه القائمة</button></center>
            </main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:15px;">
                    <h3>📸 استخراج نص من صورة</h3>
                    <input type="file" id="camInput" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camInput').click()" style="width:100%; background:#8b5cf6;">فتح الكاميرا / الاستوديو</button>
                    <textarea id="ocrText" placeholder="النص سيظهر هنا بعد المسح..." style="width:100%; height:150px; margin-top:10px; padding:10px; border-radius:8px;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص جديد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="width:100%; background:#16a34a; margin-top:10px;">حفظ كدرس جديد</button>
                </div></main>`;
        }
    }
}
window.onload = () => { window.appInstance = new App(); };
