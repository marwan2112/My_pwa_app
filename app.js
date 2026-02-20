class App {
    constructor() {
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.isWaiting = false;

        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];

        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;
        this.init();
    }

    init() { this.render(); this.setupGlobalEvents(); }

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

    handleAnswer(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const btns = document.querySelectorAll('.quiz-opt-btn');
        const isCorrect = (selected.trim() === correct.trim());

        btns.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText.trim() === correct.trim()) btn.classList.add('correct-flash');
            else if (btn.innerText.trim() === selected.trim() && !isCorrect) btn.classList.add('wrong-flash');
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        setTimeout(() => {
            this.quizIndex++;
            this.isWaiting = false;
            this.render();
        }, 3000);
    }

    deleteWord(id) {
        if (confirm('حذف نهائي من القائمة؟')) {
            this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            this.masteredWords = this.masteredWords.filter(m => String(m) !== String(id));
            this.saveData();
            this.currentCardIndex = 0;
            this.render();
        }
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || (this.isWaiting && btn.dataset.action === 'ansQ')) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'goHome') { this.currentPage = 'home'; this.selectedLessonId = null; }
            else if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
            else if (action === 'selLesson') {
                const list = window.lessonsList[this.selectedLevel];
                const unlocked = (list[0].id == param) || this.unlockedLessons.includes(String(param));
                if (unlocked) { this.selectedLessonId = param; this.currentPage = 'reading'; }
                else {
                    this.isUnlockTest = true; this.tempLessonToUnlock = param;
                    const idx = list.findIndex(l => String(l.id) === String(param));
                    const prevId = list[idx - 1].id;
                    const prevTerms = [...(window.lessonsData[prevId].terms || []), ...this.userVocabulary.filter(v => String(v.lessonId) === String(prevId))];
                    this.prepareQuiz(prevTerms); this.currentPage = 'quiz';
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
            else if (action === 'ansQ') this.handleAnswer(param, correct);
            else if (action === 'deleteWord') this.deleteWord(param);
            else if (action === 'masterWord') { this.masteredWords.push(param); this.saveData(); this.render(); }
            else if (action === 'resetReview') {
                const ids = JSON.parse(param);
                this.masteredWords = this.masteredWords.filter(id => !ids.includes(id));
                this.saveData(); this.currentCardIndex = 0; this.render();
            }
            else if (action === 'speak') window.speechSynthesis.speak(new SpeechSynthesisUtterance(param));
            else if (action === 'nextC') { if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; }
            else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
            else if (action === 'addNewWord') {
                const eng = document.getElementById('newEng').value;
                const arb = document.getElementById('newArb').value;
                if(eng && arb) {
                    this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                    this.saveData(); this.render();
                }
            }
            this.render();
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'newEng') {
                const arbInput = document.getElementById('newArb');
                fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(e.target.value)}&langpair=en|ar`)
                .then(res => res.json()).then(data => { if(data.responseData.translatedText) arbInput.value = data.responseData.translatedText; });
            }
        });
    }

    prepareQuiz(terms) {
        let pool = this.isUnlockTest ? terms.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(terms.length * 0.5)) : [...terms];
        if (pool.length === 0) pool = [{id:'0', english:'No words', arabic:'لا توجد كلمات'}];
        this.quizQuestions = pool.sort(() => 0.5 - Math.random());
        this.quizIndex = 0; this.quizScore = 0; this.isWaiting = false;
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
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${this.selectedLessonId ? `<nav class="nav-menu"><button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button><button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button><button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button></nav>` : ''}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:100%; margin-bottom:20px;">📸 إضافة نص / كاميرا</button><div class="features-grid">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div></main>`;
        
        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← الرئيسية</button><div class="features-grid" style="margin-top:15px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}" style="margin-bottom:10px;">← الدروس</button>
                <div class="reading-card" style="flex:1; overflow-y:auto; text-align:left; line-height:1.8; font-size:1.1rem;">
                    ${lesson ? lesson.content : 'لا يوجد محتوى لهذا الدرس'}
                </div>
                <div style="background:#f0fdf4; padding:15px; border-radius:12px; margin-top:10px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="الكلمة بالإنجليزية" style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:8px;">
                    <input type="text" id="newArb" placeholder="المعنى (سيظهر تلقائياً)" style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:8px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ إضافة للبطاقات</button>
                </div></main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${((this.quizScore/this.quizQuestions.length)*100).toFixed(0)}%</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع للدرس</button></main>`;
            const q = this.quizQuestions[this.quizIndex];
            let others = allTerms.filter(t => t.arabic !== q.arabic).map(t => t.arabic);
            let wrongs = others.sort(() => 0.5 - Math.random()).slice(0, 3);
            while(wrongs.length < 3) wrongs.push("خيارات الدرس " + (wrongs.length + 1));
            let opts = [q.arabic, ...wrongs].sort(() => 0.5 - Math.random());
            return `<main class="main-content"><div class="reading-card" style="text-align:center;">
                <div style="display:flex; justify-content:center; align-items:center; gap:10px;"><h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button></div>
                <div style="margin-top:20px;">${opts.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o}" data-correct="${q.arabic}">${o}</button>`).join('')}</div>
            </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) return `<main class="main-content" style="text-align:center;"><h2>🎉 اكتملت الكلمات!</h2><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(allTerms.map(t=>t.id))}'>إعادة مراجعة المحفوظ</button></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content"><div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div></div><div style="display:flex; justify-content:center; gap:10px; margin:15px 0;"><button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669;">✅ حفظتها</button><button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626;">🗑️ حذف نهائي</button></div><div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${active.length}</span><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div></main>`;
        }

        if (this.currentPage === 'addLesson') return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button><div class="reading-card" style="margin-top:20px;"><input type="file" accept="image/*" onchange="const f=event.target.files[0]; if(f) Tesseract.recognize(f,'eng').then(r=>{document.getElementById('custom-text-input').value=r.data.text;})"><textarea id="custom-text-input" placeholder="الصق النص هنا..." style="width:100%; height:150px; margin:10px 0; padding:10px;"></textarea><button class="hero-btn" onclick="const t=document.getElementById('custom-text-input').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="background:#16a34a; width:100%;">حفظ كدرس جديد</button></div></main>`;
    }
}
window.onload = () => { window.appInstance = new App(); };
