class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.init();
  }

  init() { this.render(); this.setupEventListeners(); }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (target) {
        const { action, param } = target.dataset;
        this[action]?.(param);
      }
    });
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.renderHeader() + this.renderContent();
  }

  renderHeader() {
    const isInsideLesson = this.selectedLessonId !== null;
    const navButtons = isInsideLesson ? [
        { label: 'النص', action: 'setPage', page: 'reading' },
        { label: 'البطاقات', action: 'setPage', page: 'flashcards' },
        { label: 'الاختبار', action: 'setPage', page: 'quiz' },
        { label: 'تمارين', action: 'setPage', page: 'exercises' }
    ] : [];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title" data-action="goHome"><span>English Booster</span></div>
          <nav class="nav-menu">
            ${navButtons.map(btn => `
              <button class="nav-btn ${this.currentPage === btn.page ? 'active' : ''}" data-action="${btn.action}" data-param="${btn.page}">
                ${btn.label}
              </button>
            `).join('')}
          </nav>
        </div>
      </header>`;
  }

  renderContent() {
    switch (this.currentPage) {
      case 'home': return this.renderLevels();
      case 'lessons': return this.renderLessonsList();
      case 'reading': return this.renderReading();
      case 'flashcards': return this.renderFlashcards();
      case 'quiz': return this.renderQuiz();
      case 'exercises': return this.renderExercises();
      default: return this.renderLevels();
    }
  }

  // --- شاشات العرض ---
  renderLevels() {
    return `<main class="main-content"><div class="hero"><h1>اختر مستواك</h1></div>
      <div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selectLevel" data-param="${l.id}">
      <div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
  }

  renderLessonsList() {
    const list = getLessonsByLevel(this.selectedLevel);
    return `<main class="main-content">
      <button class="hero-btn" data-action="setPage" data-param="home" style="margin-bottom:1rem">← العودة للمستويات</button>
      <div class="features-grid">${list.map(les => `<div class="feature-card" data-action="selectLesson" data-param="${les.id}">
      <h3>${les.title}</h3><p>${les.description}</p></div>`).join('')}</div></main>`;
  }

  renderReading() {
    const data = getLessonData(this.selectedLessonId);
    return `<main class="main-content">
      <button class="hero-btn" data-action="setPage" data-param="lessons" style="margin-bottom:1rem">← العودة للدروس</button>
      <div class="exercise-card card-enter">
        <h2 style="color:#1e40af; margin-bottom:1rem;">${data.title}</h2>
        <div style="text-align:left; line-height:1.8; font-family:'Poppins'; white-space:pre-line;">${data.content}</div>
      </div></main>`;
  }

  renderFlashcards() {
    const data = getLessonData(this.selectedLessonId);
    const term = data.terms[this.currentCardIndex];
    return `<main class="main-content">
      <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
        <div class="flashcard"><div class="flashcard-front">${term.english}</div><div class="flashcard-back">${term.arabic}</div></div>
      </div>
      <div class="controls"><button class="nav-btn" data-action="prevCard">السابق</button>
      <span>${this.currentCardIndex + 1}/${data.terms.length}</span>
      <button class="nav-btn" data-action="nextCard">التالي</button></div></main>`;
  }

  renderQuiz() {
    const data = getLessonData(this.selectedLessonId);
    const term = data.terms[this.quizIndex];
    if (!term) return `<div class="main-content"><h1>أحسنت!</h1><button class="hero-btn" data-action="setPage" data-param="reading">إعادة</button></div>`;
    return `<main class="main-content"><div class="exercise-card"><h3>ما معنى: ${term.english}؟</h3>
      <div class="options-grid" style="display:grid; gap:10px; margin-top:20px;">
        ${shuffleArray(data.terms).slice(0,4).map(t => `<button class="hero-btn" style="background:#f1f5f9; color:#334155;" data-action="checkQuiz" data-param="${t.arabic}">${t.arabic}</button>`).join('')}
      </div></div></main>`;
  }

  renderExercises() {
    const data = getLessonData(this.selectedLessonId);
    const ex = data.exercises[0]; // مثال لأول تمرين
    return `<main class="main-content"><div class="exercise-card"><h3>أكمل الجملة:</h3>
      <p dir="ltr" style="margin:20px 0; font-size:1.2rem;">${ex.sentence}</p>
      <div class="options-grid" style="display:grid; gap:10px;">
        ${ex.options.map(opt => `<button class="hero-btn" data-action="checkEx" data-param="${opt}">${opt}</button>`).join('')}
      </div></div></main>`;
  }

  // --- المنطق العملي ---
  setPage(p) { 
    if(p === 'home') { this.selectedLevel = null; this.selectedLessonId = null; }
    this.currentPage = p; this.render(); 
  }
  selectLevel(id) { this.selectedLevel = id; this.currentPage = 'lessons'; this.render(); }
  selectLesson(id) { this.selectedLessonId = id; this.currentPage = 'reading'; this.render(); }
  nextCard() { 
    const data = getLessonData(this.selectedLessonId);
    if(this.currentCardIndex < data.terms.length - 1) { this.currentCardIndex++; this.render(); }
  }
  prevCard() { if(this.currentCardIndex > 0) { this.currentCardIndex--; this.render(); } }
  goHome() { this.setPage('home'); }
  
  checkQuiz(ans) {
    const data = getLessonData(this.selectedLessonId);
    if(ans === data.terms[this.quizIndex].arabic) { alert("صحيح!"); this.quizIndex++; }
    else { alert("حاول مرة أخرى"); }
    this.render();
  }
}

new App();
