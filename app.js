// تطبيق المصطلحات السياسية والقانونية - PWA

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
      {
        icon: '🎴',
        title: 'بطاقات استذكار',
        desc: 'تعلم المصطلحات من خلال بطاقات تفاعلية مع تأثيرات تقليب سلسة',
        action: 'goFlashcards'
      },
      {
        icon: '❓',
        title: 'اختبار متعدد الخيارات',
        desc: 'اختبر معرفتك من خلال أسئلة متعددة الخيارات واحصل على نقاط',
        action: 'goQuiz'
      },
      {
        icon: '🎯',
        title: 'لعبة المطابقة',
        desc: 'اربط كل مصطلح إنجليزي بمعناه العربي الصحيح',
        action: 'goMatching'
      },
      {
        icon: '✍️',
        title: 'تمارين الجمل',
        desc: 'اختر الكلمة الصحيحة لملء الفراغات في جمل حقيقية',
        action: 'goExercises'
      }
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
          <div class="batch-buttons">
            ${batchOptions}
          </div>
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

        <div class="batch-selector">
          <h2>معلومات عن التطبيق</h2>
          <div style="text-align: right; color: #64748b; line-height: 1.8;">
            <p>✓ يحتوي التطبيق على 120 مصطلحاً سياسياً وقانونياً</p>
            <p>✓ متوافق تماماً مع جميع الأجهزة والهواتف الذكية</p>
            <p>✓ دعم كامل للغة العربية واتجاه النص من اليمين لليسار</p>
            <p>✓ تصميم احترافي بالأزرق والرمادي</p>
            <p>✓ نطق صوتي للكلمات الإنجليزية</p>
          </div>
        </div>
      </div>
    `;
  }

  renderFlashcards() {
    const terms = getTermsByBatch(this.selectedBatch);
    if (terms.length === 0) return '<p>لا توجد كلمات في هذه المجموعة</p>';

    const currentTerm = terms[this.currentCardIndex];
    const isFlipped = this.currentCardIndex in this.masteredWords;

    return `
      <div class="flashcards-page page-enter">
        <div class="flashcard-header">
          <h1>بطاقات استذكار</h1>
          <p>اضغط على البطاقة لرؤية التعريف</p>
        </div>

        <div class="flashcard-progress">
          <div class="progress-info">
            <span>المتقنة: ${this.masteredWords.size}</span>
            <span>البطاقة ${this.currentCardIndex + 1} من ${terms.length}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentCardIndex + 1) / terms.length) * 100}%"></div>
          </div>
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

        <div style="display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0;">
          <button class="speak-btn" data-action="speakWord" data-param="${currentTerm.english}" title="اسمع النطق">
            🔊
          </button>
        </div>

        ${isFlipped ? `
          <button class="mastered-btn" data-action="markMastered">
            ✓ أتقنت هذه الكلمة
          </button>
        ` : ''}

        <div class="flashcard-controls">
          <button 
            class="control-btn" 
            data-action="prevFlashcard"
            ${this.currentCardIndex === 0 ? 'disabled' : ''}
          >
            السابق
          </button>
          <button 
            class="control-btn" 
            data-action="nextFlashcard"
            ${this.currentCardIndex === terms.length - 1 ? 'disabled' : ''}
          >
            التالي
          </button>
          <button class="control-btn" data-action="resetFlashcards">إعادة تعيين</button>
        </div>
      </div>
    `;
  }

  renderQuiz() {
    const terms = getTermsByBatch(this.selectedBatch);
    if (terms.length === 0) return '<p>لا توجد كلمات في هذه المجموعة</p>';

    if (this.quizTotal === 0) {
      this.quizTotal = Math.min(10, terms.length);
      this.quizTerms = shuffleArray(terms).slice(0, this.quizTotal);
      this.quizIndex = 0;
      this.quizScore = 0;
    }

    if (this.quizIndex >= this.quizTotal) {
      return this.renderQuizResults();
    }

    const currentTerm = this.quizTerms[this.quizIndex];
    const options = shuffleArray([
      currentTerm.arabic,
      ...shuffleArray(terms.filter(t => t.id !== currentTerm.id)).slice(0, 3).map(t => t.arabic)
    ]);

    return `
      <div class="quiz-page page-enter">
        <div class="quiz-header">
          <h1>اختبار متعدد الخيارات</h1>
          <p>اختر المعنى الصحيح للكلمة</p>
        </div>

        <div class="flashcard-progress">
          <div class="progress-info">
            <span>النقاط: ${this.quizScore}/${this.quizTotal}</span>
            <span>السؤال ${this.quizIndex + 1} من ${this.quizTotal}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.quizIndex + 1) / this.quizTotal) * 100}%"></div>
          </div>
        </div>

        <div class="quiz-card card-enter">
          <div class="quiz-question">
            ما معنى الكلمة: <strong>${currentTerm.english}</strong>؟
          </div>

          <div class="quiz-options">
            ${options.map((option, idx) => {
              const isCorrect = option === currentTerm.arabic;
              let className = 'quiz-option';
              
              if (this.answered) {
                className += isCorrect ? ' correct' : '';
                if (this.selectedAnswer === idx && !isCorrect) className += ' incorrect';
                className += ' disabled';
              } else if (this.selectedAnswer === idx) {
                className += ' selected';
              }

              return `
                <button 
                  class="${className}"
                  data-action="selectQuizAnswer"
                  data-param="${idx}"
                  ${this.answered ? 'disabled' : ''}
                >
                  ${option}
                </button>
              `;
            }).join('')}
          </div>

          ${this.answered ? `
            <div class="quiz-explanation">
              <strong>الإجابة الصحيحة:</strong> ${currentTerm.arabic}
            </div>
            <button class="feature-btn" data-action="nextQuizQuestion">
              السؤال التالي
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderQuizResults() {
    return `
      <div class="quiz-page page-enter">
        <div class="quiz-score">
          <h2>انتهيت من الاختبار! 🎉</h2>
          <p>${this.quizScore}/${this.quizTotal}</p>
          <p style="font-size: 1rem; margin-bottom: 1rem;">
            ${this.quizScore === this.quizTotal ? 'ممتاز! أجبت على جميع الأسئلة بشكل صحيح' :
              this.quizScore >= this.quizTotal * 0.8 ? 'جيد جداً! أداء رائع' :
              this.quizScore >= this.quizTotal * 0.6 ? 'جيد! حاول مرة أخرى' :
              'حاول مرة أخرى لتحسين أدائك'}
          </p>
          <button class="hero-btn" data-action="resetQuiz">إعادة الاختبار</button>
        </div>
      </div>
    `;
  }

  renderMatching() {
    const terms = getTermsByBatch(this.selectedBatch);
    if (terms.length === 0) return '<p>لا توجد كلمات في هذه المجموعة</p>';

    if (!this.matchingTerms) {
      this.matchingTerms = shuffleArray(terms).slice(0, 10);
      this.matchingArabic = shuffleArray([...this.matchingTerms]);
      this.selectedEnglish = null;
      this.selectedArabic = null;
    }

    const matchedCount = this.matchedPairs.size;

    return `
      <div class="matching-page page-enter">
        <div class="matching-header">
          <h1>لعبة المطابقة</h1>
          <p>اربط كل مصطلح إنجليزي بمعناه العربي</p>
        </div>

        <div class="flashcard-progress">
          <div class="progress-info">
            <span>المطابقات: ${matchedCount}/${this.matchingTerms.length}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(matchedCount / this.matchingTerms.length) * 100}%"></div>
          </div>
        </div>

        <div class="matching-container">
          <div class="matching-column">
            <h3>المصطلحات الإنجليزية</h3>
            <div class="matching-items">
              ${this.matchingTerms.map((term, idx) => {
                const matched = this.matchedPairs.has(term.id);
                return `
                  <button 
                    class="matching-item ${matched ? 'matched' : ''} ${this.selectedEnglish?.id === term.id ? 'selected' : ''}"
                    data-action="selectMatchingEnglish"
                    data-param="${idx}"
                    ${matched ? 'disabled' : ''}
                  >
                    ${term.english}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="matching-column">
            <h3>المعاني العربية</h3>
            <div class="matching-items">
              ${this.matchingArabic.map((term, idx) => {
                const matched = this.matchedPairs.has(term.id);
                return `
                  <button 
                    class="matching-item ${matched ? 'matched' : ''} ${this.selectedArabic?.id === term.id ? 'selected' : ''}"
                    data-action="selectMatchingArabic"
                    data-param="${idx}"
                    ${matched ? 'disabled' : ''}
                  >
                    ${term.arabic}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        ${matchedCount === this.matchingTerms.length ? `
          <div class="quiz-score">
            <h2>أحسنت! 🎉</h2>
            <p>لقد طابقت جميع الكلمات بنجاح</p>
            <button class="hero-btn" data-action="resetMatching">إعادة اللعبة</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderExercises() {
    const exercises = getExercisesByBatch(this.selectedBatch);
    if (exercises.length === 0) return '<p>لا توجد تمارين في هذه المجموعة</p>';

    if (!this.exerciseTerms) {
      this.exerciseTerms = shuffleArray(exercises);
      this.exerciseIndex = 0;
      this.exerciseScore = 0;
      this.selectedAnswer = null;
      this.answered = false;
    }

    if (this.exerciseIndex >= this.exerciseTerms.length) {
      return this.renderExerciseResults();
    }

    const exercise = this.exerciseTerms[this.exerciseIndex];
    const options = shuffleArray([...exercise.options]);

    return `
      <div class="exercises-page page-enter">
        <div class="exercises-header">
          <h1>تمارين الجمل</h1>
          <p>اختر الكلمة الصحيحة لملء الفراغ</p>
        </div>

        <div class="flashcard-progress">
          <div class="progress-info">
            <span>النقاط: ${this.exerciseScore}/${this.exerciseTerms.length}</span>
            <span>السؤال ${this.exerciseIndex + 1} من ${this.exerciseTerms.length}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.exerciseIndex + 1) / this.exerciseTerms.length) * 100}%"></div>
          </div>
        </div>

        <div class="exercise-card card-enter">
          <div class="exercise-sentence">
            ${exercise.sentence.split(exercise.blank).map((part, idx) => {
              if (idx === 0) return part;
              return `<span class="blank-space">________</span>${part}`;
            }).join('')}
          </div>

          <div class="quiz-options">
            ${options.map((option, idx) => {
              const isCorrect = option === exercise.correctIndex;
              let className = 'quiz-option';
              
              if (this.answered) {
                className += isCorrect ? ' correct' : '';
                if (this.selectedAnswer === idx && !isCorrect) className += ' incorrect';
                className += ' disabled';
              } else if (this.selectedAnswer === idx) {
                className += ' selected';
              }

              return `
                <button 
                  class="${className}"
                  data-action="selectExerciseAnswer"
                  data-param="${idx}"
                  ${this.answered ? 'disabled' : ''}
                >
                  ${option}
                </button>
              `;
            }).join('')}
          </div>

          ${this.answered ? `
            <div class="quiz-explanation">
              <strong>الشرح:</strong> ${exercise.explanation}
            </div>
            <button class="feature-btn" data-action="nextExerciseQuestion">
              السؤال التالي
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderExerciseResults() {
    return `
      <div class="exercises-page page-enter">
        <div class="quiz-score">
          <h2>انتهيت من التمرين! 🎉</h2>
          <p>${this.exerciseScore}/${this.exerciseTerms.length}</p>
          <p style="font-size: 1rem; margin-bottom: 1rem;">
            ${this.exerciseScore === this.exerciseTerms.length ? 'ممتاز! أجبت على جميع الأسئلة بشكل صحيح' :
              this.exerciseScore >= this.exerciseTerms.length * 0.8 ? 'جيد جداً! أداء رائع' :
              this.exerciseScore >= this.exerciseTerms.length * 0.6 ? 'جيد! حاول مرة أخرى' :
              'حاول مرة أخرى لتحسين أدائك'}
          </p>
          <button class="hero-btn" data-action="resetExercises">إعادة التمرين</button>
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

  selectBatch(batchId) {
    this.selectedBatch = parseInt(batchId);
    this.masteredWords.clear();
    this.matchedPairs.clear();
    this.render();
  }

  // Flashcards
  toggleFlashcard() {
    const card = document.querySelector('.flashcard');
    card.classList.toggle('flipped');
  }

  nextFlashcard() {
    const terms = getTermsByBatch(this.selectedBatch);
    if (this.currentCardIndex < terms.length - 1) {
      this.currentCardIndex++;
      this.render();
    }
  }

  prevFlashcard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.render();
    }
  }

  markMastered() {
    const terms = getTermsByBatch(this.selectedBatch);
    const currentTerm = terms[this.currentCardIndex];
    this.masteredWords.add(currentTerm.id);
    this.nextFlashcard();
  }

  resetFlashcards() {
    this.currentCardIndex = 0;
    this.masteredWords.clear();
    this.render();
  }

  // Quiz
  selectQuizAnswer(index) {
    if (this.answered) return;
    this.selectedAnswer = parseInt(index);
    const currentTerm = this.quizTerms[this.quizIndex];
    const options = shuffleArray([
      currentTerm.arabic,
      ...shuffleArray(getTermsByBatch(this.selectedBatch).filter(t => t.id !== currentTerm.id)).slice(0, 3).map(t => t.arabic)
    ]);
    
    if (options[this.selectedAnswer] === currentTerm.arabic) {
      this.quizScore++;
    }
    this.answered = true;
    this.render();
    
    // Auto advance after 2-3 seconds
    setTimeout(() => this.nextQuizQuestion(), 2000 + Math.random() * 1000);
  }

  nextQuizQuestion() {
    this.quizIndex++;
    this.selectedAnswer = null;
    this.answered = false;
    this.render();
  }

  resetQuiz() {
    this.quizTotal = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.selectedAnswer = null;
    this.answered = false;
    this.render();
  }

  // Matching
  selectMatchingEnglish(index) {
    this.selectedEnglish = this.matchingTerms[index];
    this.render();
    if (this.selectedArabic) {
      this.checkMatch();
    }
  }

  selectMatchingArabic(index) {
    this.selectedArabic = this.matchingArabic[index];
    this.render();
    if (this.selectedEnglish) {
      this.checkMatch();
    }
  }

  checkMatch() {
    if (this.selectedEnglish.id === this.selectedArabic.id) {
      this.matchedPairs.add(this.selectedEnglish.id);
      this.selectedEnglish = null;
      this.selectedArabic = null;
    }
    this.render();
  }

  resetMatching() {
    this.matchingTerms = null;
    this.matchedPairs.clear();
    this.selectedEnglish = null;
    this.selectedArabic = null;
    this.render();
  }

  // Exercises
  selectExerciseAnswer(index) {
    if (this.answered) return;
    this.selectedAnswer = parseInt(index);
    const exercise = this.exerciseTerms[this.exerciseIndex];
    
    if (this.selectedAnswer === exercise.correctIndex) {
      this.exerciseScore++;
    }
    this.answered = true;
    this.render();
    
    // Auto advance after 2-3 seconds
    setTimeout(() => this.nextExerciseQuestion(), 2000 + Math.random() * 1000);
  }

  nextExerciseQuestion() {
    this.exerciseIndex++;
    this.selectedAnswer = null;
    this.answered = false;
    this.render();
  }

  resetExercises() {
    this.exerciseTerms = null;
    this.exerciseIndex = 0;
    this.exerciseScore = 0;
    this.selectedAnswer = null;
    this.answered = false;
    this.render();
  }

  // Speech
  speakWord(word) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
