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
      { label: 'البطاقات', action: 'goFlashcards', page: 'flashcards' },
      { label: 'الاختبار', action: 'goQuiz', page: 'quiz' },
      { label: 'المطابقة', action: 'goMatching', page: 'matching' },
      { label: 'الجمل', action: 'goExercises', page: 'exercises' }
    ];

    return `
      <header class="header">
        <div class="header-content">
          <div class="header-title">📚 المصطلحات</div>
          <nav class="header-nav">
            ${navButtons.map(btn => `
              <button 
                class="nav-btn ${this.currentPage === btn.page ? 'active' : ''}"
                data-action="${btn.action}"
              >
                ${btn.label}
              </button>
            `).join('')}
          </nav>
        </div>
      </header>
    `;
  }

  renderContent() {
    return `<main class="main-content">${this.renderPage()}</main>`;
  }

  renderPage() {
    switch (this.currentPage) {
      case 'home': return this.renderHome();
      case 'flashcards': return this.renderFlashcards();
      case 'quiz': return this.renderQuiz();
      case 'matching': return this.renderMatching();
      case 'exercises': return this.renderExercises();
      default: return this.renderHome();
    }
  }

  renderHome() {
    const batchOptions = batches.map(batch => `
      <button 
        class="batch-btn ${this.selectedBatch === batch.id ? 'active' : ''}"
        data-action="selectBatch"
        data-param="${batch.id}"
      >
        ${batch.name}
      </button>
    `).join('');

    const features = [
      { icon: '🎴', title: 'بطاقات استذكار', desc: 'تعلم المصطلحات من خلال بطاقات تفاعلية', action: 'goFlashcards' },
      { icon: '❓', title: 'اختبار متعدد الخيارات', desc: 'اختبر معرفتك من خلال أسئلة متعددة الخيارات', action: 'goQuiz' },
      { icon: '🎯', title: 'لعبة المطابقة', desc: 'اربط كل مصطلح إنجليزي بمعناه العربي', action: 'goMatching' },
      { icon: '✍️', title: 'تمارين الجمل', desc: 'اختر الكلمة الصحيحة لملء الفراغات في جمل', action: 'goExercises' }
    ];

    return `
      <div class="home-page page-enter">
        <div class="hero">
          <h1>مرحباً بك!</h1>
          <p>تعلم المصطلحات السياسية والقانونية بطرق تفاعلية وممتعة</p>
          <button class="hero-btn" data-action="goFlashcards">ابدأ التعلم الآن</button>
        </div>

        <div class="batch-selector">
          <h2>اختر المجموعة:</h2>
          <div class="batch-buttons">${batchOptions}</div>
        </div>

        <div class="features-grid">
          ${features.map(f => `
            <div class="feature-card card-enter">
              <div class="feature-icon">${f.icon}</div>
              <h3>${f.title}</h3>
              <p>${f.desc}</p>
              <button class="feature-btn" data-action="${f.action}">ابدأ الآن</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderFlashcards() {
    const terms = getTermsByBatch(this.selectedBatch);
    if (terms.length === 0) return '<p>لا توجد كلمات في هذه المجموعة</p>';

    const currentTerm = terms[this.currentCardIndex];
    const isFlipped = this.masteredWords.has(currentTerm.id);

    return `
      <div class="flashcards-page page-enter">
        <div class="flashcard-header">
          <h1>بطاقات استذكار</h1>
        </div>

        <div class="flashcard-container">
          <div class="flashcard ${isFlipped ? 'flipped' : ''}" data-action="toggleFlashcard">
            <div class="flashcard-inner">
              <div class="flashcard-front">
                <div class="flashcard-label">المصطلح</div>
                <div class="flashcard-english">${currentTerm.english}</div>
              </div>
              <div class="flashcard-back">
                <div class="flashcard-label">التعريف</div>
                <div class="flashcard-arabic">${currentTerm.arabic}</div>
              </div>
            </div>
          </div>
        </div>

        ${isFlipped ? `<button class="mastered-btn" data-action="markMastered">✓ أتقنت هذه الكلمة</button>` : ''}

        <div class="flashcard-controls">
          <button class="control-btn" data-action="prevFlashcard" ${this.currentCardIndex === 0 ? 'disabled' : ''}>السابق</button>
          <button class="control-btn" data-action="nextFlashcard" ${this.currentCardIndex === terms.length - 1 ? 'disabled' : ''}>التالي</button>
          <button class="control-btn" data-action="resetFlashcards">إعادة تعيين</button>
        </div>
      </div>
    `;
  }

  // Navigation
  goHome() { this.currentPage = 'home'; this.render(); }
  goFlashcards() { this.currentPage = 'flashcards'; this.currentCardIndex = 0; this.render(); }
  goQuiz() { this.currentPage = 'quiz'; this.quizTotal = 0; this.render(); }
  goMatching() { this.currentPage = 'matching'; this.matchingTerms = null; this.matchedPairs.clear(); this.render(); }
  goExercises() { this.currentPage = 'exercises'; this.exerciseTerms = null; this.render(); }

  selectBatch(batchId) { this.selectedBatch = parseInt(batchId); this.masteredWords.clear(); this.matchedPairs.clear(); this.render(); }

  // Flashcards
  toggleFlashcard() { document.querySelector('.flashcard')?.classList.toggle('flipped'); }
  nextFlashcard() { if(this.currentCardIndex < getTermsByBatch(this.selectedBatch).length-1){this.currentCardIndex++;this.render();} }
  prevFlashcard() { if(this.currentCardIndex>0){this.currentCardIndex--;this.render();} }
  markMastered() { const term = getTermsByBatch(this.selectedBatch)[this.currentCardIndex]; this.masteredWords.add(term.id); this.nextFlashcard(); }
  resetFlashcards() { this.currentCardIndex=0; this.masteredWords.clear(); this.render(); }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => new App());
