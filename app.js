class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedBatch = 1;
    this.currentCardIndex = 0;
    this.masteredWords = new Set();
    this.quizScore = 0;
    this.quizTotal = 0;
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
        this[action]?.(param);
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
      { label: 'تمارين', action: 'goExercises', page: 'exercises' }
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

  // --- Functions for Reading Page ---
  goReading() { this.currentPage = 'reading'; this.render(); }
  renderReading() {
    const textData = getReadingTextByBatch(this.selectedBatch);
    if (!textData) return '<div class="main-content"><p>لا يوجد نص متاح.</p></div>';
    return `
      <div class="main-content page-enter">
        <div class="quiz-header"><h1>Reading Analysis</h1><p>تحليل النص</p></div>
        <div class="exercise-card card-enter" style="text-align: left; max-width: 800px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #1e40af; margin-bottom: 1.5rem; font-family: 'Poppins';">${textData.title}</h2>
          <div style="font-family: 'Poppins'; line-height: 1.8; font-size: 1.1rem; color: #334155; white-space: pre-line;">${textData.content}</div>
        </div>
        <div style="margin-top:20px; text-align:center;"><button class="hero-btn" data-action="goFlashcards">ابدأ البطاقات</button></div>
      </div>`;
  }

  // --- Rest of Pages (Home, Flashcards, etc.) ---
  goHome() { this.currentPage = 'home'; this.render(); }
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

  selectBatch(id) {
    this.selectedBatch = parseInt(id);
    this.goReading();
  }

  // Flashcards
  goFlashcards() { this.currentPage = 'flashcards'; this.currentCardIndex = 0; this.render(); }
  renderFlashcards() {
    const batchTerms = getTermsByBatch(this.selectedBatch);
    if (batchTerms.length === 0) return '<div class="main-content">لا توجد بطاقات متاحة حالياً.</div>';
    const term = batchTerms[this.currentCardIndex];
    return `
      <div class="main-content">
        <div class="flashcard-container card-enter" onclick="this.classList.toggle('flipped')">
          <div class="flashcard">
            <div class="flashcard-front"><div class="flashcard-english">${term.english}</div><div class="tap-hint">اضغط للترجمة</div></div>
            <div class="flashcard-back"><div class="flashcard-arabic">${term.arabic}</div></div>
          </div>
        </div>
        <div class="controls"><button class="nav-btn" data-action="prevCard">السابق</button><span>${this.currentCardIndex + 1} / ${batchTerms.length}</span><button class="nav-btn" data-action="nextCard">التالي</button></div>
      </div>`;
  }

  nextCard() {
    const batchTerms = getTermsByBatch(this.selectedBatch);
    if (this.currentCardIndex < batchTerms.length - 1) { this.currentCardIndex++; this.render(); }
  }
  prevCard() { if (this.currentCardIndex > 0) { this.currentCardIndex--; this.render(); } }

  // Other Sections (Quiz, Matching, Exercises - Minimal Implementation for length)
  goQuiz() { this.currentPage = 'quiz'; this.render(); }
  renderQuiz() { return '<div class="main-content"><h2>قسم الاختبار قيد التطوير</h2></div>'; }
  goMatching() { this.currentPage = 'matching'; this.render(); }
  renderMatching() { return '<div class="main-content"><h2>قسم المطابقة قيد التطوير</h2></div>'; }
  goExercises() { this.currentPage = 'exercises'; this.render(); }
  renderExercises() { return '<div class="main-content"><h2>قسم التمارين قيد التطوير</h2></div>'; }
}

new App();
