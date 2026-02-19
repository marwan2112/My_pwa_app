class App {
    constructor() {
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];

        // تحميل البيانات مع فحص الأخطاء
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

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
    }

    isLessonUnlocked(lessonId, levelId) {
        if (!window.lessonsList || !window.lessonsList[levelId]) return false;
        const levelLessons = window.lessonsList[levelId];
        if (levelLessons.length > 0 && String(levelLessons[0].id) === String(lessonId)) return true;
        return this.unlockedLessons.includes(String(lessonId));
    }

    // --- نظام الاختبار ---
    prepareQuiz(terms) {
        const shuffled = [...terms].sort(() => 0.5 - Math.random());
        const limit = this.isUnlockTest ? Math.max(1, Math.floor(terms.length / 2)) : terms.length;
        this.quizQuestions = shuffled.slice(0, limit);
        this.quizIndex = 0;
        this.quizScore = 0;
    }

    handleAnswer(btn, selected, correct) {
        const btns = document.querySelectorAll('.quiz-opt-btn');
        btns.forEach(b => {
            b.style.pointerEvents = 'none';
            const optionText = b.dataset.param;
            if (optionText === correct) {
                b.style.background = "#22c55e"; 
                b.style.color = "white";
            } else if (optionText === selected) {
                b.style.background = "#ef4444";
                b.style.color = "white";
            }
        });

        if (selected === correct) this.quizScore++;

        // انتظار 1.5 ثانية ليشاهد الطالب النتيجة
        setTimeout(() => {
            this.quizIndex++;
            this.render();
        }, 1500);
    }

    // --- ميزات الكلمات ---
    toggleMastered(id) {
        if (this.masteredWords.includes(id)) {
            this.masteredWords = this.masteredWords.filter(i => i !== id);
        } else {
            this.masteredWords.push(id);
        }
        this.saveData();
        this.render();
    }

    deleteWord(id) {
        if (confirm('سيتم حذف هذه الكلمة نهائياً من الذاكرة، هل أنت متأكد؟')) {
            this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(id));
            this.masteredWords = this.masteredWords.filter(mid => String(mid) !== String(id));
            this.saveData();
            this.render();
        }
    }

    async fetchTranslation() {
        const eng = document.getElementById('newEng')?.value.trim();
        const arbInput = document.getElementById('newArb');
        if (!eng || !arbInput) return;
        arbInput.placeholder = "جاري جلب اقتراح...";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(eng)}&langpair=en|ar`);
            const data = await res.json();
            if (data.responseData.translatedText) {
                arbInput.value = data.responseData.translatedText;
            }
        } catch (e) { arbInput.placeholder = "اكتب الترجمة يدوياً"; }
    }

    async scanImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        const status = document.getElementById('ocr-status');
        status.innerText = "⏳ جاري استخراج النص...";
        try {
            const result = await Tesseract.recognize(file, 'eng');
            document.getElementById('custom-text-input').value = result.data.text;
            status.innerText = "✅ اكتمل!";
        } catch (e) { status.innerText = "❌ فشل المسح"; }
    }

    // --- الأحداث ---
    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'goHome') { this.currentPage = 'home'; this.selectedLessonId = null; }
            else if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
            else if (action === 'selLesson') {
                if (this.isLessonUnlocked(param, this.selectedLevel)) {
                    this.selectedLessonId = param; this.currentPage = 'reading'; this.currentCardIndex = 0;
                } else {
                    if (confirm('اختبار فتح المستوى: يجب أن تجيب على 70% من كلمات الدرس السابق. هل تبدأ؟')) {
                        this.isUnlockTest = true;
                        this.tempLessonToUnlock = param;
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
            else if (action === 'ansQ') this.handleAnswer(btn, param, correct);
            else if (action === 'speak') window.speechSynthesis.speak(new SpeechSynthesisUtterance(param));
            else if (action === 'masterWord') this.toggleMastered(param);
            else if (action === 'deleteWord') this.deleteWord(param);
            else if (action === 'nextC') { if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; }
            else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
            else if (action === 'resetMastered') { this.masteredWords = this.masteredWords.filter(id => !param.includes(id)); this.saveData(); this.currentCardIndex = 0; }
            else if (action === 'addNewWord') {
                const eng = document.getElementById('newEng').value;
                const arb = document.getElementById('newArb').value;
                if(eng && arb) {
                    this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                    this.saveData();
                }
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

    // --- العرض ---
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
                    <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                    <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeCount})</button>
                    <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
                </nav>` : ''}
            </div>
        </header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:90%; margin:10px auto; display:block;">📸 إضافة نص / كاميرا</button>
                <div class="features-grid">${(window.levels || []).map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div>
            </main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <p id="ocr-status" style="text-align:center; font-size:0.9rem; color:#4f46e5;"></p>
                    <input type="file" id="imageInput" accept="image/*" style="display:none;" onchange="appInstance.scanImage(event)">
                    <button class="hero-btn" onclick="document.getElementById('imageInput').click()" style="background:#8b5cf6; width:100%;">📸 مسح صورة بالكاميرا</button>
                    <textarea id="custom-text-input" placeholder="أو الصق النص هنا..." style="width:100%; height:150px; margin:10px 0; border-radius:8px; padding:10px;"></textarea>
                    <button class="hero-btn" onclick="const t = document.getElementById('custom-text-input').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="background:#16a34a; width:100%;">حفظ كدرس</button>
                </div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="features-grid" style="margin-top:15px;">
                    ${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${this.isLessonUnlocked(l.id, this.selectedLevel)?'':'opacity:0.5;'}"><h3>${l.title}</h3>${this.isLessonUnlocked(l.id, this.selectedLevel)?'':'🔒'}</div>`).join('')}
                </div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
                <div class="reading-card" style="flex:1; overflow-y:auto; text-align:left; font-size:1.1rem; line-height:1.7;">${lesson?.content}</div>
                <div style="background:#f0fdf4; padding:10px; border-radius:12px; margin-top:10px; border:2px solid #bbf7d0;">
                    <input type="text" id="newEng" placeholder="الكلمة (English)" style="width:100%; padding:8px; margin-bottom:5px;">
                    <input type="text" id="newArb" placeholder="المعنى (عربي)" style="width:100%; padding:8px; margin-bottom:5px;">
                    <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">+ إضافة للقائمة</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id));
            if (!active.length) {
                const lessonIds = allTerms.map(t => t.id).join(',');
                return `<main class="main-content" style="text-align:center;"><h2>🎉 اكتملت جميع الكلمات!</h2><p>هل تريد مراجعة الكلمات التي حفظتها مرة أخرى؟</p><button class="hero-btn" data-action="resetMastered" data-param="${lessonIds}">إعادة مراجعة الكل</button></main>`;
            }
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
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; margin:0;">🗑️ حذف نهائي</button>
                </div>
                <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${active.length}</span><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const score = (this.quizScore / this.quizQuestions.length) * 100;
                if (this.isUnlockTest) {
                    if (score >= 70) return `<main class="main-content" style="text-align:center"><h2>نجحت! 🥳 (${score.toFixed(0)}%)</h2><button class="hero-btn" onclick="appInstance.unlockedLessons.push('${this.tempLessonToUnlock}'); appInstance.saveData(); appInstance.isUnlockTest=false; appInstance.selectedLessonId='${this.tempLessonToUnlock}'; appInstance.currentPage='reading'; appInstance.render();">دخول الدرس</button></main>`;
                    return `<main class="main-content" style="text-align:center"><h2>حاول مرة أخرى 😕 (${score.toFixed(0)}%)</h2><button class="hero-btn" data-action="goHome">رجوع</button></main>`;
                }
                return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore}/${this.quizQuestions.length}</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع للدرس</button></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            let options = [q, ...allTerms.filter(t=>t.id!==q.id).sort(()=>0.5-Math.random()).slice(0,3)].sort(()=>0.5-Math.random());
            if(options.length < 4) options = [q, ...allTerms.sort(()=>0.5-Math.random()).slice(0,3)].sort(()=>0.5-Math.random());

            return `<main class="main-content">
                <div class="reading-card">
                    <div style="display:flex; justify-content:center; align-items:center; gap:15px;">
                        <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}" style="margin:0; padding:10px;">🔊</button>
                    </div>
                    <div class="options-grid" style="margin-top:20px;">
                        ${options.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}
                    </div>
                </div></main>`;
        }
    }
}

// التشغيل المتوافق مع جميع المتصفحات
window.onload = () => { window.appInstance = new App(); };
