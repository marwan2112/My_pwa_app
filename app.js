class App {
    constructor() {
        // منع الشاشة البيضاء: الانتظار حتى تحميل DOM والبيانات
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // التأكد من وجود البيانات الأساسية من data.js
        if (!window.levels || !window.lessonsData) {
            console.warn("Data not found, retrying...");
            setTimeout(() => this.init(), 500);
            return;
        }

        // إعدادات الحالة (State)
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;

        // تحميل البيانات المخزنة (Persistence)
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];

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
    }

    // --- نظام الصوت (نقي ويعمل على جميع المتصفحات) ---
    playSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            
            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
                osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
            }
            
            g.gain.setValueAtTime(0.1, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch(e) { console.error("Audio API support issue"); }
    }

    // --- نظام حذف البطاقات فقط (الكلمة تبقى في الاختبار) ---
    deleteFromCardsOnly(id) {
        if (confirm('هل تريد إخفاء هذه الكلمة من "البطاقات" فقط؟ (ستبقى تظهر في الاختبارات دائماً)')) {
            this.hiddenFromCards.push(String(id));
            this.saveData();
            this.currentCardIndex = 0;
            this.render();
        }
    }

    // --- تحضير الاختبارات (فصل تام بين الأنواع) ---
    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        
        // الاختبار دائماً يستخدم الكلمات الأصلية + المضافة ولا يتأثر بالحذف من البطاقات
        let pool = [...terms]; 

        if (this.isUnlockTest) {
            // اختبار فتح الدروس (عشوائي وقصير من الدرس السابق)
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
        
        // جلب خيارات من مستودع الكلمات الكامل (الدرس الحالي + مضاف) لضمان عدم التكرار
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allOptionsPool = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        
        let wrongs = [...new Set(allOptionsPool.filter(a => a !== currentQ.arabic))];
        wrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // حشو خيارات إذا كانت الكلمات قليلة جداً
        while(wrongs.length < 3) {
            wrongs.push("خيار إضافي " + (wrongs.length + 1));
        }
        
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    // --- حل مشكلة الألوان النهائي (Force UI Update) ---
    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const isCorrect = (selected.trim() === correct.trim());
        const btns = document.querySelectorAll('.quiz-opt-btn');

        // تطبيق الألوان بقوة (In-line Style) لتجاوز أي تعليق
        btns.forEach(btn => {
            btn.style.pointerEvents = 'none'; // تعطيل الضغط
            if (btn.innerText.trim() === correct.trim()) {
                // اللون الأخضر للإجابة الصحيحة
                btn.style.setProperty('background-color', '#22c55e', 'important');
                btn.style.setProperty('color', 'white', 'important');
                btn.style.setProperty('border-color', '#16a34a', 'important');
            } else if (btn === btnElement && !isCorrect) {
                // اللون الأحمر للإجابة الخطأ التي اختارها المستخدم
                btn.style.setProperty('background-color', '#ef4444', 'important');
                btn.style.setProperty('color', 'white', 'important');
                btn.style.setProperty('border-color', '#dc2626', 'important');
            }
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        // انتظار قبل الانتقال للسؤال التالي ليرى المستخدم اللون
        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) {
                this.generateOptions();
            }
            this.isWaiting = false;
            this.render();
        }, 2000);
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            const { action, param, correct, total } = btn.dataset;

            // معالجة خاصة لزر الإجابة
            if (action === 'ansQ') {
                this.handleAnswer(param, correct, btn);
                return;
            }

            switch(action) {
                case 'goHome': this.currentPage = 'home'; break;
                case 'selLevel': this.selectedLevel = param; this.currentPage = 'lessons'; break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel];
                    const isUnlocked = (list[0].id == param) || this.unlockedLessons.includes(String(param));
                    
                    if (isUnlocked) {
                        this.selectedLessonId = param;
                        this.currentPage = 'reading';
                    } else {
                        // اختبار فتح الدروس (مستقل تماماً)
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        const prevLesson = window.lessonsData[list[prevIdx].id];
                        this.tempLessonToUnlock = param;
                        this.prepareQuiz(prevLesson.terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;
                case 'setPage':
                    if (param === 'quiz') {
                        const lesson = window.lessonsData[this.selectedLessonId];
                        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
                        this.prepareQuiz([...lesson.terms, ...added], false);
                    }
                    this.currentPage = param; break;
                case 'deleteWord': this.deleteFromCardsOnly(param); break;
                case 'masterWord': 
                    this.masteredWords.push(param); 
                    this.saveData(); 
                    this.render(); 
                    break;
                case 'speak': 
                    const msg = new SpeechSynthesisUtterance(param);
                    msg.lang = 'en-US';
                    window.speechSynthesis.speak(msg); 
                    break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    if(eng && arb) {
                        this.userVocabulary.push({ 
                            id: "u" + Date.now(), 
                            lessonId: String(this.selectedLessonId), 
                            english: eng, 
                            arabic: arb 
                        });
                        this.saveData();
                        this.render();
                    }
                    break;
            }
            this.render();
        });
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        const lesson = window.lessonsData[this.selectedLessonId];
        const addedWords = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...addedWords] : [];

        app.innerHTML = this.getHeader(allTerms) + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
    }

    getHeader(terms) {
        // العداد يحسب فقط الكلمات التي لم تُحفظ ولم تُحذف من البطاقات
        const activeForCards = terms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
        
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص القرائي</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeForCards.length})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار الشامل</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        // --- شاشة الرئيسية ---
        if (this.currentPage === 'home') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-bottom:20px;">📸 إضافة نص (كاميرا / ملف)</button>
                <div class="features-grid">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}</div>
            </main>`;
        }

        // --- شاشة قائمة الدروس ---
        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px;">← الرئيسية</button>
                <div class="features-grid">${list.map(l => {
                    const isLocked = !(list[0].id == l.id || this.unlockedLessons.includes(String(l.id)));
                    return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isLocked ? 'opacity:0.5; border:1px dashed #ccc;' : ''}">
                        <h3>${isLocked ? '🔒 ' : ''}${l.title}</h3>
                    </div>`;
                }).join('')}</div>
            </main>`;
        }

        // --- شاشة النص القرائي (تبويب داخلي) ---
        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← القائمة</button>
                <div class="reading-card" style="margin-top:15px; border-right: 4px solid #1e40af;">
                    <div style="max-height:350px; overflow-y:auto; padding-left:10px; font-size:1.1rem; line-height:1.8;">
                        ${lesson ? lesson.content : 'جاري تحميل النص...'}
                    </div>
                </div>
                <div style="background:#fff; padding:20px; border-radius:15px; margin-top:20px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <h4>➕ أضف كلمة صعبة من النص:</h4>
                    <input type="text" id="newEng" placeholder="الكلمة (English)" style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px;">
                    <input type="text" id="newArb" placeholder="المعنى (عربي)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#16a34a;">إضافة للقاموس</button>
                </div>
            </main>`;
        }

        // --- شاشة الاختبار (العداد والنتيجة والألوان) ---
        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const finalScore = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && finalScore >= 70) {
                    this.unlockedLessons.push(String(this.tempLessonToUnlock));
                    this.saveData();
                }
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card">
                        <h2 style="color:#1e40af;">النتيجة النهائية</h2>
                        <h1 style="font-size:4rem; margin:20px 0;">${finalScore}%</h1>
                        <p>لقد أجبت على ${this.quizScore} من أصل ${this.quizQuestions.length}</p>
                        <button class="hero-btn" data-action="goHome" style="margin-top:20px;">العودة للرئيسية</button>
                    </div>
                </main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading" style="background:#64748b;">✕ إنهاء</button>
                    <b style="font-size:1.2rem; color:#1e40af;">السؤال: ${this.quizIndex + 1} / ${this.quizQuestions.length}</b>
                </div>
                <div class="reading-card" style="text-align:center; padding:40px 20px;">
                    <h1 style="font-size:2.5rem; margin-bottom:10px;">${q.english}</h1>
                    <button class="hero-btn" data-action="speak" data-param="${q.english}" style="background:none; color:#1e40af; border:1px solid #1e40af; padding:5px 15px;">🔊 استماع</button>
                    <div style="margin-top:30px; display:grid; gap:12px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div>
            </main>`;
        }

        // --- شاشة البطاقات (Flashcards) ---
        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card"><h2>🎉 ممتع! أنهيت كل الكلمات.</h2><button class="hero-btn" data-action="goHome">العودة للرئيسية</button></div>
                </main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading" style="background:#64748b;">← رجوع</button>
                    <b>البطاقة ${this.currentCardIndex + 1} من ${active.length}</b>
                </div>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1><small>إضغط للقلب ↺</small></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}" style="margin-top:10px;">🔊 استماع</button></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:2;">✅ حفظتها (إخفاء)</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; flex:1;">🗑️ حذف</button>
                </div>
                <div style="margin-top:20px; display:flex; justify-content:center; gap:20px;">
                    <button class="hero-btn" data-action="prevC" style="background:#1e40af;">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}" style="background:#1e40af;">التالي</button>
                </div>
            </main>`;
        }

        // --- شاشة إضافة نص كاميرا ---
        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>استيراد نص جديد</h3>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrArea').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6; margin:15px 0;">📸 فتح الكاميرا للمسح</button>
                    <textarea id="ocrArea" placeholder="سيظهر النص هنا بعد المسح أو يمكنك لصقه يدوياً..." style="width:100%; height:200px; padding:10px; border-radius:10px; border:1px solid #ddd;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrArea').value; if(t){ const id='c'+Date.now(); window.lessonsData[id]={id, title:'نص مستورد', content:t, terms:[]}; appInstance.unlockedLessons.push(id); appInstance.selectedLessonId=id; appInstance.currentPage='reading'; appInstance.saveData(); appInstance.render(); }" style="width:100%; background:#16a34a; margin-top:10px;">تحويل لنص تفاعلي</button>
                </div>
            </main>`;
        }
    }
}

// تشغيل التطبيق
const appInstance = new App();
