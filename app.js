// المحرك الأساسي للتطبيق - app.js
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
            <div class="lesson-item" onclick="app.showFullText('${lesson.id}')">
                <div class="lesson-info">
                    <h3>${lesson.title}</h3>
                    <p>${lesson.description}</p>
                </div>
                <span class="arrow">←</span>
            </div>
        `).join('');

        appDiv.innerHTML = `
            <header class="app-header small">
                <button class="back-btn" onclick="app.renderHome()">🔙 عودة للرئيسية</button>
                <h1>${levels.find(l => l.id === levelId).name}</h1>
            </header>
            <main class="lessons-list">
                ${lessonsHtml || '<p class="empty-msg">سيتم إضافة المحتوى قريباً</p>'}
            </main>
        `;
    },

    showFullText(lessonId) {
        const appDiv = document.getElementById('app');
        const data = lessonsData[lessonId];

        if (!data) return;

        // تحويل الفواصل السطرية \n في النص الأصلي إلى <br> ليعرضها المتصفح كفقرات
        const formattedContent = data.content.replace(/\n/g, '<br>');

        appDiv.innerHTML = `
            <header class="app-header small">
                <button class="back-btn" onclick="history.back()">🔙 عودة للقائمة</button>
            </header>
            <article class="content-view">
                <h1 class="text-title">${data.title}</h1>
                <hr>
                <div class="text-body">
                    ${formattedContent}
                </div>
            </article>
            <div class="bottom-nav">
                <button class="btn-primary" onclick="app.renderHome()">الرئيسية</button>
            </div>
        `;
        window.scrollTo(0, 0);
    }
};

// تشغيل التطبيق عند التحميل
window.onload = () => app.init();

// تفعيل زر العودة في المتصفح
window.onpopstate = () => {
    const appDiv = document.getElementById('app');
    if (appDiv.querySelector('.content-view')) {
        // إذا كان داخل نص، يعود للقائمة (مستوى متقدم مثلاً)
        app.showLessons('advanced');
    } else {
        app.renderHome();
    }
};
