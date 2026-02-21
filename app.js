/**
 * BOOSTER ULTIMATE - 2026
 * نظام مروان الكامل: كاميرا + اختبارات + معالجة أخطاء الشاشة البيضاء
 */

const Booster = {
    // 1. الإعدادات والحالات
    config: {
        lastScroll: 0,
        isProcessing: false
    },
    
    state: {
        page: 'home',
        level: null,
        lessonId: null,
        cardIdx: 0,
        quiz: {
            active: false,
            questions: [],
            currentIdx: 0,
            score: 0,
            selected: null,
            correct: null
        }
    },

    // 2. التشغيل الآمن (حل مشكلة الشاشة البيضاء)
    init() {
        console.log("Booster System Initializing...");
        
        // المحفوظات
        this.mastered = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.customs = JSON.parse(localStorage.getItem('customLessons')) || {};
        
        // محاولة دمج البيانات
        this.syncData();
        
        // رسم الواجهة فوراً (حتى لو لم تكتمل البيانات لمنع البياض)
        this.render();
        this.bindGlobalEvents();
        
        // فحص البيانات في الخلفية
        this.healthCheck();
    },

    syncData() {
        if (window.lessonsData && this.customs) {
            Object.assign(window.lessonsData, this.customs);
        }
    },

    healthCheck() {
        let timer = setInterval(() => {
            if (window.levels && window.lessonsData) {
                this.syncData();
                this.render();
                clearInterval(timer);
            }
        }, 500);
    },

    // 3. إدارة الأحداث
    bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            
            const { action, param, total } = el.dataset;
            this.handleAction(action, param, total);
        });

        // حدث الكاميرا
        document.addEventListener('change', (e) => {
            if (e.target.id === 'cameraInput') this.handleOCR(e.target.files[0]);
        });
    },

    handleAction(action, param, total) {
        if (action === 'goHome') this.state.page = 'home';
        if (action === 'selLevel') {
            this.state.level = param;
            this.state.page = (param === 'custom_list') ? 'custom_view' : 'lessons';
        }
        if (action === 'selLesson') {
            this.state.lessonId = param;
            this.state.page = 'reading';
            this.state.cardIdx = 0;
        }
        if (action === 'setPage') this.state.page = param;
        if (action === 'nextC') if (this.state.cardIdx < (total - 1)) this.state.cardIdx++;
        if (action === 'prevC') if (this.state.cardIdx > 0) this.state.cardIdx--;
        if (action === 'speak') this.speak(param);
        if (action === 'master') this.toggleMastery(param);
        
        // أفعال الاختبار
        if (action === 'startQuiz') this.initQuiz();
        if (action === 'checkAns') this.checkQuizAnswer(param);
        if (action === 'nextQ') this.nextQuestion();
        
        // أفعال التعديل
        if (action === 'editT') this.renameLesson(param);
        if (action === 'delL') this.deleteLesson(param);

        this.render();
    },

    // 4. ميزات الكاميرا (OCR)
    async handleOCR(file) {
        if (!file) return;
        this.config.isProcessing = true;
        this.render();

        try {
            const worker = await Tesseract.createWorker('eng+ara');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const id = 'c_' + Date.now();
            this.customs[id] = {
                title: "نص كاميرا " + new Date().toLocaleDateString('ar-EG'),
                content: text,
                terms: [{ id: 't_'+id, english: 'New Text', arabic: 'نص جديد' }]
            };
            localStorage.setItem('customLessons', JSON.stringify(this.customs));
            this.syncData();
            this.state.lessonId = id;
            this.state.page = 'reading';
        } catch (err) {
            alert("خطأ في قراءة الصورة");
        }
        this.config.isProcessing = false;
        this.render();
    },

    // 5. نظام الاختبار (Quiz) - طلب مروان المخصص
    initQuiz() {
        const lesson = window.lessonsData[this.state.lessonId];
        const all = [...lesson.terms];
        // يختار نصف الكلمات
        const count = Math.max(1, Math.floor(all.length / 2));
        this.state.quiz.questions = all.sort(() => 0.5 - Math.random()).slice(0, count);
        this.state.quiz.currentIdx = 0;
        this.state.quiz.score = 0;
        this.state.quiz.selected = null;
        this.state.quiz.correct = null;
        this.state.page = 'quiz';
    },

    checkQuizAnswer(ans) {
        if (this.state.quiz.selected !== null) return;
        const current = this.state.quiz.questions[this.state.quiz.currentIdx];
        this.state.quiz.selected = ans;
        this.state.quiz.correct = (ans === current.arabic);
        if (this.state.quiz.correct) this.state.quiz.score++;
        this.render();
    },

    nextQuestion() {
        this.state.quiz.currentIdx++;
        this.state.quiz.selected = null;
        if (this.state.quiz.currentIdx >= this.state.quiz.questions.length) {
            this.state.page = 'quiz_end';
        }
        this.render();
    },

    // 6. الحذف والتعديل والنطق
    renameLesson(id) {
        const n = prompt("الاسم الجديد:", window.lessonsData[id].title);
        if (n && this.customs[id]) {
            this.customs[id].title = n;
            localStorage.setItem('customLessons', JSON.stringify(this.customs));
            this.render();
        }
    },

    deleteLesson(id) {
        if (confirm("حذف النص نهائياً؟")) {
            delete this.customs[id];
            localStorage.setItem('customLessons', JSON.stringify(this.customs));
            this.state.page = 'home';
            this.render();
        }
    },

    speak(t) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    },

    toggleMastery(id) {
        if (!this.mastered.includes(id)) {
            this.mastered.push(id);
            localStorage.setItem('masteredWords', JSON.stringify(this.mastered));
        }
    },

    // 7. محرك الرسم (UI Engine)
    render() {
        const app = document.getElementById('app');
        if (!app) return;

        // حالة التحميل
        if (this.config.isProcessing) {
            app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;">
                <div class="loader"></div><p>جاري سحب النص من الصورة...</p></div>`;
            return;
        }

        const lesson = (window.lessonsData && this.state.lessonId) ? window.lessonsData[this.state.lessonId] : null;
        const terms = lesson ? lesson.terms.filter(t => !this.mastered.includes(t.id)) : [];

        app.innerHTML = this.uiHeader(terms.length) + `<div id="view">${this.uiView(lesson, terms)}</div>`;
    },

    uiHeader(count) {
        let nav = '';
        if (this.state.lessonId && !['home', 'lessons', 'custom_view'].includes(this.state.page)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.state.page==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.state.page==='cards'?'active':''}" data-action="setPage" data-param="cards">البطاقات (${count})</button>
                <button class="nav-btn ${this.state.page==='quiz'?'active':''}" data-action="startQuiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome">Booster</h2>${nav}</div></header>`;
    },

    uiView(lesson, terms) {
        // الصفحة الرئيسية
        if (this.state.page === 'home') {
            return `
            <main class="main-content">
                <div class="reading-card" style="text-align:center; margin-bottom:20px;">
                    <h1>مرحباً مروان</h1>
                    <label class="hero-btn" style="margin-top:15px; display:inline-block;">
                        📷 إضافة نص بالكاميرا
                        <input type="file" id="cameraInput" accept="image/*" capture="environment" hidden>
                    </label>
                </div>
                <div class="features-grid">
                    ${(window.levels || []).map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customs).length ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:2px solid #1e40af;"><h3>📂 نصوصي</h3></div>` : ''}
                </div>
            </main>`;
        }

        // قائمة الدروس
        if (this.state.page === 'lessons' || this.state.page === 'custom_view') {
            const list = (this.state.page === 'custom_view') ? 
                         Object.entries(this.customs).map(([id, l]) => ({id, ...l})) : 
                         (window.lessonsList ? window.lessonsList[this.state.level] : []);
            
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:20px;">← عودة</button>
                <div class="features-grid">
                    ${list.map(l => `
                        <div class="feature-card">
                            <h3 data-action="selLesson" data-param="${l.id}">${l.title}</h3>
                            <div style="margin-top:10px; display:flex; gap:10px; justify-content:center;">
                                <button data-action="editT" data-param="${l.id}">✏️</button>
                                ${this.state.page==='custom_view' ? `<button data-action="delL" data-param="${l.id}">🗑️</button>` : ''}
                            </div>
                        </div>`).join('')}
                </div></main>`;
        }

        // قراءة النص (محاذاة يسار)
        if (this.state.page === 'reading' && lesson) {
            return `<main class="main-content">
                <div class="reading-card shadow">
                    <h2 style="text-align:right; color:#1e40af; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">${lesson.title}</h2>
                    <div style="direction:ltr; text-align:left; font-family:'Poppins'; line-height:1.8; font-size:1.15rem; color:#334155;">
                        ${lesson.content.replace(/\n/g, '<br>')}
                    </div>
                </div></main>`;
        }

        // البطاقات
        if (this.state.page === 'cards') {
            const t = terms[this.state.cardIdx];
            if (!t) return `<div class="main-content" style="text-align:center;"><h2>أنهيت الكلمات! 🎉</h2></div>`;
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="hero-btn" style="flex:1" data-action="speak" data-param="${t.english}">🔊 نطق</button>
                    <button class="hero-btn" style="flex:1; background:#059669;" data-action="master" data-param="${t.id}">✅ حفظت</button>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button>
                </div></main>`;
        }

        // الاختبار (4 خيارات + تغيير ألوان)
        if (this.state.page === 'quiz') {
            const q = this.state.quiz.questions[this.state.quiz.currentIdx];
            const allOpts = [q.arabic];
            while(allOpts.length < 4) {
                const r = lesson.terms[Math.floor(Math.random()*lesson.terms.length)].arabic;
                if(!allOpts.includes(r)) allOpts.push(r);
            }
            const shuffled = allOpts.sort(() => 0.5 - Math.random());

            return `<main class="main-content">
                <div class="reading-card" style="text-align:center;">
                    <p>سؤال ${this.state.quiz.currentIdx+1} من ${this.state.quiz.questions.length}</p>
                    <h1 style="margin:20px 0; font-size:2.5rem;">${q.english}</h1>
                    <div class="options-grid">
                        ${shuffled.map(o => {
                            let cls = '';
                            if (this.state.quiz.selected === o) cls = this.state.quiz.correct ? 'correct-flash' : 'wrong-flash';
                            if (this.state.quiz.selected !== null && o === q.arabic) cls = 'correct-flash';
                            return `<button class="quiz-opt-btn ${cls}" data-action="checkAns" data-param="${o}">${o}</button>`;
                        }).join('')}
                    </div>
                    ${this.state.quiz.selected ? `<button class="hero-btn" style="width:100%; margin-top:20px;" data-action="nextQ">التالي ←</button>` : ''}
                </div></main>`;
        }

        if (this.state.page === 'quiz_end') {
            return `<main class="main-content" style="text-align:center;">
                <div class="reading-card"><h1>النتيجة: ${this.state.quiz.score} / ${this.state.quiz.questions.length}</h1>
                <button class="hero-btn" style="margin-top:20px;" data-action="setPage" data-param="reading">عودة للدرس</button></div></main>`;
        }

        return `<div style="text-align:center; padding:50px;">جاري تحميل المحتوى...</div>`;
    }
};

// تشغيل النظام
Booster.init();
