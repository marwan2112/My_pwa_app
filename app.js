class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.masteredWords = new Set();
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
        { label: 'الاختبار', action: 'setPage', page: 'quiz' }
    ] : [];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title" data-action="goHome"><span>English Booster</span></div>
          <nav class="nav-menu">${navButtons.map(btn => `
            <button class="nav-btn ${this.currentPage === btn.page ? 'active' : ''}" data-action="${btn.action}" data-param="${btn.page}">${btn.label}</button>
          `).join('')}</nav>
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
      default: return this.renderLevels();
    }
  }

  // --- القوائم ---
  renderLevels() {
    return `<main class="main-content"><div class="hero"><h1>اختر مستواك</h1></div><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selectLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
  }

  renderLessonsList() {
    const list = getLessonsByLevel(this.selectedLevel);
    return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="home" style="margin-bottom:1rem">← العودة</button><div class="features-grid">${list.map(les => `<div class="feature-card" data-action="selectLesson" data-param="${les.id}"><h3>${les.title}</h3><p>${les.description}</p></div>`).join('')}</div></main>`;
  }

  // --- صفحة النص ---
  renderReading() {
    const data = getLessonData(this.selectedLessonId);
    return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="lessons" style="margin-bottom:1rem">← الدروس</button><div class="exercise-card card-enter"><h2>${data.title}</h2><div style="text-align:left; line-height:1.8; white-space:pre-line; margin-top:15px;">${data.content}</div></div></main>`;
  }

  // --- صفحة البطاقات (ميزات النطق والحفظ) ---
  renderFlashcards() {
    const data = getLessonData(this.selectedLessonId);
    const term = data.terms[this.currentCardIndex];
    const isMastered = this.masteredWords.has(term.id);

    return `<main class="main-content">
      <div class="flashcard-container ${isMastered ? 'mastered' : ''}" onclick="this.classList.toggle('flipped')">
        <div class="flashcard">
          <div class="flashcard-front">
            <div class="flashcard-english">${term.english}</div>
            <button class="nav-btn" style="margin-top:10px" data-action="speak" data-param="${term.english}">🔊 استماع</button>
          </div>
          <div class="flashcard-back">${term.arabic}</div>
        </div>
      </div>
      <div class="controls">
        <button class="nav-btn" data-action="prevCard">السابق</button>
        <button class="hero-btn" style="background:${isMastered ? '#22c55e' : '#64748b'}" data-action="toggleMastered" data-param="${term.id}">${isMastered ? '✓ تم حفظها' : 'حفظ الكلمة'}</button>
        <button class="nav-btn" data-action="nextCard">التالي</button>
      </div>
      <div style="text-align:center; margin-top:10px;">التقدم: ${this.currentCardIndex + 1} / ${data.terms.length}</div>
    </main>`;
  }

  // --- صفحة الاختبار (فعال مع عداد) ---
  renderQuiz() {
    const data = getLessonData(this.selectedLessonId);
    if (this.quizIndex >= data.terms.length) {
      return `<main class="main-content"><div class="hero"><h1>انتهى الاختبار!</h1><p>نتيجتك: ${this.quizScore} من ${data.terms.length}</p><button class="hero-btn" data-action="resetQuiz">إعادة المحاولة</button></div></main>`;
    }
    const currentTerm = data.terms[this.quizIndex];
    const options = shuffleArray([...data.terms]).slice(0, 4);
    if(!options.find(o => o.id === currentTerm.id)) options[0] = currentTerm;

    return `<main class="main-content">
      <div class="quiz-header"><h3>السؤال ${this.quizIndex + 1} من ${data.terms.length}</h3><p>النتيجة الحالية: ${this.quizScore}</p></div>
      <div class="exercise-card"><h2>ما معنى: ${currentTerm.english}؟</h2>
        <div class="options-grid" style="display:grid; gap:10px; margin-top:20px;">
          ${shuffleArray(options).map(opt => `<button class="hero-btn quiz-opt" style="background:#f1f5f9; color:#1e293b;" data-action="checkAnswer" data-param="${opt.arabic}">${opt.arabic}</button>`).join('')}
        </div>
      </div></main>`;
  }

  // --- المنطق البرمجي ---
  speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
  }

  toggleMastered(id) {
    id = parseInt(id);
    if(this.masteredWords.has(id)) this.masteredWords.delete(id);
    else this.masteredWords.add(id);
    this.render();
  }

  checkAnswer(ans) {
    const data = getLessonData(this.selectedLessonId);
    const correct = data.terms[this.quizIndex].arabic;
    if(ans === correct) { this.quizScore++; alert("إجابة صحيحة! 🎉"); }
    else { alert(`خطأ! الإجابة الصحيحة هي: ${correct}`); }
    this.quizIndex++;
    this.render();
  }

  setPage(p) { this.currentPage = p; this.render(); }
  selectLevel(id) { this.selectedLevel = id; this.currentPage = 'lessons'; this.render(); }
  selectLesson(id) { this.selectedLessonId = id; this.currentPage = 'reading'; this.currentCardIndex = 0; this.render(); }
  nextCard() { const data = getLessonData(this.selectedLessonId); if(this.currentCardIndex < data.terms.length - 1) { this.currentCardIndex++; this.render(); } }
  prevCard() { if(this.currentCardIndex > 0) { this.currentCardIndex--; this.render(); } }
  resetQuiz() { this.quizIndex = 0; this.quizScore = 0; this.render(); }
  goHome() { this.selectedLevel = null; this.selectedLessonId = null; this.setPage('home'); }
}

window.onload = () => { new App(); };
