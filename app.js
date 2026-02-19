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
        this.typingTimer = null;

        this.init();
    }

    init() {
        this.render();
        this.setupGlobalEvents();
    }

    // --- نظام الصوت (Web Audio API) ---
    playSound(type) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);
        }
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
    }

    // --- الترجمة التلقائية ---
    async fetchTranslation() {
        const eng = document.getElementById('newEng')?.value.trim();
        const arbInput = document.getElementById('newArb');
        if (!eng || !arbInput) return;
        arbInput.placeholder = "جاري جلب ترجمة...";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(eng)}&langpair=en|ar`);
            const data = await res.json();
            if (data.responseData.translatedText) arbInput.value = data.responseData.translatedText;
        } catch (e) { arbInput.placeholder = "اكتب الترجمة يدوياً"; }
    }

    // --- معالجة الصور (OCR) ---
    async scanImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        const status = document.getElementById('ocr-status');
        status.innerText = "⏳ جاري استخراج النص من الصورة...";
        try {
            const result = await Tesseract.recognize(file, 'eng');
            document.getElementById('custom-text-input').value = result.data.text;
            status.innerText = "✅ اكتمل المسح بنجاح!";
        } catch (e) { status.innerText = "❌ فشل المسح، تأكد من وضوح الصورة."; }
    }

    // --- منطق الاختبار ---
    prepareQuiz(terms) {
        const shuffled = [...terms].sort(() => 0.5 - Math.random());
        const limit = this.isUnlockTest ? Math.max(1, Math.floor(terms.length / 2)) : terms.length;
        this.quizQuestions = shuffled.slice(0, limit);
        this.quizIndex = 0;
        this.quizScore = 0;
        this.isWaiting = false;
    }

    handleAnswer(btn, selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const isCorrect = (selected === correct);
        const btns = document.querySelectorAll('.quiz-opt-btn');

        btns.forEach(b => {
            b.style.pointerEvents = 'none';
            if (b.dataset.param === correct) {
                b.style.background = "#22c55e"; b.style.color = "white";
            } else if (b.dataset.param === selected && !isCorrect) {
                b.style.background = "#ef4444"; b.style.color = "white";
            }
        });

        if (isCorrect) { this.quizScore++; this.playSound('correct'); }
        else { this.playSound('wrong'); }

        setTimeout(() => {
            this.quizIndex++;
            this.isWaiting = false;
            this.render();
        }, 3000); // فاصل 3 ثوانٍ ثابت
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || this.isWaiting) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'goHome') { this.currentPage = 'home'; this.selectedLessonId = null; }
            else if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
            else if (action === 'selLesson') {
                const isFirst = window.lessonsList[this.selectedLevel][0].id == param;
                if (isFirst || this.unlockedLessons.includes(String(param))) {
                    this.selectedLessonId = param; this.currentPage = 'reading'; this.currentCardIndex = 0;
                } else {
                    if (confirm('الدرس مقفل! هل تود خوض اختبار الفتح (70% نجاح)؟')) {
                        this.isUnlockTest = true; this.tempLessonToUnlock = param;
                        const list = window.lessonsList[this.selectedLevel];
                        const idx = list.findIndex(l => String(l.id) === String(param));
                        const prevId = list[idx - 1].id;
                        const prevTerms = [...(window.lessonsData[prevId].terms || []), ...this.userVocabulary.filter(v => String(v.lessonId) === String(prevId))];
                        this.prepareQuiz(prevTerms); this.currentPage = 'quiz';
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
            else if (action === 'speak') window.speechSynthesis.speak(new SpeechSynthesisUtterance(param));
            else if (action === 'ansQ') this.handleAnswer(btn, param, correct);
            else if (action === 'masterWord') { this.masteredWords.push(param); this.saveData(); this.render(); }
            else if (action === 'deleteWord') { if(confirm('حذف نهائي؟')) { this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(param)); this.masteredWords = this.masteredWords.filter(id => id !== param); this.saveData(); this.render(); } }
            else if (action === 'nextC') { if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; }
            else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
            else if (action === 'addNewWord') {
                const eng = document.getElementById('newEng').value;
                const arb = document.getElementById('newArb').value;
                if(eng && arb) { this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb }); this.saveData(); this.render(); }
            }
            this.render();
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'newEng') {
                clearTimeout(this.typingTimer);
                this.typingTimer = setTimeout(() => this.fetchTranslation(), 1000);
            }
        });
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
        return `<header class="header"><div class="header-content"><h2 data-action="goHome">English Booster</h2>${this.selectedLessonId ? `<nav class="nav-menu"><button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button><button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button><button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button></nav>`:'' }</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6;">📸 إضافة نص / كاميرا</button>
                <div class="features-grid">${(window.levels || []).map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div>
            </main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <p id="ocr-status" style="text-align:center; color:#4f46e5; font-weight:bold;"></p>
                    <input type="file" id="imageInput" accept="image/*" style="display:none;" onchange="appInstance.scanImage(event)">
                    <button class="hero-btn" onclick="document.getElementById('imageInput').click()" style="background:#8b5cf6; width:100%;">📸 مسح صورة من الاستوديو/الكاميرا</button>
                    <textarea id="custom-text-input" placeholder="أو الصق النص هنا..." style="width:100%; height:150px; margin:10px 0; border-radius:8px; padding:10px;"></textarea>
                    <button class="hero-btn" onclick="const t = document.getElementById('custom-text-input').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="background:#16a34a; width:100%;">💾 حفظ النص كدرس جديد</button>
                </div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button><div class="features-grid" style="margin-top:15px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3>${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'🔒'}</div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
                <div class="reading-card" style="flex:1; overflow-y:auto; text-align:left; line-height:1.7;">${lesson?.content}</div>
                <div style="background:#f0fdf4; padding:10px; border-radius:12px; margin-top:10px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="الكلمة الإنجليزية" style="width:100%; padding:8px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="الترجمة (تظهر تلقائياً)" style="width:100%; padding:8px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ إضافة للقائمة</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) return `<main class="main-content" style="text-align:center;"><h2>🎉 اكتملت الكلمات!</h2><button class="hero-btn" onclick="appInstance.masteredWords = []; appInstance.saveData(); appInstance.render();">إعادة المراجعة</button></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div>
                </div>
                <div style="display:flex; justify-content:center; gap:10px; margin:15px 0;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; margin:0;">✅ حفظتها</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; margin:0;">🗑️ حذف نهائي</button>
                </div>
                <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${active.length}</span><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore / this.quizQuestions.length) * 100;
                if (this.isUnlockTest && score >= 70) return `<main class="main-content" style="text-align:center"><h2>نجحت! 🥳 (${score.toFixed(0)}%)</h2><button class="hero-btn" onclick="appInstance.unlockedLessons.push('${this.tempLessonToUnlock}'); appInstance.saveData(); appInstance.isUnlockTest=false; appInstance.selectedLessonId='${this.tempLessonToUnlock}'; appInstance.currentPage='reading'; appInstance.render();">فتح الدرس الآن</button></main>`;
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${score.toFixed(0)}%</h2><button class="hero-btn" data-action="goHome">العودة</button></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            let opts = [q, ...allTerms.filter(t=>t.id!==q.id).sort(()=>0.5-Math.random()).slice(0,3)];
            while(opts.length < 4) opts.push({arabic: '---'}); // سد النقص إذا كان الدرس صغيراً
            opts.sort(()=>0.5-Math.random());

            return `<main class="main-content"><div class="reading-card">
                <div style="display:flex; justify-content:center; align-items:center; gap:15px;"><h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button></div>
                <div class="options-grid" style="margin-top:20px;">${opts.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div>
            </div></main>`;
        }
    }
}
window.onload = () => { window.appInstance = new App(); };
