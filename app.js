// تطبيق المصطلحات السياسية والقانونية - PWA
class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedBatch = 1;
    this.currentCardIndex = 0;
    this.quizScore = 0;
    this.quizIndex = 0;
    this.matchedPairs = new Set();
    this.exerciseIndex = 0;
    this.exerciseScore = 0;
    this.selectedAnswer = null;
    this.answered = false;
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (target) {
        const action = target.dataset.action;
        const param = target.dataset.param;
        if (typeof this[action] === 'function') {
          this[action](param);
        }
      }
    });
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.renderHeader() + this.renderContent();
  }

  renderHeader() {
    const navButtons = [
      { label: 'الرئيسية', action: 'goHome', page: 'home' },
      { label: 'النص', action: 'goReading', page: 'reading' },
      { label: 'البطاقات', action: 'goFlashcards', page: 'flashcards' },
      { label: 'الاختبار', action: 'goQuiz', page: 'quiz' },
      { label: 'المطابقة', action: 'goMatching', page: 'matching' },
      { label: 'التمارين', action: 'goExercises', page: 'exercises' }
    ];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title" data-action="goHome" style="cursor:pointer">
            <span class="header-icon">📚</span>
            <span>المصطلحات السياسية</span>
          </div>
          <nav class="nav-menu">
            ${navButtons.map(btn => `
              <button class="nav-btn ${this.currentPage === btn.page ? 'active' : ''}" data-action="${btn.action}">
                ${btn.label}
              </button>
            `).join('')}
          </nav>
        </div>
      </header>
    `;
  }

  renderContent() {
    switch (this.currentPage) {
      case 'home': return this.renderHome();
      case 'reading': return this.renderReading();
      case 'flashcards': return this.renderFlashcards();
      case 'quiz': return this.renderQuiz();
      case 'matching': return this.renderMatching();
      case 'exercises': return this.renderExercises();
      default: return this.renderHome();
    }
  }

  // التنقل
  goHome() { this.currentPage = 'home'; this.render(); }
  goReading() { this.currentPage = 'reading'; this.render(); }
  goFlashcards() { this.currentPage = 'flashcards'; this.currentCardIndex = 0; this.render(); }
  goQuiz() { this.currentPage = 'quiz'; this.quizIndex = 0; this.quizScore = 0; this.render(); }
  goMatching() { this.currentPage = 'matching'; this.matchedPairs.clear(); this.render(); }
  goExercises() { this.currentPage = 'exercises'; this.exerciseIndex = 0; this.exerciseScore = 0; this.render(); }

  selectBatch(id) {
    this.selectedBatch = parseInt(id);
    this.goReading(); // ينتقل للنص مباشرة عند اختيار المجموعة
  }

  renderHome() {
    return `
      <main class="main-content">
        <div class="hero card-enter">
          <h1>تعلم المصطلحات السياسية والقانونية</h1>
          <p>طور مهاراتك اللغوية من خلال منهجية تعليمية متكاملة</p>
        </div>
        <div class="features-grid">
          ${batches.map(batch => `
            <div class="feature-card card-enter" style="cursor: pointer;" data-action="selectBatch" data-param="${batch.id}">
              <div class="feature-icon">${batch.id === 1 ? '⚖️' : '💰'}</div>
              <h3>${batch.name}</h3>
              <p>${batch.description}</p>
              <button class="hero-btn" style="margin-top: 1rem; width: 100%;">ابدأ الآن</button>
            </div>
          `).join('')}
        </div>
      </main>`;
  }

  renderReading() {
    const textData = getReadingTextByBatch(this.selectedBatch);
    if (!textData) return '<div class="main-content"><div class="hero"><h1>قريباً</h1><p>النص غير متوفر لهذه المجموعة.</p><button class="hero-btn" data-action="goHome">العودة</button></div></div>';
    return `
      <div class="main-content page-enter">
        <div class="quiz-header">
            <h1>Reading Analysis</h1>
            <p>حلل المصطلحات داخل السياق</p>
        </div>
        <div class="exercise-card card-enter" style="text-align: left; max-width: 850px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #1e40af; margin-bottom: 1.5rem; font-family: 'Poppins'; border-bottom: 2px solid #eee; padding-bottom: 10px;">${textData.title}</h2>
          <div style="font-family: 'Poppins'; line-height: 1.8; font-size: 1.15rem; color: #334155; white-space: pre-line;">${textData.content}</div>
        </div>
        <div style="margin-top:2rem; text-align:center;">
            <button class="hero-btn" data-action="goFlashcards">الذهاب للبطاقات ←</button>
        </div>
      </div>`;
  }

  renderFlashcards() {
    const batchTerms = getTermsByBatch(this.selectedBatch);
    if (batchTerms.length === 0) return '<div class="main-content">لا توجد بيانات.</div>';
    const term = batchTerms[this.currentCardIndex];
    return `
      <div class="main-content">
        <div class="flashcard-container card-enter" onclick="this.classList.toggle('flipped')">
          <div class="flashcard">
            <div class="flashcard-front"><div class="flashcard-english">${term.english}</div><div class="tap-hint">اضغط للترجمة</div></div>
            <div class="flashcard-back"><div class="flashcard-arabic">${term.arabic}</div></div>
          </div>
        </div>
        <div class="controls">
          <button class="nav-btn" data-action="prevCard">السابق</button>
          <span>${this.currentCardIndex + 1} / ${batchTerms.length}</span>
          <button class="nav-btn" data-action="nextCard">التالي</button>
        </div>
      </div>`;
  }

  nextCard() {
    const batchTerms = getTermsByBatch(this.selectedBatch);
    if (this.currentCardIndex < batchTerms.length - 1) { this.currentCardIndex++; this.render(); }
  }
  prevCard() { if (this.currentCardIndex > 0) { this.currentCardIndex--; this.render(); } }

  // الأقسام الأخرى (تبسيط للعمل)
  renderQuiz() { return '<div class="main-content"><div class="hero"><h1>قسم الاختبار</h1><p>سيتم ربط أسئلة المجموعة المختار هنا.</p><button class="hero-btn" data-action="goHome">العودة</button></div></div>'; }
  renderMatching() { return '<div class="main-content"><div class="hero"><h1>لعبة المطابقة</h1><p>طابق الكلمات بمعانيها.</p><button class="hero-btn" data-action="goHome">العودة</button></div></div>'; }
  renderExercises() { return '<div class="main-content"><div class="hero"><h1>تمارين ملء الفراغ</h1><p>اختبر مهاراتك في الجمل.</p><button class="hero-btn" data-action="goHome">العودة</button></div></div>'; }
}

// تشغيل التطبيق
window.onload = () => { new App(); };
