class App {
    constructor() {
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.isWaiting = false; // لمنع التفاعل أثناء الفاصل الزمني

        // تحميل البيانات
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

    // --- نظام الصوت المحسن ---
    playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
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
        } catch (e) { console.log("Audio play blocked by browser"); }
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
    }

    // --- منطق الاختبار وتوليد الخيارات (حل مشكلة الفراغات) ---
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

        // تغيير الألوان فوراً
        btns.forEach(b => {
            b.style.pointerEvents = 'none';
            if (b.dataset.param === correct) {
                b.style.background = "#22c55e"; b.style.color = "white"; b.style.borderColor = "#22c55e";
            } else if (b.dataset.param === selected && !isCorrect) {
                b.style.background = "#ef4444"; b.style.color = "white"; b.style.borderColor = "#ef4444";
            }
        });

        if (isCorrect) { this.quizScore++; this.playSound('correct'); }
        else { this.playSound('wrong'); }

        // فاصل 3 ثوانٍ قبل الانتقال المتزامن
        setTimeout(() => {
            this.quizIndex++;
            this.isWaiting = false;
            this.render();
        }, 3000);
    }

    // --- ميزات الحذف والترجمة ---
    deleteWord(id) {
        if (confirm('هل تريد حذف هذه الكلمة نهائياً؟')) {
            this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            this.masteredWords = this.masteredWords.filter(mid => String(mid) !== String(id));
            this.saveData();
            this.currentCardIndex = 0; 
            this.render();
        }
    }

    async fetchTranslation() {
        const eng = document.getElementById('newEng')?.value.trim();
        const arbInput = document.getElementById('newArb');
        if (!eng || !arbInput) return;
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(eng)}&langpair=en|ar`);
            const data = await res.json();
            if (data.responseData.translatedText) arbInput.value = data.responseData.translatedText;
        } catch (e) { console.error("Translation failed"); }
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || (this.isWaiting && btn.dataset.action === 'ansQ')) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'goHome') { this.currentPage = 'home'; this.selectedLessonId = null; }
            else if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
            else if (action === 'selLesson') {
                const unlocked = (window.lessonsList[this.selectedLevel][0].id == param) || this.unlockedLessons.includes(String(param));
                if (unlocked) { this.selectedLessonId = param; this.currentPage = 'reading'; this.currentCardIndex = 0; }
                else {
                    if (confirm('الدرس مقفل. ابدأ اختبار الفتح؟')) {
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
            else if (action === 'deleteWord') this.deleteWord(param);
            else if (action === 'nextC') { if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; }
            else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
            else if (action === 'resetReview') { this.masteredWords = this.masteredWords.filter(id => !param.includes(id)); this.saveData(); this.render(); }
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
            return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6;">📸 الكاميرا / نص جديد</button><div class="features-grid">${(window.levels || []).map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;"><p id="ocr-status"></p>
                <input type="file" id="imageInput" accept="image/*" style="display:none;" onchange="appInstance.scanImage(event)">
                <button class="hero-btn" onclick="document.getElementById('imageInput').click()" style="background:#8b5cf6; width:100%;">📸 مسح صورة</button>
                <textarea id="custom-text-input" placeholder="الصق النص هنا..." style="width:100%; height:150px; margin:10px 0; border-radius:8px; padding:10px;"></textarea>
                <button class="hero-btn" onclick="const t = document.getElementById('custom-text-input').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="background:#16a34a; width:100%;">حفظ</button>
                </div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع للرئيسية</button><div class="features-grid" style="margin-top:15px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'opacity:0.5;'}"><h3>${l.title}</h3>${(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)))?'':'🔒'}</div>`).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← رجوع للدروس</button>
                <div class="reading-card" style="flex:1; overflow-y:auto; text-align:left; line-height:1.7; margin-top:10px;">${lesson?.content}</div>
                <div style="background:#f0fdf4; padding:10px; border-radius:12px; margin-top:10px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="Word" style="width:100%; padding:8px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="المعنى" style="width:100%; padding:8px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ إضافة</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) {
                const lessonIds = allTerms.map(t => t.id);
                return `<main class="main-content" style="text-align:center;"><h2>🎉 اكتملت الكلمات!</h2><button class="hero-btn" data-action="resetReview" data-param='${JSON.stringify(lessonIds)}'>إعادة مراجعة المحفوظ</button></main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="reading">← رجوع للنص</button>
                <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div>
                </div>
                <div style="display:flex; justify-content:center; gap:10px; margin:15px 0;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; margin:0;">✅ حفظتها</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; margin:0;">🗑️ حذف</button>
                </div>
                <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${active.length}</span><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore / this.quizQuestions.length) * 100;
                if (this.isUnlockTest && score >= 70) {
                    return `<main class="main-content" style="text-align:center"><h2>نجحت! 🥳</h2><button class="hero-btn" onclick="appInstance.unlockedLessons.push('${this.tempLessonToUnlock}'); appInstance.saveData(); appInstance.isUnlockTest=false; appInstance.selectedLessonId='${this.tempLessonToUnlock}'; appInstance.currentPage='reading'; appInstance.render();">دخول الدرس</button></main>`;
                }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${score.toFixed(0)}%</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع</button></main>`;
            }

            const q = this.quizQuestions[this.quizIndex];
            // توليد 4 خيارات (تأكد من عدم وجود فراغات)
            let otherOptions = allTerms.filter(t => t.id !== q.id).map(t => t.arabic);
            if (otherOptions.length < 3) otherOptions = [...otherOptions, "خيار إضافي 1", "خيار إضافي 2", "خيار إضافي 3"];
            let opts = [q.arabic, ...otherOptions.sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());

            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="reading">← إلغاء الاختبار</button>
                <div class="reading-card" style="margin-top:10px;">
                    <div style="display:flex; justify-content:center; align-items:center; gap:15px; margin-bottom:20px;">
                        <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}" style="margin:0; padding:10px;">🔊</button>
                    </div>
                    <div class="options-grid">
                        ${opts.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o}" data-correct="${q.arabic}">${o}</button>`).join('')}
                    </div>
                </div></main>`;
        }
    }
}
window.onload = () => { window.appInstance = new App(); };
