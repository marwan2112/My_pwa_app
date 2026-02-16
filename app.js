const app = {
    init() {
        this.renderHome();
    },

    renderHome() {
        const appDiv = document.getElementById('app');
        let levelsHtml = levels.map(level => `
            <div class="level-card" onclick="app.showLessons('${level.id}')">
                <div class="level-icon">${level.icon}</div>
                <h2>${level.name}</h2>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <div class="header">
                <h1>المصطلحات السياسية والقانونية</h1>
                <p>تعلم المصطلحات من خلال النصوص السياقية</p>
                <button class="flashcards-main-btn" onclick="app.showFlashcards()">🗂️ بطاقات الاستذكار الخاصة بي</button>
            </div>
            <div class="levels-grid">
                ${levelsHtml}
            </div>
        `;
    },

    showLessons(levelId) {
        const appDiv = document.getElementById('app');
        const lessons = lessonsList[levelId] || [];

        let lessonsHtml = lessons.map(lesson => `
            <div class="lesson-card" onclick="app.viewLesson('${lesson.id}', '${levelId}')">
                <h3>${lesson.title}</h3>
                <p>${lesson.description}</p>
                <div class="lesson-footer">اضغط للقراءة والتعلم ←</div>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <div class="nav-bar">
                <button class="back-btn" onclick="app.renderHome()">🏠 الرئيسية</button>
                <h2>${levels.find(l => l.id === levelId).name}</h2>
            </div>
            <div class="lessons-container">
                ${lessonsHtml}
            </div>
        `;
    },

    viewLesson(lessonId, levelId) {
        const appDiv = document.getElementById('app');
        const lesson = lessonsData[lessonId];
        
        if (!lesson) return;

        // استخراج الكلمات من قائمة المصطلحات لهذا الدرس
        const terms = termsList[lessonId] || [];

        appDiv.innerHTML = `
            <div class="nav-bar">
                <button class="back-btn" onclick="app.showLessons('${levelId}')">🔙 عودة للقائمة</button>
            </div>
            <div class="content-wrapper">
                <h1 class="lesson-full-title">${lesson.title}</h1>
                <div class="article-body">
                    ${lesson.content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
                </div>
                
                <div class="vocabulary-section">
                    <h3>💡 مصطلحات النص (اضغط للإضافة للبطاقات)</h3>
                    <div class="terms-list">
                        ${terms.map(t => `
                            <div class="term-item">
                                <div class="term-texts">
                                    <span class="en">${t.english}</span>
                                    <span class="ar">${t.arabic}</span>
                                </div>
                                <button class="add-word-btn" onclick="app.addToFlashcards('${t.english}', '${t.arabic}')">➕</button>
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
            alert('✅ تمت الإضافة للبطاقات');
        } else {
            alert('الكلمة موجودة مسبقاً');
        }
    },

    showFlashcards() {
        const appDiv = document.getElementById('app');
        const cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');

        let cardsHtml = cards.map((c, i) => `
            <div class="flashcard-obj" onclick="this.classList.toggle('is-flipped')">
                <div class="card-face card-front">${c.en}</div>
                <div class="card-face card-back">${c.ar}</div>
                <button class="del-card" onclick="app.removeCard(${i}); event.stopPropagation();">×</button>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <div class="nav-bar">
                <button class="back-btn" onclick="app.renderHome()">🔙 الرئيسية</button>
                <h2>بطاقات الاستذكار</h2>
            </div>
            <div class="cards-grid">
                ${cards.length > 0 ? cardsHtml : '<p class="empty-state">لا يوجد كلمات مضافة بعد. ابدأ بإضافة الكلمات من النصوص!</p>'}
            </div>
        `;
    },

    removeCard(index) {
        let cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        cards.splice(index, 1);
        localStorage.setItem('myFlashcards', JSON.stringify(cards));
        this.showFlashcards();
    }
};

app.init();
