class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLesson = null;
    this.currentCardIndex = 0;
    this.init();
  }

  init() { this.render(); this.setupEventListeners(); }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const { action, param } = target.dataset;
      this[action]?.(param);
    });
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.renderHeader() + this.renderContent();
  }

  renderHeader() {
    // لا تظهر أزرار الدراسة إلا إذا تم اختيار درس
    const showNav = this.selectedLesson !== null;
    const navButtons = showNav ? [
      { label: 'النص', action: 'goReading', page: 'reading' },
      { label: 'البطاقات', action: 'goFlashcards', page: 'flashcards' },
      { label: 'الاختبار', action: 'goQuiz', page: 'quiz' }
    ] : [];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title" data-action="goHome" style="cursor:pointer">
            <span>English Booster</span>
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
    if (this.currentPage === 'home') return this.renderLevels();
    if (this.currentPage === 'lessons') return this.renderLessonsList();
    if (this.currentPage === 'reading') return this.renderReading();
    if (this.currentPage === 'flashcards') return this.renderFlashcards();
    return this.renderLevels();
  }

  // 1. عرض المستويات (مبتدئ/متوسط/متقدم)
  renderLevels() {
    return `
      <main class="main-content">
        <div class="hero"><h1>اختر مستواك التعليمي</h1></div>
        <div class="features-grid">
          ${levels.map(lvl => `
            <div class="feature-card" data-action="selectLevel" data-param="${lvl.id}">
              <div style="font-size:3rem">${lvl.icon}</div>
              <h3>${lvl.name}</h3>
            </div>
          `).join('')}
        </div>
      </main>`;
  }

  // 2. عرض دروس المستوى المختار
  renderLessonsList() {
    const levelLessons = getLessonsByLevel(this.selectedLevel);
    return `
      <main class="main-content">
        <button class="hero-btn" data-action="goHome" style="margin-bottom:1rem">← العودة للمستويات</button>
        <div class="features-grid">
          ${levelLessons.map(les => `
            <div class="feature-card" data-action="selectLesson" data-param="${les.id}">
              <h3>${les.title}</h3>
              <p>${les.description}</p>
            </div>
          `).join('')}
        </div>
      </main>`;
  }

  // 3. عرض النص الخاص بالدرس
  renderReading() {
    const textData = getReadingTextByLesson(this.selectedLesson);
    return `
      <div class="main-content">
        <div class="exercise-card">
          <h2>${textData.title}</h2>
          <div style="text-align:left; line-height:1.8; font-family:'Poppins';">${textData.content}</div>
        </div>
      </div>`;
  }

  // وظائف التنقل
  selectLevel(id) { this.selectedLevel = id; this.currentPage = 'lessons'; this.render(); }
  selectLesson(id) { 
    this.selectedLesson = id; 
    this.currentPage = 'reading'; 
    this.render(); 
  }
  goHome() { 
    this.selectedLevel = null; 
    this.selectedLesson = null; 
    this.currentPage = 'home'; 
    this.render(); 
  }
  goReading() { this.currentPage = 'reading'; this.render(); }
  goFlashcards() { this.currentPage = 'flashcards'; this.currentCardIndex = 0; this.render(); }
}

new App();
