/**
 * BOOSTER APP - PRO VERSION (Marwan Edition)
 * التحديث: إضافة نظام حساب المستخدم، تتبع التقدم، الرتبة، ومنع تكرار الكلمات مع ثبات النص.
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

        // تحميل بيانات المستخدم أو إنشاء حساب جديد
        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.currentPage = this.userData ? 'home' : 'auth';
        
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;
        this.scrollPos = 0;

        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        Object.assign(window.lessonsData, this.customLessons);

        this.isUnlockTest = false;
        this.tempLessonToUnlock = null;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.setupGlobalEvents();
        this.render();
    }

    // وظيفة تسجيل الدخول
    handleAuth() {
        const name = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;

        if (name && email && pass) {
            this.userData = { name, email, level: 'Beginner', points: 0 };
            localStorage.setItem('userAccount', JSON.stringify(this.userData));
            this.currentPage = 'home';
            this.render();
        } else {
            alert("الرجاء تعبئة كافة الحقول");
        }
    }

    // حساب الرتبة بناءً على الكلمات المحفوظة
    getUserRank() {
        const count = this.masteredWords.length;
        if (count > 100) return "🔥 Expert";
        if (count > 50) return "🌟 Intermediate";
        return "🌱 Beginner";
    }

    playTone(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        if (type === 'correct') {
            osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
        }
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        if (this.userData) localStorage.setItem('userAccount', JSON.stringify(this.userData));
    }

    speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9;
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
        if (this.isUnlockTest) {
            const originalTerms = [...terms];
            const addedByUser = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId && !this.hiddenFromCards.includes(String(v.id)));
            const fullPool = [...originalTerms, ...addedByUser];
            const halfCount = Math.floor(fullPool.length / 2);
            this.quizQuestions = fullPool.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, halfCount));
        } else {
            this.quizQuestions = terms.filter(t => !this.hiddenFromCards.includes(String(t.id)));
        }
        this.quizIndex = 0; this.quizScore = 0; this.isWaiting = false;
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
        if (isCorrect) { this.quizScore++; this.playTone('correct'); } else { this.playTone('error'); }
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
            if (action === 'doAuth') { this.handleAuth(); return; }

            switch(action) {
                case 'goHome': this.currentPage = 'home'; this.selectedLessonId = null; break;
                case 'logout': if(confirm('تسجيل خروج؟')){ localStorage.removeItem('userAccount'); location.reload(); } break;
                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isUnlocked = this.unlockedLessons.includes(String(param)) || (list[0] && list[0].id == param) || this.selectedLevel === 'custom_list';
                    if (isUnlocked) {
                        this.selectedLessonId = param; this.currentPage = 'reading'; this.isUnlockTest = false;
                    } else {
                        const currentIdx = list.findIndex(l => l.id == param);
                        const prevLessonId = list[currentIdx - 1].id;
                        this.tempLessonToUnlock = param; this.selectedLessonId = prevLessonId;
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
                    this.currentPage = param; this.currentCardIndex = 0; 
                    break;
                case 'masterWord':
                    if(!this.masteredWords.includes(param)) this.masteredWords.push(param); 
                    this.saveData(); break;
                case 'deleteWord':
                    if(confirm('حذف نهائي؟')) { this.hiddenFromCards.push(String(param)); this.saveData(); } break;
                case 'speak': this.speak(param); break;
                case 'nextC': if (this.currentCardIndex < (parseInt(total) - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'repeatList': this.currentCardIndex = 0; break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value.trim();
                    const arb = document.getElementById('newArb').value.trim();
                    if(eng && arb) {
                        const scrollBox = document.getElementById('textScrollBox');
                        if(scrollBox) this.scrollPos = scrollBox.scrollTop;
                        const lesson = window.lessonsData[this.selectedLessonId];
                        const exists = [...lesson.terms, ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)]
                                      .some(w => w.english.toLowerCase() === eng.toLowerCase());
                        if(exists) { alert("⚠️ هذه الكلمة موجودة بالفعل!"); } else {
                            this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                            this.saveData();
                        }
                    } 
                    break;
                case 'backToLessons':
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons';
                    this.selectedLessonId = null; this.isUnlockTest = false;
                    break;
            }
            this.render();
            if(action === 'addNewWord') {
                const scrollBox = document.getElementById('textScrollBox');
                if(scrollBox) scrollBox.scrollTop = this.scrollPos;
            }
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
        if (this.currentPage === 'auth') return '';
        let nav = '';
        const list = window.lessonsList[this.selectedLevel] || [];
        const isUnlocked = this.selectedLessonId && (this.unlockedLessons.includes(String(this.selectedLessonId)) || (list[0] && list[0].id == this.selectedLessonId) || this.selectedLevel === 'custom_list');

        if (isUnlocked && !this.isUnlockTest && !['home', 'lessons', 'custom_lessons_view', 'addLesson'].includes(this.currentPage)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">🏠 Home</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'auth') {
            return `<main class="main-content">
                <div class="reading-card" style="text-align:center;">
                    <h2>🚀 مرحباً بك في Booster App</h2>
                    <p style="margin-bottom:20px; color:#6b7280;">أنشئ حسابك لحفظ تقدمك</p>
                    <input id="authName" placeholder="الاسم الكامل" style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd;">
                    <input id="authEmail" type="email" placeholder="البريد الإلكتروني" style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd;">
                    <input id="authPass" type="password" placeholder="كلمة السر" style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd;">
                    <button class="hero-btn" data-action="doAuth" style="width:100%; background:#6366f1; margin-top:10px;">بدء الرحلة ✨</button>
                </div></main>`;
        }

        if (this.currentPage === 'home') {
            const progress = ((this.unlockedLessons.length / 50) * 100).toFixed(0); // افتراضاً 50 درس
            return `<main class="main-content">
                <div class="reading-card" style="background: linear-gradient(135deg, #6366f1, #a855f7); color:white; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3>مرحباً، ${this.userData.name} 👋</h3>
                            <p>رتبتك: ${this.getUserRank()}</p>
                        </div>
                        <button data-action="logout" style="background:rgba(255,255,255,0.2); border:none; padding:5px 10px; border-radius:5px; color:white; font-size:0.8rem;">خروج</button>
                    </div>
                    <div style="margin-top:15px;">
                        <small>إنجازك العام: ${progress}%</small>
                        <div style="width:100%; height:8px; background:rgba(255,255,255,0.3); border-radius:4px; margin-top:5px;">
                            <div style="width:${progress}%; height:100%; background:white; border-radius:4px;"></div>
                        </div>
                    </div>
                </div>
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
                        <div style="position:absolute; top:5px; left:5px; display:flex; gap:10px;">
                            <button data-action="renameLesson" data-param="${l.id}" style="background:none; border:none; font-size:1.2rem;">✏️</button>
                            <button data-action="deleteCustomLesson" data-param="${l.id}" style="background:none; border:none; font-size:1.2rem;">🗑️</button>
                        </div>
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
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b; color:white;">⬅ تراجع للدروس</button>
                <h2 style="margin-bottom:15px;">${lesson.title}</h2>
                <div id="textScrollBox" class="reading-card" style="direction:ltr; text-align:left; font-size:1.1rem; line-height:1.6; max-height:300px; overflow-y:auto; border:2px solid #e2e8f0;">
                    ${lesson.content}
                </div>
                <div class="reading-card" style="margin-top:20px; background:#f9fafb;">
                    <h4>أضف كلمة للبطاقات:</h4>
                    <input id="newEng" placeholder="English" style="width:100%; padding:10px; margin:5px 0;">
                    <input id="newArb" placeholder="العربية" style="width:100%; padding:10px; margin-bottom:10px;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#10b981;">حفظ في البطاقات</button>
                </div></main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) return `<main class="main-content" style="text-align:center;"><div class="reading-card"><h2>تم إنهاء الكلمات! 🎉</h2><button class="hero-btn" data-action="backToLessons">العودة للدروس</button></div></main>`;
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b; color:white;">⬅ تراجع للدروس</button>
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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px; gap:10px;">
                    <button class="hero-btn" data-action="prevC" style="flex:1; background:#3b82f6; color:white; font-weight:bold;">⬅ السابق</button>
                    <button class="hero-btn" data-action="repeatList" style="background:#f59e0b; color:white; padding:10px 20px;">🔁</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}" style="flex:1; background:#3b82f6; color:white; font-weight:bold;">التالي ➡</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const s = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                const pass = s >= 75;
                if (this.isUnlockTest && pass) { this.unlockedLessons.push(String(this.tempLessonToUnlock)); this.saveData(); }
                return `<main class="main-content" style="text-align:center;"><div class="reading-card">
                    <h2>${pass ? "🎉 مبروك!" : "💪 حاول ثانية"}</h2>
                    <h1 style="font-size:3rem; color:${pass?'#10b981':'#ef4444'};">${s}%</h1>
                    <button class="hero-btn" data-action="backToLessons" style="margin-top:20px; background:#3b82f6;">متابعة</button>
                </div></main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b; color:white;">⬅ خروج</button>
                <div class="reading-card" style="text-align:center;">
                    <p>سؤال ${this.quizIndex+1}/${this.quizQuestions.length}</p>
                    <h1 style="margin:30px 0;">${q.english}</h1>
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
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6;">📷 فتح الكاميرا</button>
                    <textarea id="ocrText" placeholder="النص..." style="width:100%; height:150px; margin-top:15px; padding:10px;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); const newL={id, title:'نص جديد', content:t, terms:[]};
                        appInstance.customLessons[id]=newL; window.lessonsData[id]=newL; appInstance.saveData(); 
                        appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.render(); 
                    }" style="width:100%; background:#10b981; margin-top:10px;">💾 حفظ</button>
                </div></main>`;
        }
    }
}
const appInstance = new App();
