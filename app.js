/**
 * Booster PRO - Comprehensive Educational System 2026
 * بجميع الميزات: كاميرا، اختبارات ذكية، حفظ نصوص، نطق، وتصحيح الشاشة البيضاء
 */

class BoosterApp {
    constructor() {
        this.init();
    }

    async init() {
        // 1. حل مشكلة الشاشة البيضاء: انتظار تحميل البيانات والمكتبات
        let retry = 0;
        while ((!window.levels || !window.lessonsData) && retry < 50) {
            await new Promise(r => setTimeout(r, 100));
            retry++;
        }

        if (!window.levels) {
            document.body.innerHTML = '<div style="text-align:center;padding:50px;">خطأ في تحميل البيانات الأساسية. تأكد من ملف data.js</div>';
            return;
        }

        // 2. إعداد الحالات (States)
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        
        // ميزات الاختبار
        this.quizWords = [];
        this.currentQuizIndex = 0;
        this.score = 0;
        this.selectedOption = null;
        this.isCorrect = null;

        // التخزين المحلي (LocalStorage)
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {};
        
        // دمج الدروس المضافة
        Object.assign(window.lessonsData, this.customLessons);

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            this.handleAction(btn.dataset);
        });

        // ميزة الكاميرا
        document.addEventListener('change', async (e) => {
            if (e.target.id === 'cameraInput') {
                const file = e.target.files[0];
                if (file) await this.processOCR(file);
            }
        });
    }

    handleAction(data) {
        const { action, param, total } = data;
        
        if (action === 'goHome') this.currentPage = 'home';
        if (action === 'selLevel') { 
            this.selectedLevel = param; 
            this.currentPage = (param === 'custom_list') ? 'custom_view' : 'lessons'; 
        }
        if (action === 'selLesson') {
            this.selectedLessonId = param;
            this.currentPage = 'reading';
            this.currentCardIndex = 0;
        }
        if (action === 'setPage') {
            this.currentPage = param;
            if (param === 'quiz') this.startQuiz();
        }
        if (action === 'nextC') if (this.currentCardIndex < (total - 1)) this.currentCardIndex++;
        if (action === 'prevC') if (this.currentCardIndex > 0) this.currentCardIndex--;
        if (action === 'speak') this.speak(param);
        if (action === 'masterWord') this.toggleMastery(param);
        if (action === 'checkQuiz') this.checkAnswer(param);
        if (action === 'nextQuiz') this.nextQuizQuestion();
        if (action === 'editTitle') this.editLessonTitle(param);
        if (action === 'deleteLesson') this.deleteLesson(param);

        this.render();
    }

    // --- ميزات الكاميرا (OCR) ---
    async processOCR(file) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loader-overlay">جاري تحليل النص بالكاميرا...</div>';
        
        try {
            const worker = await Tesseract.createWorker('eng+ara');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const id = 'custom_' + Date.now();
            this.customLessons[id] = {
                title: "نص جديد " + new Date().toLocaleDateString(),
                content: text,
                terms: this.generateMockTerms(text) 
            };
            this.saveCustom();
            this.selectedLessonId = id;
            this.currentPage = 'reading';
        } catch (e) {
            alert("فشلت الكاميرا في قراءة النص");
        }
        this.render();
    }

    generateMockTerms(text) {
        // استخراج كلمات تجريبية من النص الممسوح
        const words = text.split(/\s+/).filter(w => w.length > 5).slice(0, 5);
        return words.map((w, i) => ({ id: `c${i}_${Date.now()}`, english: w, arabic: "راجع النص" }));
    }

    // --- ميزات الاختبار (Quiz) ---
    startQuiz() {
        const lesson = window.lessonsData[this.selectedLessonId];
        // اختيار نصف الكلمات كما طلبت
        const allTerms = [...lesson.terms];
        const count = Math.max(1, Math.floor(allTerms.length / 2));
        this.quizWords = allTerms.sort(() => 0.5 - Math.random()).slice(0, count);
        this.currentQuizIndex = 0;
        this.score = 0;
        this.resetQuizState();
    }

    resetQuizState() {
        this.selectedOption = null;
        this.isCorrect = null;
    }

    checkAnswer(answer) {
        if (this.selectedOption !== null) return;
        this.selectedOption = answer;
        const currentWord = this.quizWords[this.currentQuizIndex];
        this.isCorrect = (answer === currentWord.arabic);
        if (this.isCorrect) this.score++;
        this.render();
    }

    nextQuizQuestion() {
        this.currentQuizIndex++;
        this.resetQuizState();
        if (this.currentQuizIndex >= this.quizWords.length) {
            this.currentPage = 'quiz_result';
        }
        this.render();
    }

    // --- ميزات الحفظ والتعديل ---
    saveCustom() {
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        Object.assign(window.lessonsData, this.customLessons);
    }

    editLessonTitle(id) {
        const newTitle = prompt("أدخل الاسم الجديد للنص:", window.lessonsData[id].title);
        if (newTitle) {
            if (this.customLessons[id]) {
                this.customLessons[id].title = newTitle;
                this.saveCustom();
            } else {
                window.lessonsData[id].title = newTitle;
            }
        }
    }

    deleteLesson(id) {
        if (confirm("هل أنت متأكد من حذف هذا النص؟")) {
            delete this.customLessons[id];
            this.saveCustom();
            this.currentPage = 'home';
        }
    }

    toggleMastery(id) {
        if (!this.masteredWords.includes(id)) {
            this.masteredWords.push(id);
            localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        }
    }

    speak(text) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'en-US';
        window.speechSynthesis.speak(ut);
    }

    // --- نظام العرض (UI) ---
    render() {
        const app = document.getElementById('app');
        const lesson = window.lessonsData[this.selectedLessonId];
        const activeTerms = lesson ? lesson.terms.filter(t => !this.masteredWords.includes(t.id)) : [];

        app.innerHTML = this.renderHeader(activeTerms.length) + 
                        `<div id="view">${this.renderView(lesson, activeTerms)}</div>`;
    }

    renderHeader(count) {
        let nav = '';
        if (this.selectedLessonId && !['home', 'lessons', 'custom_view'].includes(this.currentPage)) {
            nav = `
            <nav class="nav-menu">
                <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${count})</button>
                <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>`;
        }
        return `<header class="header"><div class="header-content"><h2 data-action="goHome">Booster PRO</h2>${nav}</div></header>`;
    }

    renderView(lesson, activeTerms) {
        if (this.currentPage === 'home') {
            return `
            <main class="main-content">
                <div class="hero-section" style="text-align:center; background:white; padding:30px; border-radius:20px; margin-bottom:20px;">
                    <h1>أهلاً بك مروان</h1>
                    <label class="hero-btn" style="margin-top:15px; display:inline-block;">
                        📷 كاميرا (إضافة نص)
                        <input type="file" id="cameraInput" accept="image/*" capture="environment" hidden>
                    </label>
                </div>
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:2px solid #1e40af"><h3>📂 نصوصي المضافة</h3></div>` : ''}
                </div>
            </main>`;
        }

        if (this.currentPage === 'lessons' || this.currentPage === 'custom_view') {
            const list = (this.currentPage === 'custom_view') ? Object.entries(this.customLessons).map(([id, l]) => ({id, ...l})) : (window.lessonsList[this.selectedLevel] || []);
            return `
            <main class="main-content">
                <button class="hero-btn" data-action="goHome">← الرئيسية</button>
                <div class="features-grid" style="margin-top:20px">
                    ${list.map(l => `
                        <div class="feature-card">
                            <h3 data-action="selLesson" data-param="${l.id}">${l.title}</h3>
                            <div style="margin-top:10px;">
                                <button onclick="event.stopPropagation()" data-action="editTitle" data-param="${l.id}" style="border:none; background:none; cursor:pointer;">✏️ تعديل الاسم</button>
                                ${this.currentPage === 'custom_view' ? `<button onclick="event.stopPropagation()" data-action="deleteLesson" data-param="${l.id}" style="color:red; border:none; background:none; cursor:pointer; margin-right:10px;">🗑️ حذف</button>` : ''}
                            </div>
                        </div>`).join('')}
                </div>
            </main>`;
        }

        if (this.currentPage === 'reading') {
            return `
            <main class="main-content">
                <div class="reading-card shadow">
                    <h2 style="color:#1e40af; margin-bottom:15px; text-align:right;">${lesson.title}</h2>
                    <div style="direction:ltr; text-align:left; font-family:'Poppins'; line-height:2; font-size:1.1rem;">
                        ${lesson.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const t = activeTerms[this.currentCardIndex] || activeTerms[0];
            if (!t) return `<div class="main-content" style="text-align:center;"><h2>أنهيت جميع الكلمات! ✅</h2></div>`;
            return `
            <main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front"><h1>${t.english}</h1><p>اضغط للترجمة</p></div>
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="hero-btn" style="flex:1" data-action="speak" data-param="${t.english}">🔊 نطق</button>
                    <button class="hero-btn" style="flex:1; background:#059669" data-action="masterWord" data-param="${t.id}">✅ حفظت</button>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                    <button class="hero-btn" data-action="prevC">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${activeTerms.length}">التالي</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            const currentWord = this.quizWords[this.currentQuizIndex];
            // توليد ٤ خيارات عشوائية
            const options = [currentWord.arabic];
            while(options.length < 4) {
                const randomWord = lesson.terms[Math.floor(Math.random() * lesson.terms.length)].arabic;
                if(!options.includes(randomWord)) options.push(randomWord);
            }
            const shuffledOptions = options.sort(() => 0.5 - Math.random());

            return `
            <main class="main-content">
                <div class="reading-card" style="text-align:center">
                    <p>السؤال ${this.currentQuizIndex + 1} من ${this.quizWords.length}</p>
                    <h1 style="font-size:2.5rem; margin:20px 0;">${currentWord.english}</h1>
                    <div class="options-grid">
                        ${shuffledOptions.map(opt => {
                            let statusClass = '';
                            if (this.selectedOption === opt) {
                                statusClass = this.isCorrect ? 'correct-flash' : 'wrong-flash';
                            } else if (this.selectedOption !== null && opt === currentWord.arabic) {
                                statusClass = 'correct-flash';
                            }
                            return `<button class="quiz-opt-btn ${statusClass}" data-action="checkQuiz" data-param="${opt}">${opt}</button>`;
                        }).join('')}
                    </div>
                    ${this.selectedOption !== null ? `<button class="hero-btn" style="margin-top:20px; width:100%" data-action="nextQuiz">السؤال التالي ←</button>` : ''}
                </div>
            </main>`;
        }

        if (this.currentPage === 'quiz_result') {
            return `<main class="main-content" style="text-align:center">
                <div class="reading-card">
                    <h1>النتيجة النهائية</h1>
                    <p style="font-size:3rem; color:#1e40af; margin:20px 0;">${this.score} / ${this.quizWords.length}</p>
                    <button class="hero-btn" data-action="setPage" data-param="reading">العودة للدرس</button>
                </div>
            </main>`;
        }
    }
}

// البدء الرسمي للتطبيق
const appInstance = new BoosterApp();
