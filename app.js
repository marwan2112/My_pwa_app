class App {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // إذا لم يجد البيانات، سينتظر ويحاول مرة أخرى (هنا قد تظهر شاشة بيضاء مؤقتة)
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
        this.lastScrollPos = 0; 

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

    async translateWord(word) {
        if (!word || word.trim().length < 2) return "";
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ar`);
            const data = await res.json();
            return data.responseData ? data.responseData.translatedText : "";
        } catch (error) {
            return "";
        }
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
            } else {
                arbInput.value = "";
            }
        }, 300); 
    }

    playSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = type === 'correct' ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(type === 'correct' ? 580 : 200, ctx.currentTime);
            g.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        let pool = [...terms]; 
        if (this.isUnlockTest) {
            let halfCount = Math.max(1, Math.floor(pool.length / 2));
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, halfCount);
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
                btn.style.setProperty('background-color', '#22c55e', 'important');
                btn.style.setProperty('color', 'white', 'important');
            } else if (btn === btnElement && !isCorrect) {
                btn.style.setProperty('background-color', '#ef4444', 'important');
                btn.style.setProperty('color', 'white', 'important');
            }
        });

        this.playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.quizScore++;

        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions();
            this.isWaiting = false;
            this.render();
        }, 2000);
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }

            switch(action) {
                case 'goHome': 
                    this.currentPage = 'home'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false; 
                    break;
                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.selectedLessonId = null; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;
                case 'selLesson':
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isCustom = Object.keys(this.customLessons).includes(param);
                    const isUnlocked = isCustom || (list[0] && list[0].id == param) || this.unlockedLessons.includes(String(param));
                    
                    if (isUnlocked) {
                        this.selectedLessonId = param;
                        this.currentPage = 'reading';
                    } else {
                        const prevIdx = list.findIndex(l => l.id == param) - 1;
                        this.tempLessonToUnlock = param;
                        this.selectedLessonId = list[prevIdx].id;
                        this.prepareQuiz(window.lessonsData[list[prevIdx].id].terms, true);
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
                case 'deleteWord': 
                    if(confirm('هل أنت متأكد من حذف هذه البطاقة نهائياً من العرض؟')) {
                        this.hiddenFromCards.push(String(param)); 
                        this.saveData(); 
                        if (this.currentCardIndex > 0) this.currentCardIndex--;
                        this.render();
                    } break;
                case 'masterWord': 
                    this.masteredWords.push(param); 
                    this.saveData(); 
                    if (this.currentCardIndex > 0) this.currentCardIndex--;
                    this.render(); break;
                case 'restartCards': 
                    this.currentCardIndex = 0; 
                    this.render(); break;
                case 'resetAll': 
                    if(confirm('سيتم إعادة إظهار جميع الكلمات المحفوظة والمحذوفة لهذا الدرس، هل أنت متأكد؟')) {
                        const idsToReset = JSON.parse(param);
                        this.masteredWords = this.masteredWords.filter(id => !idsToReset.includes(String(id)));
                        this.hiddenFromCards = this.hiddenFromCards.filter(id => !idsToReset.includes(String(id)));
                        this.saveData(); this.currentCardIndex = 0; this.render();
                    } break;
                case 'speak': window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); break;
                case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
                case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
                case 'addNewWord':
                    const eng = document.getElementById('newEng').value;
                    const arb = document.getElementById('newArb').value;
                    const scrollElem = document.querySelector('.reading-card');
                    if (scrollElem) this.lastScrollPos = scrollElem.scrollTop;

                    if(eng && arb) {
                        this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
                        this.saveData(); 
                        this.render();
                    } break;
                case 'editTitle':
                    const newTitle = prompt('أدخل العنوان الجديد للدرس:', param);
                    if(newTitle && this.customLessons[this.selectedLessonId]) {
                        this.customLessons[this.selectedLessonId].title = newTitle;
                        window.lessonsData[this.selectedLessonId].title = newTitle;
                        this.saveData(); this.render();
                    } break;
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
        
        if (this.currentPage === 'reading') {
            const scrollElem = document.querySelector('.reading-card');
            if (scrollElem) scrollElem.scrollTop = this.lastScrollPos;
        }
    }

    getHeader(terms) {
        const active = terms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
        let nav = '';
        if (this.selectedLessonId && !this.isUnlockTest && this.currentPage !== 'home' && this.currentPage !== 'lessons' && this.currentPage !== 'custom_lessons_view') {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${active.length})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">Booster</h2>${nav}</div></header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'home') {
            const hasCustom = Object.keys(this.customLessons).length > 0;
            return `<main class="main-content">
                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-bottom:20px;">📸 إضافة نص من الكاميرا</button>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${hasCustom ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="background:#fef3c7; border:2px solid #f59e0b;"><h3>📂 الدروس المحفوظة (كاميرا)</h3></div>` : ''}
                </div>
            </main>`;
        }

        if (this.currentPage === 'custom_lessons_view') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <h3 style="margin-top:20px;">الدروس المحفوظة:</h3>
                <div class="features-grid" style="margin-top:10px;">
                    ${Object.values(this.customLessons).map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>📝 ${l.title}</h3></div>`).join('')}
                </div>
            </main>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <div class="features-grid" style="margin-top:20px;">${list.map(l => {
                    const ok = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id)));
                    return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${ok?'':'opacity:0.5; border:1px dashed #ccc;'}"><h3>${ok?'':'🔒 '}${l.title}</h3></div>`;
                }).join('')}</div>
            </main>`;
        }

        if (this.currentPage === 'reading') {
            const isCustom = this.customLessons[this.selectedLessonId];
            return `<main class="main-content">
                <button class="hero-btn" data-action="selLevel" data-param="${isCustom?'custom_list':this.selectedLevel}">← القائمة</button>
                <div style="display:flex; align-items:center; gap:10px; margin-top:15px;">
                    <h2 style="flex:1;">${lesson.title}</h2>
                    ${isCustom ? `<button class="hero-btn" data-action="editTitle" data-param="${lesson.title}" style="background:#64748b; padding:5px 10px;">📝 تعديل الاسم</button>` : ''}
                </div>
               <div class="reading-card" style="margin-top:15px; max-height:350px; overflow-y:auto; border-left:4px solid #1e40af; direction: ltr; text-align: left;">${lesson ? lesson.content : 'لا يوجد نص'}</div>
                <div style="background:white; padding:15px; border-radius:12px; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <h4>أضف كلمة من النص:</h4>
                    <input id="newEng" placeholder="English" style="width:100%; padding:10px; margin:5px 0; border:1px solid #ddd; border-radius:5px;" oninput="appInstance.handleTypingTranslate(this.value)">
                    <input id="newArb" placeholder="المعنى" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;" oninput="this.dataset.auto='false'">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#16a34a;">+ حفظ الكلمة</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const s = ((this.quizScore/this.quizQuestions.length)*100).toFixed(0);
                if (this.isUnlockTest && s >= 70) { 
                    this.unlockedLessons.push(String(this.tempLessonToUnlock)); 
                    this.selectedLessonId = this.tempLessonToUnlock;
                    this.isUnlockTest = false; 
                    this.saveData(); 
                }
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card"><h1>النتيجة: ${s}%</h1>
                    <button class="hero-btn" data-action="setPage" data-param="reading">متابعة</button></div>
                </main>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">✕</button>
                    <b>السؤال ${this.quizIndex+1} / ${this.quizQuestions.length}</b>
                </div>
                <div class="reading-card" style="text-align:center;">
                    <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button>
                    <div style="margin-top:30px; display:grid; gap:10px;">
                        ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                    </div>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(t.id) && !this.hiddenFromCards.includes(String(t.id)));
            const allIds = JSON.stringify(allTerms.map(x=>x.id));
            
            if (active.length === 0) {
                return `<main class="main-content" style="text-align:center;">
                    <div class="reading-card"><h2>🎉 انتهت الكلمات!</h2>
                    <p>لقد قمت بمراجعة أو حذف جميع الكلمات في هذا الدرس.</p>
                    <button class="hero-btn" data-action="resetAll" data-param='${allIds}' style="background:#dc2626;">🔄 إعادة إظهار كل الكلمات (تصفير)</button></div>
                </main>`;
            }
            const t = active[this.currentCardIndex] || active[0];
            return `<main class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button class="hero-btn" data-action="setPage" data-param="reading">←</button>
                    <b>${this.currentCardIndex+1} / ${active.length}</b>
                </div>
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <h1>${t.english}</h1>
                            <button class="hero-btn" data-action="speak" data-param="${t.english}" style="margin-top:15px; background:rgba(255,255,255,0.2); border:1px solid white; padding:5px 15px;">🔊 نطق الكلمة</button>
                        </div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669; flex:1;">✅ حفظت</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626; flex:1;">🗑️ حذف</button>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:15px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button>
                </div>
                <center style="margin-top:30px;">
                    <button class="hero-btn" data-action="restartCards" style="background:#64748b; font-size:0.8rem;">🔄 إعادة الجولة من البداية</button>
                </center>
            </main>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome">← رجوع</button>
                <div class="reading-card" style="margin-top:20px;">
                    <h3>📸 استخراج نص من الكاميرا</h3>
                    <input type="file" id="camIn" accept="image/*" style="display:none;" onchange="const f=this.files[0]; if(f){ Tesseract.recognize(f,'eng').then(r=>{document.getElementById('ocrText').value=r.data.text;}) }">
                    <button class="hero-btn" onclick="document.getElementById('camIn').click()" style="width:100%; background:#8b5cf6; margin-bottom:15px;">فتح الكاميرا</button>
                    <textarea id="ocrText" placeholder="النص سيظهر هنا..." style="width:100%; height:200px; padding:10px; border-radius:10px; border:1px solid #ddd;"></textarea>
                    <button class="hero-btn" onclick="const t=document.getElementById('ocrText').value; if(t){ 
                        const id='c'+Date.now(); 
                        const newL={id, title:'نص جديد ' + new Date().toLocaleDateString(), content:t, terms:[]};
                        appInstance.customLessons[id]=newL;
                        window.lessonsData[id]=newL; 
                        appInstance.saveData(); 
                        appInstance.selectedLessonId=id;
                        appInstance.currentPage='reading';
                        appInstance.render(); 
                    }" style="width:100%; background:#16a34a; margin-top:10px;">حفظ النص والبدء</button>
                </div>
            </main>`;
        }
    }
}
const appInstance = new App();
