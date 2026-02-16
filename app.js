const app = {
    init() {
        this.renderHome();
    },

    renderHome() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="main-header">
                <h1>📚 قاموس المصطلحات التفاعلي</h1>
                <p>طوّر لغتك السياسية والقانونية بأسلوب ذكي</p>
                <div class="main-nav-buttons">
                    <button class="action-btn flash-btn" onclick="app.showFlashcards()">🗂️ بطاقاتي الخاصة</button>
                    <button class="action-btn quiz-btn" onclick="app.startQuiz()">🧠 اختبار البطاقات</button>
                </div>
            </div>
            <div class="levels-container">
                ${levels.map(level => `
                    <div class="level-box" onclick="app.showLessons('${level.id}')">
                        <div class="level-icon">${level.icon}</div>
                        <div class="level-info">
                            <h2>${level.name}</h2>
                            <span>استكشف الدروس والمصطلحات</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    showLessons(levelId) {
        const appDiv = document.getElementById('app');
        const lessons = lessonsList[levelId] || [];
        const levelName = levels.find(l => l.id === levelId).name;

        appDiv.innerHTML = `
            <div class="top-bar">
                <button class="back-link" onclick="app.renderHome()">🔙 الرئيسية</button>
                <h2>${levelName}</h2>
            </div>
            <div class="lessons-grid">
                ${lessons.map(lesson => `
                    <div class="lesson-card-fixed" onclick="app.viewLesson('${lesson.id}', '${levelId}')">
                        <h3>${lesson.title}</h3>
                        <p>${lesson.description}</p>
                        <div class="card-hint">ابدأ التعلم الآن ←</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    viewLesson(lessonId, levelId) {
        const appDiv = document.getElementById('app');
        const lesson = lessonsData[lessonId];
        if (!lesson) return;

        // ميزة إضافة الكلمات للبطاقات
        appDiv.innerHTML = `
            <div class="top-bar">
                <button class="back-link" onclick="app.showLessons('${levelId}')">🔙 قائمة الدروس</button>
            </div>
            <div class="reader-container">
                <h1 class="reader-title">${lesson.title}</h1>
                <div class="reader-content">
                    ${lesson.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                <div class="vocab-section">
                    <h3>📌 مصطلحات هامة (اضغط للإضافة)</h3>
                    <div class="vocab-list">
                        ${(lesson.terms || []).map(term => `
                            <div class="vocab-item">
                                <div class="vocab-text">
                                    <span class="en">${term.english}</span>
                                    <span class="ar">${term.arabic}</span>
                                </div>
                                <button class="add-to-flash-btn" onclick="app.addToFlashcards('${term.english}', '${term.arabic}')">➕</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        window.scrollTo(0, 0);
    },

    addToFlashcards(en, ar) {
        let cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (!cards.some(c => c.en === en)) {
            cards.push({ en, ar });
            localStorage.setItem('myFlashcards', JSON.stringify(cards));
            alert('✅ تمت إضافة "' + en + '" إلى بطاقاتك');
        } else {
            alert('الكلمة موجودة بالفعل');
        }
    },

    showFlashcards() {
        const appDiv = document.getElementById('app');
        const cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');

        appDiv.innerHTML = `
            <div class="top-bar">
                <button class="back-link" onclick="app.renderHome()">🏠 الرئيسية</button>
                <h2>🗂️ بطاقاتي الاستذكارية</h2>
            </div>
            <div class="flashcards-grid">
                ${cards.length > 0 ? cards.map((c, i) => `
                    <div class="flip-card" onclick="this.classList.toggle('flipped')">
                        <div class="flip-card-inner">
                            <div class="flip-card-front">${c.en}</div>
                            <div class="flip-card-back">${c.ar}</div>
                        </div>
                        <button class="remove-btn" onclick="app.removeCard(${i}); event.stopPropagation();">×</button>
                    </div>
                `).join('') : '<p class="empty-text">لا توجد كلمات مضافة. اذهب للدروس وأضف كلماتك الأولى!</p>'}
            </div>
        `;
    },

    removeCard(index) {
        let cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        cards.splice(index, 1);
        localStorage.setItem('myFlashcards', JSON.stringify(cards));
        this.showFlashcards();
    },

    startQuiz() {
        const cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (cards.length < 2) {
            alert('أضف كلمتين على الأقل لبدء الاختبار!');
            return;
        }
        this.renderQuiz(0, cards);
    },

    renderQuiz(index, cards) {
        if (index >= cards.length) {
            alert('انتهى الاختبار! أحسنت.');
            this.showFlashcards();
            return;
        }
        const appDiv = document.getElementById('app');
        const current = cards[index];
        
        appDiv.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">اختبر نفسك (${index + 1}/${cards.length})</div>
                <div class="quiz-question">${current.en}</div>
                <input type="text" id="quiz-answer" placeholder="اكتب الترجمة بالعربية هنا..." autofocus>
                <button class="check-btn" onclick="app.checkAnswer(${index}, '${current.ar}', ${JSON.stringify(cards).replace(/"/g, '&quot;')})">تحقق</button>
                <button class="skip-btn" onclick="app.renderQuiz(${index + 1}, ${JSON.stringify(cards).replace(/"/g, '&quot;')})">تخطي</button>
            </div>
        `;
    },

    checkAnswer(index, correct, cards) {
        const input = document.getElementById('quiz-answer').value.trim();
        if (input === correct) {
            alert('إجابة صحيحة! 🎉');
            this.renderQuiz(index + 1, cards);
        } else {
            alert('للأسف خطأ، الإجابة هي: ' + correct);
        }
    }
};

app.init();
