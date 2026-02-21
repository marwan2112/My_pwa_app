/**
 * BOOSTER PRO - THE FINAL CODE 2026
 * نظام مروان الكامل: كاميرا، مستويات، دروس، بطاقات، واختبارات ملونة
 */

const BoosterApp = {
    state: {
        page: 'home',
        selectedLevel: null,
        selectedLessonId: null,
        cardIdx: 0,
        mastered: JSON.parse(localStorage.getItem('masteredWords')) || [],
        customs: JSON.parse(localStorage.getItem('customLessons')) || {},
        quiz: { questions: [], current: 0, score: 0, selected: null, isCorrect: null }
    },

    init() {
        // دمج الدروس المضافة من الكاميرا مع البيانات الأساسية
        if (window.lessonsData) Object.assign(window.lessonsData, this.state.customs);
        
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, total } = btn.dataset;
            this.handleAction(action, param, total);
        });

        // ميزة الكاميرا وصور الهاتف
        document.addEventListener('change', async (e) => {
            if (e.target.id === 'cameraInput') {
                const file = e.target.files[0];
                if (file) this.processOCR(file);
            }
        });
    },

    handleAction(action, param, total) {
        if (action === 'goHome') this.state.page = 'home';
        if (action === 'selLevel') { 
            this.state.selectedLevel = param; 
            this.state.page = (param === 'custom_list') ? 'custom_view' : 'lessons'; 
        }
        if (action === 'selLesson') {
            this.state.selectedLessonId = param;
            this.state.page = 'reading';
            this.state.cardIdx = 0;
        }
        if (action === 'setPage') {
            this.state.page = param;
            if (param === 'quiz') this.initQuiz();
        }
        if (action === 'nextC') if (this.state.cardIdx < (total - 1)) this.state.cardIdx++;
        if (action === 'prevC') if (this.state.cardIdx > 0) this.state.cardIdx--;
        if (action === 'speak') this.speak(param);
        if (action === 'master') {
            if (!this.state.mastered.includes(param)) {
                this.state.mastered.push(param);
                localStorage.setItem('masteredWords', JSON.stringify(this.state.mastered));
            }
        }
        if (action === 'checkAns') this.checkQuiz(param);
        if (action === 'nextQ') this.nextQuestion();
        if (action === 'editTitle') this.editTitle(param);
        if (action === 'delLesson') this.deleteLesson(param);

        this.render();
    },

    // --- ميزة الكاميرا (OCR) ---
    async processOCR(file) {
        document.getElementById('app').innerHTML = '<div class="loader-overlay">جاري قراءة النص...</div>';
        try {
            const worker = await Tesseract.createWorker('eng+ara');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const id = 'c_' + Date.now();
            this.state.customs[id] = {
                title: "نص مصور " + new Date().toLocaleTimeString(),
                content: text,
                terms: this.extractTerms(text)
            };
            localStorage.setItem('customLessons', JSON.stringify(this.state.customs));
            Object.assign(window.lessonsData, this.state.customs);
            this.state.selectedLessonId = id;
            this.state.page = 'reading';
        } catch (e) { alert("فشل في معالجة الصورة"); }
        this.render();
    },

    extractTerms(text) {
        return text.split(' ').filter(w => w.length > 5).slice(0, 6).map((w, i) => ({
            id: 't'+i+Date.now(), english: w, arabic: "كلمة مستخرجة"
        }));
    },

    // --- نظام الاختبار (Quiz) بـ 4 خيارات وألوان ---
    initQuiz() {
        const lesson = window.lessonsData[this.state.selectedLessonId];
        const count = Math.max(1, Math.floor(lesson.terms.length / 2));
        this.state.quiz = {
            questions: [...lesson.terms].sort(() => 0.5 - Math.random()).slice(0, count),
            current: 0, score: 0, selected: null, isCorrect: null
        };
    },

    checkQuiz(ans) {
        if (this.state.quiz.selected) return;
        const correctAns = this.state.quiz.questions[this.state.quiz.current].arabic;
        this.state.quiz.selected = ans;
        this.state.quiz.isCorrect = (ans === correctAns);
        if (this.state.quiz.isCorrect) this.state.quiz.score++;
        this.render();
    },

    nextQuestion() {
        this.state.quiz.current++;
        this.state.quiz.selected = null;
        if (this.state.quiz.current >= this.state.quiz.questions.length) this.state.page = 'quiz_end';
        this.render();
    },

    // --- تعديل وحذف ونطق ---
    editTitle(id) {
        const n = prompt("الاسم الجديد:", window.lessonsData[id].title);
        if (n) { this.state.customs[id].title = n; localStorage.setItem('customLessons', JSON.stringify(this.state.customs)); }
    },
    deleteLesson(id) {
        if (confirm("حذف؟")) { delete this.state.customs[id]; localStorage.setItem('customLessons', JSON.stringify(this.state.customs)); this.state.page = 'home'; }
    },
    speak(t) {
        const u = new SpeechSynthesisUtterance(t);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    },

    // --- الواجهات (UI) ---
    render() {
        const app = document.getElementById('app');
        if (!window.levels) return app.innerHTML = "خطأ في تحميل data.js";

        const lesson = window.lessonsData[this.state.selectedLessonId];
        const activeTerms = lesson ? lesson.terms.filter(t => !this.state.mastered.includes(t.id)) : [];

        app.innerHTML = this.renderHeader(activeTerms.length) + 
                        `<div id="view">${this.renderView(lesson, activeTerms)}</div>`;
    },

    renderHeader(count) {
        let nav = '';
        if (this.state.selectedLessonId && !['home', 'lessons', 'custom_view'].includes(this.state.page)) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.state.page==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.state.page==='cards'?'active':''}" data-action="setPage" data-param="cards">البطاقات (${count})</button>
                <button class="nav-btn ${this.state.page==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome">Booster</h2>${nav}</div></header>`;
    },

    renderView(lesson, terms) {
        if (this.state.page === 'home') {
            return `<main class="main-content">
                <div class="reading-card shadow" style="text-align:center;">
                    <h1>مرحباً مروان</h1>
                    <label class="hero-btn" style="margin-top:15px; display:inline-block;">
                        📷 كاميرا / 🖼️ صور
                        <input type="file" id="cameraInput" accept="image/*" hidden>
                    </label>
                </div>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.state.customs).length ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:2px solid #1e40af"><h3>📂 نصوصي المضافة</h3></div>` : ''}
                </div></main>`;
        }

        if (this.state.page === 'lessons' || this.state.page === 'custom_view') {
            const list = (this.state.page === 'custom_view') ? Object.entries(this.state.customs).map(([id, l]) => ({id, ...l})) : (window.lessonsList[this.state.selectedLevel] || []);
            return `<main class="main-content">
                <div class="features-grid">
                    ${list.map(l => `<div class="feature-card">
                        <h3 data-action="selLesson" data-param="${l.id}">${l.title}</h3>
                        <div style="margin-top:10px;">
                            <button data-action="editTitle" data-param="${l.id}">✏️</button>
                            ${this.state.page==='custom_view' ? `<button data-action="delLesson" data-param="${l.id}">🗑️</button>` : ''}
                        </div>
                    </div>`).join('')}
                </div></main>`;
        }

        if (this.state.page === 'reading') {
            return `<main class="main-content">
                <div class="reading-card shadow">
                    <h2 style="text-align:right;">${lesson.title}</h2>
                    <div style="direction:ltr; text-align:left; line-height:1.8; font-size:1.1rem;">${lesson.content.replace(/\n/g, '<br>')}</div>
                </div></main>`;
        }

        if (this.state.page === 'cards') {
            const t = terms[this.state.cardIdx];
            if (!t) return `<div class="main-content"><h2>انتهت الكلمات! ✅</h2></div>`;
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}">🔊 نطق</button>
                    <button class="hero-btn" style="background:#059669" data-action="master" data-param="${t.id}">✅ حفظت</button>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button>
                </div></main>`;
        }

        if (this.state.page === 'quiz') {
            const q = this.state.quiz.questions[this.state.quiz.current];
            const options = [q.arabic];
            while(options.length < 4) {
                const r = lesson.terms[Math.floor(Math.random()*lesson.terms.length)].arabic;
                if(!options.includes(r)) options.push(r);
            }
            const shuffled = options.sort(() => 0.5 - Math.random());
            return `<main class="main-content"><div class="reading-card" style="text-align:center;">
                <p>السؤال ${this.state.quiz.current+1}/${this.state.quiz.questions.length}</p>
                <h1 style="margin:20px 0;">${q.english}</h1>
                <div class="options-grid">
                    ${shuffled.map(opt => {
                        let cls = '';
                        if (this.state.quiz.selected === opt) cls = this.state.quiz.isCorrect ? 'correct-flash' : 'wrong-flash';
                        if (this.state.quiz.selected !== null && opt === q.arabic) cls = 'correct-flash';
                        return `<button class="quiz-opt-btn ${cls}" data-action="checkAns" data-param="${opt}">${opt}</button>`;
                    }).join('')}
                </div>
                ${this.state.quiz.selected ? `<button class="hero-btn" style="width:100%;margin-top:20px;" data-action="nextQ">التالي</button>` : ''}
            </div></main>`;
        }
        
        if (this.state.page === 'quiz_end') {
            return `<main class="main-content" style="text-align:center;">
                <div class="reading-card"><h1>النتيجة: ${this.state.quiz.score} / ${this.state.quiz.questions.length}</h1>
                <button class="hero-btn" data-action="setPage" data-param="reading">عودة للدرس</button></div></main>`;
        }
    }
};

BoosterApp.init();
