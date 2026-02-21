/**
 * BOOSTER APP - PRO VERSION (Marwan Edition)
 * كود شامل: مصلح ومنظم مع كامل خيارات التحكم بالبطاقات والنطق
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
        this.typingTimer = null; 

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
        clearTimeout(this.typingTimer);
        const arbInput = document.getElementById('newArb');
        this.typingTimer = setTimeout(async () => {
            if (word.trim().length > 1) {
                const suggested = await this.translateWord(word);
                if (suggested && (arbInput.value.trim() === "" || arbInput.dataset.auto === "true")) {
                    arbInput.value = suggested;
                    arbInput.dataset.auto = "true";
                }
            } else { arbInput.value = ""; }
        }, 500); 
    }

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        let pool = terms.filter(t => !this.hiddenFromCards.includes(String(t.id)));
        if (this.isUnlockTest) {
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
        }
        this.quizQuestions = pool.sort(() => 0.5 - Math.random());
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
            if (btn.innerText.trim() === correct.trim()) {
                btn.classList.add('correct-flash');
            } else if (btn === btnElement && !isCorrect) {
                btn.classList.add('wrong-flash');
            }
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
                    this.selectedLessonId = param;
                    if (isUnlocked) {
                        this.currentPage = 'reading';
                    } else {
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        this.tempLessonToUnlock = param;
                        this.prepareQuiz(window.lessonsData[list[prevIdx].id].terms, true);
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
                    break;
                case 'masterWord':
                    if(!this.masteredWords.includes(param)) this.masteredWords.push(param); 
                    this.saveData(); this.render(); break;
                case 'deleteWord':
                    if(confirm('حذف البطاقة نهائياً؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); this.render(); } break;
                case 'speak': this.speak(param); break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    if(eng && arb) {
                        this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                        document.getElementById('newEng').value = '';
                        document.getElementById('newArb').value = '';
                        this.saveData(); this.render();
                    } break;
                case 'restartCards': this.currentCardIndex = 0; this.masteredWords = this.masteredWords.filter(id => !param.includes(id)); this.saveData(); this.render(); break;
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
        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        let nav = '';
        // إظهار القائمة إذا كان هناك درس مختار ولسنا في الشاشة الرئيسية
        if (this.selectedLessonId && !['home', 'lessons', 'custom_lessons_view', 'addLesson'].includes(this.currentPage)) {
            const activeCount = terms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id))).length;
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات (${activeCount})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">Booster PRO</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:linear-gradient(135deg, #8b5cf6, #6d28d9); margin-bottom:20px; font-weight:bold;">📸 إضافة نص عبر الكاميرا</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="background:#fff7ed; border:2px solid #f97316;"><h3>📂 نصوصي المحفوظة</h3></div>` : ''}
                </div></main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <div class="features-grid" style="margin-top:20px;">${list.map(l => {
                    const isUnlocked = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id)));
                    return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isUnlocked?'':'opacity:0.6; background:#f1f5f9;'}">
                        <h3>${isUnlocked?'':'🔒 '}${l.title}</h3>
                        <p style="font-size:0.8rem; color:#64748b;">${l.description || ''}</p>
                    </div>`;
                }).join('')}</div></main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← عودة للمستوى</button>
                <h2 style="margin:20px 0 10px;">${lesson.title}</h2>
                <div class="reading-card" style="direction:ltr; text-align:left; line-height:1.8; font-size:1.1rem; border-left:5px solid #3b82f6;">${lesson.content}</div>
                <div class="reading-card" style="margin-top:20px; background:#f8fafc;">
                    <h4>➕ أضف كلمة صعبة من النص:</h4>
                    <input id="newEng" placeholder="الكلمة بالإنجليزية" style="width:100%; padding:12px; margin:10px 0; border:1px solid #cbd5e1; border-radius:8px;" oninput="appInstance.handleTypingTranslate(this.value)">
                    <input id="newArb" placeholder="المعنى بالعربي" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #cbd5e1; border-radius:8px;" oninput="this.dataset.auto='false'">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#059669;">hفظ في البطاقات</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card"><h2>ممتاز! أنهيت جميع الكلمات 🏆</h2>
                    <button class="hero-btn" data-action="restartCards" data-param="${allTerms.map(t=>t.id).join(',')}">إعادة تدريب</button></div>
                </main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h3>ENGLISH</h3><h1>${t.english}</h1><p>اضغط للترجمة</p></div>
                        <div class="flashcard-back"><h3>العربية</h3><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:20px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="background:#6366f1;">🔊 نطق</button>
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669;">✅ حفظت</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#ef4444;">🗑️ حذف</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px;">
                    <button class="nav-btn" data-action="prevC" style="background:#cbd5e1; color:#1e293b; padding:10px 25px;">السابق</button>
                    <span style="font-weight:bold; color:#64748b;">${this.currentCardIndex + 1} / ${active.length}</span>
                    <button class="nav-btn" data-action="nextC" data-total="${active.length}" style="background:#3b82f6; color:white; padding:10px 25px;">التالي</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const scorePerc = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && scorePerc >= 70) { this.unlockedLessons.push(String(this.tempLessonToUnlock)); this.saveData(); }
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card">
                        <h1>النتيجة: ${scorePerc}%</h1>
                        <p>أجبت على ${this.quizScore} من أصل ${this.quizQuestions.length}</p>
                        <button class="hero-btn" data-action="setPage" data-param="reading">العودة للدرس</button>
                    </div></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div class="reading-card" style="text-align:center;">
                    <div style="display:flex; justify-content:space-between; color:#64748b; margin-bottom:20px;">
                        <span>السؤال: ${this.quizIndex+1}/${this.quizQuestions.length}</span>
                        <span data-action="speak" data-param="${q.english}" style="cursor:pointer; font-size:1.5rem;">🔊</span>
                    </div>
                    <h1 style="font-size:2.5rem; color:#1e293b; margin-bottom:30px;">${q.english}</h1>
                    <div style="display:grid; gap:12px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div></main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>📸 استخراج نص من صورة</h3>
                    <p style="color:#64748b; font-size:0.9rem; margin-bottom:15px;">ارفع صورة للنص أو استخدم الكاميرا مباشرة</p>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6;">📷 اختيار صورة / تصوير</button>
                    <textarea id="ocrText" placeholder="النص المستخرج سيظهر هنا..." style="width:100%; height:180px; margin-top:15px; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); 
                        const newL={id, title:'نص مصور ' + new Date().toLocaleDateString(), content:t, terms:[]};
                        appInstance.customLessons[id]=newL;
                        window.lessonsData[id]=newL; 
                        appInstance.saveData(); 
                        appInstance.selectedLessonId=id;
                        appInstance.currentPage='reading';
                        appInstance.render(); 
                    }" style="width:100%; background:#059669; margin-top:10px;">💾 حفظ النص والبدء</button>
                </div></main>`;
        }
    }
}
const appInstance = new App();
