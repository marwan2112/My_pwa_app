class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.masteredWords = new Set();
    this.quizIndex = 0;
    this.quizScore = 0;
    this.matchingState = null;
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
    const isInsideLesson = this.selectedLessonId !== null;
    const navButtons = isInsideLesson ? [
        { label: 'النص', page: 'reading' },
        { label: 'البطاقات', page: 'flashcards' },
        { label: 'المطابقة', page: 'matching' },
        { label: 'الاختبار', page: 'quiz' }
    ] : [];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title" data-action="goHome" style="cursor:pointer"><span>English Booster</span></div>
          <nav class="nav-menu">
            ${navButtons.map(btn => `<button class="nav-btn ${this.currentPage === btn.page ? 'active' : ''}" data-action="setPage" data-param="${btn.page}">${btn.label}</button>`).join('')}
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
      case 'matching': return this.renderMatching();
      default: return this.renderLevels();
    }
  }

  renderLevels() {
    return `<main class="main-content"><div class="hero"><h1>اختر مستواك التعليمي</h1></div><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selectLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
  }

  renderLessonsList() {
    const list = getLessonsByLevel(this.selectedLevel);
    return `<main class="main-content"><button class="hero-btn" data-action="goHome" style="margin-bottom:1rem">← العودة</button><div class="features-grid">${list.map(les => `<div class="feature-card" data-action="selectLesson" data-param="${les.id}"><h3>${les.title}</h3><p>${les.description}</p></div>`).join('')}</div></main>`;
  }

  renderReading() {
    const data = getLessonData(this.selectedLessonId);
    return `<main class="main-content"><button class="hero-btn" data-action="setPage" data-param="lessons" style="margin-bottom:1rem">← الدروس</button><div class="exercise-card card-enter"><h2>${data.title}</h2><div style="text-align:left; line-height:1.8; white-space:pre-line; margin-top:15px; font-family:'Poppins';">${data.content}</div></div></main>`;
  }

  renderFlashcards() {
    const data = getLessonData(this.selectedLessonId);
    const term = data.terms[this.currentCardIndex];
    const isMastered = this.masteredWords.has(term.id);
    return `<main class="main-content">
      <div class="flashcard-container ${isMastered ? 'mastered' : ''}" onclick="this.classList.toggle('flipped')">
        <div class="flashcard"><div class="flashcard-front"><div>${term.english}</div><button class="nav-btn" style="margin-top:15px" data-action="speak" data-param="${term.english}">🔊 نطق</button></div>
        <div class="flashcard-back">${term.arabic}</div></div>
      </div>
      <div class="controls"><button class="nav-btn" data-action="prevCard">السابق</button>
      <button class="hero-btn" style="background:${isMastered ? '#22c55e' : '#64748b'}" data-action="toggleMastered" data-param="${term.id}">${isMastered ? '✓ حفظت الكلمة' : 'حفظ الكلمة'}</button>
      <button class="nav-btn" data-action="nextCard">التالي</button></div>
      <div style="text-align:center; margin-top:15px;">${this.currentCardIndex + 1} من ${data.terms.length}</div></main>`;
  }

  renderQuiz() {
    const data = getLessonData(this.selectedLessonId);
    if (this.quizIndex >= data.terms.length) {
      return `<main class="main-content"><div class="hero"><h1>انتهى الاختبار!</h1><p>النتيجة: ${this.quizScore} / ${data.terms.length}</p><button class="hero-btn" data-action="resetQuiz">إعادة</button></div></main>`;
    }
    const current = data.terms[this.quizIndex];
    const options = shuffleArray([...data.terms]).slice(0, 4);
    if (!options.find(o => o.id === current.id)) options[0] = current;
    return `<main class="main-content"><div class="quiz-header">السؤال ${this.quizIndex + 1} | النتيجة: ${this.quizScore}</div>
      <div class="exercise-card"><h2>ما معنى: ${current.english}؟</h2><div class="options-grid" style="display:grid; gap:10px; margin-top:20px;">
      ${shuffleArray(options).map(opt => `<button class="hero-btn" style="background:#f1f5f9; color:#1e293b;" data-action="checkQuiz" data-param="${opt.arabic}">${opt.arabic}</button>`).join('')}
      </div></div></main>`;
  }

  renderMatching() {
    const data = getLessonData(this.selectedLessonId);
    if (!this.matchingState) {
        const set = shuffleArray([...data.terms]).slice(0, 5);
        this.matchingState = { english: shuffleArray([...set]), arabic: shuffleArray([...set]), selected: null };
    }
    return `<main class="main-content">
      <div class="matching-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
        <div>${this.matchingState.english.map(t => `<button class="hero-btn" style="width:100%; background:${this.matchingState.selected?.id === t.id ? '#1e40af' : '#fff'}; color:${this.matchingState.selected?.id === t.id ? '#fff' : '#1e293b'};" data-action="matchSelect" data-param="${t.id}">${t.english}</button>`).join('')}</div>
        <div>${this.matchingState.arabic.map(t => `<button class="hero-btn" style="width:100%; background:#fff; color:#1e293b;" data-action="matchCheck" data-param="${t.id}">${t.arabic}</button>`).join('')}</div>
      </div><button class="hero-btn" style="width:100%; margin-top:20px;" data-action="resetMatching">تحديث اللعبة</button></main>`;
  }

  // --- Logic ---
  setPage(p) { this.currentPage = p; this.render(); }
  selectLevel(id) { this.selectedLevel = id; this.currentPage = 'lessons'; this.render(); }
  selectLesson(id) { this.selectedLessonId = id; this.currentPage = 'reading'; this.currentCardIndex = 0; this.quizIndex = 0; this.quizScore = 0; this.render(); }
  goHome() { this.selectedLevel = null; this.selectedLessonId = null; this.setPage('home'); }
  speak(t) { const m = new SpeechSynthesisUtterance(t); m.lang = 'en-US'; window.speechSynthesis.speak(m); }
  nextCard() { const d = getLessonData(this.selectedLessonId); if(this.currentCardIndex < d.terms.length-1) this.currentCardIndex++; this.render(); }
  prevCard() { if(this.currentCardIndex > 0) this.currentCardIndex--; this.render(); }
  toggleMastered(id) { id = parseInt(id); this.masteredWords.has(id) ? this.masteredWords.delete(id) : this.masteredWords.add(id); this.render(); }
  checkQuiz(a) { const d = getLessonData(this.selectedLessonId); a === d.terms[this.quizIndex].arabic ? (alert("صحيح!"), this.quizScore++) : alert("خطأ!"); this.quizIndex++; this.render(); }
  resetQuiz() { this.quizIndex = 0; this.quizScore = 0; this.render(); }
  matchSelect(id) { this.matchingState.selected = {id: parseInt(id)}; this.render(); }
  matchCheck(id) { 
    if(this.matchingState.selected?.id === parseInt(id)) alert("رائع! تطابق صحيح");
    else alert("إجابة خاطئة");
    this.matchingState.selected = null; this.render(); 
  }
  resetMatching() { this.matchingState = null; this.render(); }
}

window.onload = () => { new App(); };
