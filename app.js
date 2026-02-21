/**
 * Booster PRO - المساعد الذكي للمصطلحات السياسية والقانونية
 * الإصدار الكامل والشامل بجميع الميزات
 */

class App {
    constructor() {
        this.initStates();
        this.bindEvents();
    }

    initStates() {
        // حماية البيانات: الانتظار والتحقق
        this.dataReady = !!(window.levels && window.lessonsData);
        this.currentPage = 'home';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.lastScrollPos = 0;

        // ميزات الـ OCR (الكاميرا)
        this.isProcessingImage = false;

        // تحميل البيانات من التخزين المحلي
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {};

        // دمج الدروس المضافة عبر الكاميرا
        if (window.lessonsData) {
            Object.assign(window.lessonsData, this.customLessons);
        }
    }

    async checkData() {
        let attempts = 0;
        while (!window.levels && attempts < 30) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        return !!window.levels;
    }

    bindEvents() {
        // تشغيل التطبيق بعد التأكد من وجود DOM والبيانات
        window.addEventListener('DOMContentLoaded', async () => {
            const ready = await this.checkData();
            if (!ready) {
                document.getElementById('app').innerHTML = '<div style="padding:50px; text-align:center;">خطأ في تحميل الملفات البرمجية الأساسية.</div>';
                return;
            }
            this.render();
        });

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            this.handleAction(btn.dataset);
        });

        // مراقبة رفع الصور للكاميرا
        document.addEventListener('change', (e) => {
            if (e.target.id === 'cameraInput') this.handleImageUpload(e);
        });
    }

    handleAction(data) {
        const { action, param, total } = data;

        // حفظ مكان التمرير
        const scrollElem = document.querySelector('.reading-card');
        if (scrollElem) this.lastScrollPos = scrollElem.scrollTop;

        switch(action) {
            case 'goHome': this.currentPage = 'home'; break;
            case 'selLevel': 
                this.selectedLevel = param; 
                this.currentPage = (param === 'custom_list') ? 'custom_view' : 'lessons'; 
                break;
            case 'selLesson':
                this.selectedLessonId = param;
                this.currentPage = 'reading';
                this.currentCardIndex = 0;
                break;
            case 'setPage': this.currentPage = param; break;
            case 'nextC': if (this.currentCardIndex < (total - 1)) this.currentCardIndex++; break;
            case 'prevC': if (this.currentCardIndex > 0) this.currentCardIndex--; break;
            case 'speak': this.speak(param); break;
            case 'masterWord': this.toggleMastery(param); break;
            case 'deleteCustom': this.deleteCustomLesson(param); break;
        }
        this.render();
    }

    // --- ميزات الكاميرا و OCR ---
    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.isProcessingImage = true;
        this.render();

        try {
            const worker = await Tesseract.createWorker('eng+ara');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const lessonId = 'cam_' + Date.now();
            const newLesson = {
                title: "نص ممسوح ضوئياً - " + new Date().toLocaleDateString('ar-EG'),
                content: text,
                terms: this.extractTermsMock(text) // استخراج تجريبي للكلمات المهمة
            };

            this.customLessons[lessonId] = newLesson;
            localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
            Object.assign(window.lessonsData, this.customLessons);
            
            this.isProcessingImage = false;
            this.selectedLessonId = lessonId;
            this.currentPage = 'reading';
            this.render();
        } catch (err) {
            alert("خطأ في معالجة الصورة");
            this.isProcessingImage = false;
            this.render();
        }
    }

    extractTermsMock(text) {
        // وظيفة ذكية لاستخراج كلمات (يمكن تحسينها لاحقاً)
        return [{ id: Date.now()+'-1', english: 'Review Text', arabic: 'راجع النص' }];
    }

    // --- المنطق التعليمي ---
    toggleMastery(wordId) {
        if (this.masteredWords.includes(wordId)) {
            this.masteredWords = this.masteredWords.filter(id => id !== wordId);
        } else {
            this.masteredWords.push(wordId);
        }
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        this.render();
    }

    deleteCustomLesson(id) {
        delete this.customLessons[id];
        delete window.lessonsData[id];
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        this.currentPage = 'home';
        this.render();
    }

    speak(text) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'en-US';
        ut.rate = 0.9;
        window.speechSynthesis.speak(ut);
    }

    // --- واجهة المستخدم (Rendering) ---
    render() {
        const app = document.getElementById('app');
        if (!app) return;

        const lesson = window.lessonsData[this.selectedLessonId];
        const activeTerms = lesson ? lesson.terms.filter(t => !this.masteredWords.includes(t.id)) : [];

        app.innerHTML = `
            ${this.renderHeader(activeTerms.length)}
            <div id="view">${this.renderView(lesson, activeTerms)}</div>
            ${this.isProcessingImage ? '<div class="loader-overlay"><div class="loader"></div><p>جاري تحليل النص...</p></div>' : ''}
        `;

        if (this.currentPage === 'reading') {
            const scrollElem = document.querySelector('.reading-card');
            if (scrollElem) scrollElem.scrollTop = this.lastScrollPos;
        }
    }

    renderHeader(count) {
        let nav = '';
        if (this.selectedLessonId && !['home', 'lessons'].includes(this.currentPage)) {
            nav = `
                <nav class="nav-menu">
                    <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
                    <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${count})</button>
                </nav>`;
        }
        return `
            <header class="header">
                <div class="header-content">
                    <h2 data-action="goHome" style="cursor:pointer">Booster PRO</h2>
                    ${nav}
                </div>
            </header>`;
    }

    renderView(lesson, activeTerms) {
        switch(this.currentPage) {
            case 'home':
                return `
                    <main class="main-content">
                        <div class="hero-section">
                            <h1>أهلاً بك في معمل اللغة</h1>
                            <p>اختر مستواك أو استخدم الكاميرا لإضافة نص جديد</p>
                            <label class="camera-btn">
                                📷 تصوير نص جديد
                                <input type="file" id="cameraInput" accept="image/*" capture="environment" hidden>
                            </label>
                        </div>
                        <div class="features-grid">
                            ${window.levels.map(l => `
                                <div class="feature-card" data-action="selLevel" data-param="${l.id}">
                                    <div class="icon">${l.icon}</div>
                                    <h3>${l.name}</h3>
                                </div>`).join('')}
                            ${Object.keys(this.customLessons).length ? `
                                <div class="feature-card" data-action="selLevel" data-param="custom_list" style="border: 2px dashed #1e40af;">
                                    <div class="icon">📂</div>
                                    <h3>نصوصي المضافة</h3>
                                </div>` : ''}
                        </div>
                    </main>`;

            case 'lessons':
                const list = window.lessonsList[this.selectedLevel] || [];
                return `
                    <main class="main-content">
                        <button class="hero-btn" data-action="goHome">← العودة</button>
                        <div class="features-grid" style="margin-top:20px">
                            ${list.map(l => `
                                <div class="feature-card" data-action="selLesson" data-param="${l.id}">
                                    <h3>${l.title}</h3>
                                    <p>${l.description || ''}</p>
                                </div>`).join('')}
                        </div>
                    </main>`;

            case 'custom_view':
                return `
                    <main class="main-content">
                        <button class="hero-btn" data-action="goHome">← العودة</button>
                        <div class="features-grid" style="margin-top:20px">
                            ${Object.entries(this.customLessons).map(([id, l]) => `
                                <div class="feature-card">
                                    <h3 data-action="selLesson" data-param="${id}">${l.title}</h3>
                                    <button class="nav-btn" style="background:#ef4444; margin-top:10px" data-action="deleteCustom" data-param="${id}">حذف</button>
                                </div>`).join('')}
                        </div>
                    </main>`;

            case 'reading':
                return `
                    <main class="main-content">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <button class="hero-btn" data-action="selLevel" data-param="${this.selectedLevel}">← قائمة الدروس</button>
                        </div>
                        <div class="reading-card shadow">
                            <h2 style="margin-bottom:15px; color:#1e40af; text-align:right; direction:rtl;">${lesson.title}</h2>
                            <div class="text-body">${lesson.content.replace(/\n/g, '<br>')}</div>
                        </div>
                    </main>`;

            case 'flashcards':
                if (!activeTerms.length) return `<main class="main-content"><div class="reading-card" style="text-align:center"><h2>🎉 مبروك! ختمت الكلمات.</h2><button class="hero-btn" data-action="setPage" data-param="reading">عودة للنص</button></div></main>`;
                const t = activeTerms[this.currentCardIndex] || activeTerms[0];
                return `
                    <main class="main-content">
                        <div class="card-progress">الكلمة ${this.currentCardIndex + 1} من ${activeTerms.length}</div>
                        <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                            <div class="flashcard">
                                <div class="flashcard-front"><h1>${t.english}</h1><p>انقر للترجمة</p></div>
                                <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                            </div>
                        </div>
                        <div class="card-controls">
                            <button class="action-btn speak" data-action="speak" data-param="${t.english}">🔊 نطق</button>
                            <button class="action-btn master" data-action="masterWord" data-param="${t.id}">✅ حفظت</button>
                        </div>
                        <div class="nav-controls">
                            <button class="hero-btn" data-action="prevC">السابق</button>
                            <button class="hero-btn" data-action="nextC" data-total="${activeTerms.length}">التالي</button>
                        </div>
                    </main>`;
        }
    }
}

// البدء الرسمي
window.app = new App();
