const app = {
    init() {
        this.renderHome();
    },

    renderHome() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="main-header">
                <h1>📚 قاموس المصطلحات التفاعلي</h1>
                <p>تعلم واحفظ بذكاء</p>
                <div class="main-nav-buttons">
                    <button class="action-btn" style="background:#fff; color:#1e40af" onclick="app.showFlashcards()">🗂️ بطاقاتي</button>
                    <button class="action-btn" style="background:#f59e0b; color:white" onclick="app.startQuiz()">🧠 اختبار</button>
                </div>
            </div>
            <div class="levels-container">
                ${levels.map(level => `
                    <div class="level-box" onclick="app.showLessons('${level.id}')">
                        <div class="level-icon">${level.icon}</div>
                        <div class="level-info">
                            <h2>${level.name}</h2>
                            <span>استكشف الدروس ←</span>
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
                ${lessons.map(l => `
                    <div class="lesson-card-fixed" onclick="app.viewLesson('${l.id}', '${levelId}')">
                        <h3>${l.title}</h3>
                        <p>${l.description}</p>
                        <div class="card-hint">ابدأ القراءة ←</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    viewLesson(lessonId, levelId) {
        const appDiv = document.getElementById('app');
        const lesson = lessonsData[lessonId];
        if(!lesson) return;

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
                    <h3>📌 مصطلحات هامة (اضغط للإضافة)</h3>
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
        let cards = JSON.parse(localStorage.getItem('myFlashcards') || '[]');
        if (!cards.some(c => c.en === en)) {
            cards.push({ en, ar });
            localStorage.setItem('myFlashcards', JSON.stringify(cards));
            alert('✅ تمت إضافة الكلمة لبطاقاتك');
        } else {
            alert('الكلمة موجودة مسبقاً');
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
                `).join('') : '<p style="text-align:center; padding:20px; grid-column:1/3">لا توجد كلمات مضافة بعد.</p>'}
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
        if (cards.length < 1) {
            alert('أضف كلمات أولاً لبدء الاختبار!');
            return;
        }
        this.runQuiz(0, cards);
    },

    runQuiz(index, cards) {
        if (index >= cards.length) {
            alert('انتهى الاختبار! 🎉');
            this.renderHome();
            return;
        }
        const appDiv = document.getElementById('app');
        const current = cards[index];
        
        appDiv.innerHTML = `
            <div class="quiz-container" style="padding:40px; text-align:center">
                <div style="font-size:1.2rem; color:#64748b">ما ترجمة:</div>
                <h1 style="font-size:2.5rem; color:#1e40af; margin:20px 0">${current.en}</h1>
                <input type="text" id="quiz-answer" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:12px; text-align:center; font-size:1.2rem" placeholder="اكتب بالعربي هنا..." autofocus>
                <button class="action-btn" style="background:#1e40af; color:white; width:100%; margin-top:20px; font-size:1.1rem" onclick="app.checkAnswer(${index}, '${current.ar}', ${JSON.stringify(cards).replace(/"/g, '&quot;')})">تحقق من الإجابة</button>
            </div>
        `;
    },

    checkAnswer(index, correct, cards) {
        const input = document.getElementById('quiz-answer').value.trim();
        if (input === correct) {
            alert('إجابة صحيحة! 🎉');
            this.runQuiz(index + 1, cards);
        } else {
            alert('خطأ، الإجابة الصحيحة هي: ' + correct);
            this.runQuiz(index + 1, cards);
        }
    }
};

app.init();
