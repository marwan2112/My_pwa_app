class App {
    constructor() {
        this.placementStep = 0;
        this.currentDifficulty = 'A2';
        this.placementHistory = [];
        this.placementScore = 0;
        this.theme = localStorage.getItem('theme') || 'light';

        // تعريف الإحصائيات (XP والنقاط) والسجل
        this.userStats = JSON.parse(localStorage.getItem('userStats')) || { xp: 0, level: 1, badges: [] };
        this.placementResults = JSON.parse(localStorage.getItem('placementResults')) || [];

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // دالة التحديث (تأكد أنها خارج الـ constructor)
    updateProgress(points) {
        this.userStats.xp += points;
        this.userStats.level = Math.floor(this.userStats.xp / 100) + 1;
        const totalMastered = this.masteredWords ? this.masteredWords.length : 0;
        if (totalMastered >= 10 && !this.userStats.badges.includes('🥉')) this.userStats.badges.push('🥉');
        if (totalMastered >= 50 && !this.userStats.badges.includes('🥈')) this.userStats.badges.push('🥈');
        if (totalMastered >= 100 && !this.userStats.badges.includes('🥇')) this.userStats.badges.push('🥇');
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    
    init() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        if (!window.levels || !window.lessonsData || !window.placementBank) {
            setTimeout(() => this.init(), 500);
            return;
        }

        // استعادة البيانات
        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        Object.assign(window.lessonsData, this.customLessons);

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
        this.isUnlockTest = false; 
        this.tempLessonToUnlock = null;
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.setupGlobalEvents();
        this.render();
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
        if (!text) return;
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
    }

    async translateAuto(text, targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;
        if (!text.trim()) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = "";
            else el.innerText = "";
            return;
        }
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
            const data = await res.json();
            const translatedText = data.responseData.translatedText;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = translatedText;
            else el.innerText = translatedText;
        } catch (e) {}
    }

    playTone(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(type === 'correct' ? 800 : 300, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
    }

    getAdaptiveQuestion() {
        const levelQuestions = window.placementBank[this.currentDifficulty];
        const available = levelQuestions.filter(q => !this.placementHistory.includes(q.q));
        const list = available.length > 0 ? available : levelQuestions;
        const selected = list[Math.floor(Math.random() * list.length)];
        this.placementHistory.push(selected.q);
        return selected;
    }

            handlePlacement(selected, correct) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        
        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());
        
        if (isCorrect) {
            this.playTone('correct');
            this.placementScore++;
        } else {
            this.playTone('error');
        }

        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let idx = levels.indexOf(this.currentDifficulty);

        // منطق ترفيع أو تنزيل المستوى بناءً على الإجابة
        if (isCorrect && idx < levels.length - 1) {
            this.currentDifficulty = levels[idx + 1];
        } else if (!isCorrect && idx > 0) {
            this.currentDifficulty = levels[idx - 1];
        }

        this.placementStep++;

        // حفظ النتيجة النهائية بالتاريخ عند الوصول للسؤال رقم 25
        if (this.placementStep >= 25) {
            const res = {
                level: this.currentDifficulty,
                date: new Date().toLocaleString('ar-EG'),
                score: this.placementScore,
                ielts: this.getIeltsEquivalent(this.currentDifficulty)
            };
            this.placementResults.unshift(res);
            localStorage.setItem('placementResults', JSON.stringify(this.placementResults));
        }

        setTimeout(() => { 
            this.isWaiting = false; 
            this.render(); 
        }, 600);
    }

    resetPlacement() {
        this.placementStep = 0;
        this.placementScore = 0;
        this.currentDifficulty = 'A2';
        this.placementHistory = [];
        this.render();
    }

    getIeltsEquivalent(level) {
        const map = { 'A1': '2.0-3.0', 'A2': '3.0-4.0', 'B1': '4.0-5.0', 'B2': '5.5-6.5', 'C1': '7.0-8.0', 'C2': '8.5-9.0' };
        return map[level];
    }

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        const addedByUser = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const fullPool = [...terms, ...addedByUser].filter(t => !this.hiddenFromCards.includes(String(t.id)));
        
        if (this.isUnlockTest) {
            this.quizQuestions = fullPool.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(fullPool.length/2)));
        } else {
            this.quizQuestions = fullPool;
        }
        this.quizIndex = 0; 
        this.quizScore = 0;
        this.generateOptions();
    }

    generateOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        const currentQ = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allArb = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        let wrongs = [...new Set(allArb.filter(a => a !== currentQ.arabic))].sort(() => 0.5 - Math.random()).slice(0, 3);
        while(wrongs.length < 3) wrongs.push("خيار " + (wrongs.length + 1));
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());
        if (isCorrect) { 
            this.quizScore++; 
            this.playTone('correct'); 
            btnElement.classList.add('correct-flash');
        } else { 
            this.playTone('error'); 
            btnElement.classList.add('wrong-flash');
        }
        setTimeout(() => { 
            this.quizIndex++; 
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions(); 
            this.isWaiting = false; 
            this.render(); 
        }, 1100);
    }

        setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }

            switch(action) {
                    case 'masterWord':
    if (!this.masteredWords.includes(String(param))) {
        this.masteredWords.push(String(param));
        this.updateProgress(10); // زيادة 10 نقاط عند حفظ كل كلمة
        this.saveData();
    }
    break;

                case 'goHome': 
                    this.currentPage = 'home'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false;
                    break;
                case 'logout': 
                    if(confirm('سيتم حذف التقدم، متأكد؟')){ localStorage.clear(); location.reload(); } 
                    break;
                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;
                    case 'toggleTheme':
    this.toggleTheme();
    break;

                case 'selLesson':
                    this.scrollPos = window.scrollY;
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isUnlocked = this.unlockedLessons.includes(String(param)) || (list[0] && list[0].id == param) || this.selectedLevel === 'custom_list';
                    if (isUnlocked) { 
                        this.selectedLessonId = param; 
                        this.currentPage = 'reading'; 
                        this.isUnlockTest = false;
                    } else {
                        const curIdx = list.findIndex(l => l.id == param);
                        const prevId = list[curIdx - 1].id;
                        this.tempLessonToUnlock = param; 
                        this.selectedLessonId = prevId;
                        this.prepareQuiz(window.lessonsData[prevId].terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    this.currentPage = param;
                    if (param === 'quiz' && this.selectedLessonId) this.prepareQuiz(window.lessonsData[this.selectedLessonId].terms, false);
                    this.currentCardIndex = 0; 
                    break;
                case 'masterWord': 
                    const cardM = document.querySelector('.flashcard-container');
                    if(cardM) {
                        cardM.classList.add('master-anim');
                        setTimeout(() => {
                            if(!this.masteredWords.includes(String(param))) this.masteredWords.push(String(param)); 
                            this.saveData(); this.render();
                        }, 550);
                    }
                    return; 
                case 'deleteWord': 
                    if(confirm('حذف نهائي من البطاقات؟')) { 
                        const cardD = document.querySelector('.flashcard-container');
                        if(cardD) {
                            cardD.classList.add('delete-anim');
                            setTimeout(() => {
                                this.hiddenFromCards.push(String(param)); 
                                this.saveData(); this.render(); 
                            }, 550);
                        }
                    } 
                    return;
                case 'speak': 
                    this.speak(param); 
                    break;
                case 'nextC': 
                    const cardNext = document.querySelector('.flashcard-container');
                    if(cardNext) {
                        cardNext.classList.add('slide-next');
                        setTimeout(() => {
                            if (this.currentCardIndex < (parseInt(total) - 1)) this.currentCardIndex++; 
                            this.render();
                        }, 400);
                    }
                    return;
                case 'prevC': 
                    const cardPrev = document.querySelector('.flashcard-container');
                    if(cardPrev) {
                        cardPrev.classList.add('slide-prev');
                        setTimeout(() => {
                            if (this.currentCardIndex > 0) this.currentCardIndex--; 
                            this.render();
                        }, 400);
                    }
                    return;
                case 'restartCards': 
                    const cardShuffle = document.querySelector('.flashcard-container');
                    if(cardShuffle) cardShuffle.classList.add('shuffle-anim-card');
                    setTimeout(() => {
                        if(param === 'all') {
                            const lessonWords = window.lessonsData[this.selectedLessonId].terms.map(t => String(t.id));
                            this.masteredWords = this.masteredWords.filter(id => !lessonWords.includes(id));
                        }
                        this.currentCardIndex = 0;
                        this.saveData(); this.render();
                    }, 600);
                    return;
                case 'addNewWord':
                    this.handleNewWord();
                    break;
                case 'backToLessons': 
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false;
                    this.render(); 
                    setTimeout(() => window.scrollTo(0, this.scrollPos), 50);
                    return;
                case 'doAuth': 
                    this.handleAuth(); 
                    return;
                // --- هذه الإضافة الجديدة لحل مشكلة اختبار المستوى ---
                case 'doPlacement':
                    this.handlePlacement(param, correct);
                    return;
            }
            this.render();
        });
    }

    handleAuth() {
        const n = document.getElementById('authName').value;
        const e = document.getElementById('authEmail').value;
        const p = document.getElementById('authPass').value;
        if (n && e && p) {
            this.userData = { name:n, email:e, pass:p };
            this.saveData(); this.currentPage = 'home'; this.render();
        }
    }

    handleNewWord() {
        const eng = document.getElementById('newEng').value.trim();
        const arb = document.getElementById('newArb').value.trim();
        if(eng && arb) {
            this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
            this.saveData();
            document.getElementById('newEng').value = '';
            document.getElementById('newArb').value = '';
            this.render();
        }
    }

    async processOCR(input) {
        const file = input.files[0];
        if (!file) return;
        const textArea = document.getElementById('ocrText');
        textArea.value = "⏳ جاري استخراج النص... انتظر قليلاً";
        try {
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            textArea.value = ret.data.text;
            await worker.terminate();
        } catch (e) {
            textArea.value = "❌ خطأ في المعالجة، حاول مرة أخرى";
        }
    }

    saveNewCustomLesson() {
        const titleInput = document.getElementById('newLessonTitle');
        const contentInput = document.getElementById('ocrText');
        const title = titleInput.value.trim() || "نص مخصص " + new Date().toLocaleDateString();
        const content = contentInput.value.trim();
        if (content) {
            const id = 'c' + Date.now();
            const newL = { id, title, content, terms: [] };
            this.customLessons[id] = newL;
            window.lessonsData[id] = newL;
            this.saveData();
            titleInput.value = ''; contentInput.value = '';
            this.currentPage = 'custom_lessons_view';
            this.render();
        }
    }

    deleteCustomLesson(id) {
        if (confirm('حذف النص نهائياً؟')) {
            delete this.customLessons[id];
            delete window.lessonsData[id];
            this.userVocabulary = this.userVocabulary.filter(v => v.lessonId !== String(id));
            this.saveData(); this.render();
        }
    }

    editLessonTitle(id) {
        const newTitle = prompt("العنوان الجديد:", this.customLessons[id].title);
        if (newTitle && newTitle.trim()) {
            this.customLessons[id].title = newTitle.trim();
            if(window.lessonsData[id]) window.lessonsData[id].title = newTitle.trim();
            this.saveData(); this.render();
        }
    }

    editLessonContent(id) {
        const newC = prompt("تعديل نص الموضوع:", this.customLessons[id].content);
        if (newC && newC.trim()) {
            this.customLessons[id].content = newC.trim();
            if(window.lessonsData[id]) window.lessonsData[id].content = newC.trim();
            this.saveData(); this.render();
        }
    }


    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        
        app.innerHTML = this.getHeader() + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
        
        if(this.currentPage === 'flashcards' && allTerms.length > 0) {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if(active[this.currentCardIndex]) {
                this.translateAuto(active[this.currentCardIndex].english, 'auto-trans-text');
            }
        }
    }

        getHeader() {
        if (this.currentPage === 'auth') return '';
        let nav = '';
        if (this.selectedLessonId && ['reading', 'flashcards', 'quiz'].includes(this.currentPage) && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage === 'reading' ? 'active' : ''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage === 'flashcards' ? 'active' : ''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage === 'quiz' ? 'active' : ''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
            </nav>`;
        }
        return `<header class="header">
    <div class="header-content">
        <div style="display:flex; align-items:center; gap:12px;">
            <h2 data-action="goHome" style="cursor:pointer">🏠</h2>
            <button data-action="toggleTheme" style="background:none; border:none; font-size:1.3rem; cursor:pointer; padding:5px;">
                ${this.theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
        ${nav}
    </div>
</header>`;
    }



    getView(lesson, allTerms) {
        if (this.currentPage === 'auth') {
            return `<main class="main-content"><div class="reading-card auth-card">
                <h2>🚀 Welcome to Booster</h2>
                <input id="authName" placeholder="الاسم الكامل" class="auth-input">
                <input id="authEmail" placeholder="البريد الإلكتروني" class="auth-input">
                <input type="password" id="authPass" placeholder="كلمة المرور" class="auth-input">
                <button class="hero-btn" data-action="doAuth" style="width:100%;">ابدأ الآن ✨</button>
            </div></main>`;
        }

                if (this.currentPage === 'home') {
            const progressLevel = this.userStats.xp % 100;

            return `<main class="main-content">
                <div class="reading-card welcome-banner" style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border: none; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0;">مرحباً، ${this.userData.name} 👋</h3>
                        <div style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">
                            ⭐ مستوى ${this.userStats.level}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                            <span>التقدم للمستوى التالي</span>
                            <span>${progressLevel}%</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="width: ${progressLevel}%; height: 100%; background: #10b981; box-shadow: 0 0 10px #10b981; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                        </div>
                    </div>

                    <div style="margin-top: 15px; display: flex; gap: 12px; font-size: 1.6rem; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 12px;">
                        ${this.userStats.badges.length > 0 ? this.userStats.badges.join(' ') : '<span style="font-size:0.8rem; opacity:0.8;">اجمع 10 كلمات للحصول على وسامك الأول! 🏅</span>'}
                    </div>
                </div>

                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-top:15px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">📸 إضافة من الكاميرا أو الهاتف</button>
                <button class="hero-btn" data-action="setPage" data-param="placement_test" style="width:100%; background:#ec4899; margin:15px 0; box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.3);">🧠 اختبار مستوى </button>
                
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:1px solid #f97316;"><h3>📂 نصوصي</h3></div>` : ''}
                </div>
                
                <button data-action="logout" class="logout-btn" style="margin-top: 20px;">تسجيل الخروج</button>
            </main>`;
        }

        if (this.currentPage === 'placement_test') {
            if (this.placementStep >= 25) {
                return `<div class="reading-card result-card">
                    <h2 style="text-align:center;">🏁 نتيجة الاختبار</h2>
                    <div style="background:#f0f7ff; padding:15px; border-radius:10px; margin:10px 0; text-align:center;">
                        <h3>المستوى: ${this.currentDifficulty}</h3>
                        <p>IELTS: ${this.getIeltsEquivalent(this.currentDifficulty)}</p>
                    </div>
                    <h4 style="margin-top:15px;">📜 السجل السابق:</h4>
                    <div style="max-height:100px; overflow-y:auto; font-size:0.8rem; margin-bottom:15px;">
                        ${this.placementResults.map(r => `<div style="border-bottom:1px solid #eee; padding:5px;">📅 ${r.date} - المستوى: ${r.level}</div>`).join('')}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="hero-btn" onclick="appInstance.resetPlacement()" style="background:#ec4899; flex:1;">إعادة الاختبار 🔄</button>
                        <button class="hero-btn" data-action="goHome" style="background:#64748b; flex:1;">تم</button>
                    </div>
                </div>`;
            }
            
            const q = this.getAdaptiveQuestion();
            // جلب الخيارات سواء كانت في مصفوفة options أو أحرف a,b,c,d
            const rawOpts = q.options ? q.options : [q.a, q.b, q.c, q.d];
            const opts = rawOpts.filter(o => o !== undefined).sort(() => 0.5 - Math.random());

            return `<div class="reading-card">
                <div style="display:flex; justify-content:center; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#64748b;">سؤال: ${this.placementStep + 1} / 25</span>
                </div>
                <h2 style="margin-bottom:20px; direction:ltr; text-align:left;">${q.q}</h2>
                <div class="quiz-options">
                    ${opts.map(opt => `<button class="quiz-opt-btn" data-action="doPlacement" data-param="${opt}" data-correct="${q.a || q.answer}">${opt}</button>`).join('')}
                </div>
            </div>`;
        }

        
const q = this.getAdaptiveQuestion();

const rawOpts = q.options ? q.options : [q.a, q.b, q.c, q.d];
const opts = rawOpts.filter(o => o !== undefined).sort(() => 0.5 - Math.random());


        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← رجوع</button>
                <div class="features-grid">
                    ${list.map(l => { 
                        const isOk = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id))); 
                        return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isOk?'':'opacity:0.6;'}"><h3>${isOk?'':'🔒 '}${l.title}</h3></div>`; 
                    }).join('')}
                </div></main>`;
        }

        if (this.currentPage === 'custom_lessons_view') {
            const lessons = Object.values(this.customLessons);
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← العودة للرئيسية</button>
                <h2 style="margin-bottom: 20px; text-align:center;">📂 نصوصي الخاصة</h2>
                ${lessons.length === 0 ? '<div class="reading-card" style="text-align:center; padding:30px; color:#666;">لا توجد نصوص محفوظة. صوّر نصك الأول الآن!</div>' : ''}
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${lessons.map(l => `
                        <div class="reading-card" style="border-right: 5px solid #6366f1; text-align: right; direction: rtl;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin:0; color:#4f46e5; cursor:pointer;" data-action="selLesson" data-param="${l.id}">${l.title}</h3>
                                <div style="display: flex; gap: 15px;">
                                    <button onclick="appInstance.editLessonTitle('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                                    <button onclick="appInstance.editLessonContent('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">📝</button>
                                    <button onclick="appInstance.deleteCustomLesson('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
                                </div>
                            </div>
                            <p style="font-size: 0.9rem; color: #555; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; direction: ltr; text-align: left;">
                                ${l.content}
                            </p>
                            <button class="hero-btn" data-action="selLesson" data-param="${l.id}" style="width:100%; padding: 12px; font-size: 1rem; background: #6366f1;">📖 فتح النص للدراسة</button>
                        </div>
                    `).join('')}
                </div>
            </main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b;">⬅ تراجع</button>
                <div class="reading-card">
                    <h2>${lesson.title}</h2>
                    <div class="scrollable-text" style="direction:ltr; text-align:left; margin-top:10px;">${lesson.content}</div>
                </div>
                <div class="reading-card" style="margin-top:20px; border:1px dashed #6366f1; background:#f0f7ff;">
                    <h4 style="margin-bottom:10px;">إضافة كلمة جديدة:</h4>
                    <input id="newEng" placeholder="اكتب بالإنجليزية هنا..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;" oninput="appInstance.translateAuto(this.value, 'newArb')"> 
                    <input id="newArb" placeholder="الترجمة تظهر هنا..." style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd; background:#fff;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#10b981;">إضافة للقائمة ✅</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<div class="reading-card" style="text-align:center;">
                    <div style="font-size:3rem; margin-bottom:10px;">🧠</div>
                    <h3>🎉 اكتملت المراجعة!</h3>
                    <button class="hero-btn" data-action="restartCards" data-param="all" style="background:#f59e0b;">إعادة تكرار الكل 🔁</button>
                </div>`;
            }
            const t = active[this.currentCardIndex];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <h1>${t.english}</h1>
                        </div>
                        <div class="flashcard-back"><h1 id="auto-trans-text">${t.arabic}</h1></div>
                    </div>
                </div>
                <div class="card-controls-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="background:#6366f1;">🔊 نطق</button>
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#10b981;">✅ حفظ</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#ef4444;">🗑️ حذف</button>
                </div>
                <button class="hero-btn" data-action="restartCards" data-param="remaining" style="width:100%; margin: 15px 0; background:#f59e0b;">🔁 تكرار المتبقي</button>
                <div class="card-nav-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="hero-btn" data-action="prevC" style="background:#64748b;">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}" style="background:#64748b;">التالي</button>
                </div>
                <div style="text-align:center; margin-top:10px; color:#666;">${this.currentCardIndex + 1} / ${active.length}</div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const pass = (this.quizScore/this.quizQuestions.length) >= 0.75;
                if (this.isUnlockTest && pass) this.unlockedLessons.push(String(this.tempLessonToUnlock));
                this.saveData();
                return `<div class="reading-card finish-box">
                    <h2>${pass ? "نجحت! 🎉" : "حاول مجدداً"}</h2>
                    <button class="hero-btn" data-action="backToLessons">متابعة</button>
                </div>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<div class="reading-card quiz-box">
                <div class="quiz-info">السؤال ${this.quizIndex+1}/${this.quizQuestions.length}</div>
                <h2>${q.english}</h2>
                <button class="quiz-speak-btn" data-action="speak" data-param="${q.english}">🔊</button>
                <div class="quiz-options">
                    ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content" style="height: 90vh; display: flex; flex-direction: column; gap: 10px;">
                <button class="hero-btn" data-action="goHome" style="background:#64748b; flex-shrink: 0;">← رجوع للرئيسية</button>
                <div class="reading-card" style="flex-grow: 1; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
                    <h3 style="flex-shrink: 0;">📸 إضافة نص ذكي</h3>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #6366f1; flex-shrink: 0;">
                        <input type="file" id="fileInput" accept="image/*" onchange="appInstance.processOCR(this)" style="width: 100%;">
                    </div>
                    <input id="newLessonTitle" placeholder="عنوان النص" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; flex-shrink: 0;">
                    <textarea id="ocrText" placeholder="النص سيظهر هنا..." style="width: 100%; flex-grow: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; line-height: 1.5; resize: none;"></textarea>
                    <button class="hero-btn" onclick="appInstance.saveNewCustomLesson()" style="width: 100%; background:#10b981; padding: 15px; font-size: 1.1rem; flex-shrink: 0;">💾 حفظ النص</button>
                </div>
            </main>`;
        } 
                return `<div style="text-align:center; padding:50px;">جاري التحميل...</div>`;
    }

     toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.render();
    }

    resetPlacement() { 
        this.placementStep = 0;
        this.placementScore = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.render();
    }
} // القوس يغلق الكلاس هنا بعد دالة ريسيت

const appInstance = new App();

