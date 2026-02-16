const app = {
    init() {
        this.renderHome();
    },

    renderHome() {
        const appDiv = document.getElementById('app');
        let levelsHtml = levels.map(level => `
            <div class="level-card" onclick="app.showLessons('${level.id}')">
                <span class="level-icon">${level.icon}</span>
                <h2>${level.name}</h2>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <header class="app-header">
                <h1>المصطلحات السياسية والقانونية</h1>
                <p>اختر المستوى لبدء التعلم</p>
                <button class="nav-btn" onclick="app.showFlashcards()">🗂️ بطاقات الكلمات</button>
            </header>
            <main class="levels-container">
                ${levelsHtml}
            </main>
        `;
    },

    showLessons(levelId) {
        const appDiv = document.getElementById('app');
        const lessons = lessonsList[levelId] || [];

        let lessonsHtml = lessons.map(lesson => `
            <div class="lesson-item" onclick="app.showFullText('${lesson.id}', '${levelId}')">
                <div class="lesson-info">
                    <h3>${lesson.title}</h3>
                    <p>${lesson.description}</p>
                </div>
                <span class="arrow">←</span>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <header class="app-header small">
                <button class="back-btn" onclick="app.renderHome()">🔙 الرئيسية</button>
                <h1>${levels.find(l => l.id === levelId).name}</h1>
            </header>
            <main class="lessons-list">
                ${lessonsHtml}
            </main>
        `;
    },

    showFullText(lessonId, levelId) {
        const appDiv = document.getElementById('app');
        const data = lessonsData[lessonId];
        
        // جلب الكلمات الخاصة بهذا النص من قائمة المصطلحات
        const terms = termsList[lessonId] || [];

        if (!data) return;

        let termsHtml = terms.map(term => `
            <div class="term-box">
                <span><strong>${term.english}:</strong> ${term.arabic}</span>
                <button class="add-btn" onclick="app.addToFlashcards('${term.english}', '${term.arabic}')">➕ أضف للبطاقات</button>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <header class="app-header small">
                <button class="back-btn" onclick="app.showLessons('${levelId}')">🔙 القائمة</button>
            </header>
            <article class="content-view">
                <h1 class="text-title">${data.title}</h1>
                <div class="text-body">
                    ${data.content.replace(/\n/g, '<br>')}
                </div>
                
                ${terms.length > 0 ? `
                <section class="terms-section">
                    <h3>المصطلحات الهامة:</h3>
                    <div class="terms-grid">${termsHtml}</div>
                </section>` : ''}
            </article>
        `;
        window.scrollTo(0, 0);
    },

    addToFlashcards(en, ar) {
        let saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (!saved.some(item => item.en === en)) {
            saved.push({ en, ar });
            localStorage.setItem('myFlashcards', JSON.stringify(saved));
            alert('تمت إضافة الكلمة إلى بطاقاتك! ✅');
        } else {
            alert('الكلمة موجودة مسبقاً في بطاقاتك.');
        }
    },

    showFlashcards() {
        const appDiv = document.getElementById('app');
        const saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');

        let cardsHtml = saved.map((card, index) => `
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
                <div class="card-inner">
                    <div class="card-front">${card.en}</div>
                    <div class="card-back">${card.ar}</div>
                </div>
                <button class="delete-btn" onclick="app.deleteCard(${index}); event.stopPropagation();">🗑️</button>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <header class="app-header small">
                <button class="back-btn" onclick="app.renderHome()">🔙 الرئيسية</button>
                <h1>بطاقات الاستذكار</h1>
            </header>
            <main class="flashcards-container">
                ${saved.length > 0 ? cardsHtml : '<p class="empty-msg">لا توجد كلمات مضافة بعد.</p>'}
            </main>
        `;
    },

    deleteCard(index) {
        let saved = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        saved.splice(index, 1);
        localStorage.setItem('myFlashcards', JSON.stringify(saved));
        this.showFlashcards();
    }
};

window.onload = () => app.init();
