const app = {
    init() {
        this.renderHome();
    },

    renderHome() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="main-header">
                <h1>📚 قاموس المصطلحات التفاعلي</h1>
                <p>تعلم المصطلحات من خلال النصوص السياقية</p>
                <div class="main-nav-buttons">
                    <button class="action-btn flash-btn" onclick="app.showFlashcards()">🗂️ بطاقات الاستذكار</button>
                    <button class="action-btn quiz-btn" onclick="app.startQuiz()">🧠 اختبار البطاقات</button>
                </div>
            </div>
            <div class="levels-container">
                ${levels.map(level => `
                    <div class="level-box" onclick="app.showLessons('${level.id}')">
                        <div class="level-icon">${level.icon}</div>
                        <div class="level-info">
                            <h2>${level.name}</h2>
                            <span>اضغط لاستعراض الدروس</span>
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
                        <div class="card-hint">اقرأ النص وتعلم ←</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    viewLesson(lessonId, levelId) {
        const appDiv = document.getElementById('app');
        const lesson = lessonsData[lessonId];
        if (!lesson) return;

        appDiv.innerHTML = `
            <div class="top-bar">
                <button class="back-link" onclick="app.showLessons('${levelId}')">🔙 القائمة</button>
            </div>
            <div class="reader-container">
                <h1 class="reader-title">${lesson.title}</h1>
                <div class="reader-content">
                    ${lesson.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                <div class="vocab-section">
                    <h3>📌 مصطلحات النص (اضغط للإضافة للبطاقات)</h3>
                    <div class="vocab-list">
                        ${(lesson.terms || []).map(term => `
                            <div class="vocab-item">
                                <div class="vocab-text">
                                    <span class="en"><strong>${term.english}</strong></span>
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
        let saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (!saved.some(item => item.en === en)) {
            saved.push({ en, ar });
            localStorage.setItem('myFlashcards', JSON.stringify(saved));
            alert('✅ تمت الإضافة لبطاقاتك!');
        } else {
            alert('الكلمة موجودة مسبقاً');
        }
    },

    showFlashcards() {
        const appDiv = document.getElementById('app');
        const saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');

        appDiv.innerHTML = `
            <div class="top-bar">
                <button class="back-link" onclick="app.renderHome()">🏠 الرئيسية</button>
                <h2>🗂️ بطاقات الاستذكار</h2>
            </div>
            <div class="flashcards-grid">
                ${saved.length > 0 ? saved.map((card, index) => `
                    <div class="flip-card" onclick="this.classList.toggle('flipped')">
                        <div class="flip-card-inner">
                            <div class="flip-card-front">${card.en}</div>
                            <div class="flip-card-back">${card.ar}</div>
                        </div>
                        <button class="remove-btn" onclick="app.removeCard(${index}); event.stopPropagation();">×</button>
                    </div>
                `).join('') : '<p style="grid-column: 1 / -1; text-align: center; padding: 20px;">لم تضف أي كلمات بعد.</p>'}
            </div>
        `;
    },

    removeCard(index) {
        let saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        saved.splice(index, 1);
        localStorage.setItem('myFlashcards', JSON.stringify(saved));
        this.showFlashcards();
    },

    startQuiz() {
        const saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (saved.length === 0) {
            alert('أضف بعض الكلمات أولاً لبدء الاختبار!');
            return;
        }
        this.runQuiz(0, saved);
    },

    runQuiz(index, cards) {
        if (index >= cards.length) {
            alert('أحسنت! انتهى الاختبار.');
            this.renderHome();
            return;
        }
        const appDiv = document.getElementById('app');
        const current = cards[index];

        appDiv.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-progress">سؤال ${index + 1} من ${cards.length}</div>
                <div class="quiz-question">ما معنى المصطلح التالي؟</div>
                <h2 class="quiz-word">${current.en}</h2>
                <input type="text" id="quiz-input" placeholder="اكتب الترجمة بالعربية..." autofocus>
                <button class="check-btn" onclick="app.checkAnswer(${index}, '${current.ar}', ${JSON.stringify(cards).replace(/"/g, '&quot;')})">تحقق من الإجابة</button>
            </div>
        `;
    },

    checkAnswer(index, correct, cards) {
        const input = document.getElementById('quiz-input').value.trim();
        if (input === correct) {
            alert('إجابة صحيحة! 🎉');
            this.runQuiz(index + 1, cards);
        } else {
            alert('إجابة خاطئة. الإجابة الصحيحة هي: ' + correct);
            this.runQuiz(index + 1, cards);
        }
    }
};

app.init();
