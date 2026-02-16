// كود app.js الموحد والمصلح
class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  saveVocab() {
    localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
  }

  setupEventListeners() {
    // حل مشكلة عدم استجابة الأزرار: نستخدم مراقب واحد لكل الصفحة
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const param = target.dataset.param;

      console.log("Action Triggered:", action, param); // للتصحيح

      if (this[action]) {
        this[action](param);
      } else {
        // إذا كانت الدالة غير موجودة بالاسم المباشر (مثل التنقل)
        this.handleNavigation(action, param);
      }
      this.render();
    });

    // الترجمة عند التظليل
    document.addEventListener('mouseup', () => {
      const text = window.getSelection().toString().trim();
      if (text && this.currentPage === 'reading') {
        setTimeout(() => {
          const ar = prompt(`ما ترجمة الكلمة "${text}"؟`);
          if (ar) {
            this.userVocabulary.push({
              id: Date.now(),
              lessonId: this.selectedLessonId,
              english: text,
              arabic: ar,
              example: 'Added by user'
            });
            this.saveVocab();
            this.render();
          }
        }, 100);
      }
    });
  }

  handleNavigation(action, param) {
    if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
    else if (action === 'selLesson') { this.selectedLessonId = param; this.currentPage = 'reading'; this.resetState(); }
    else if (action === 'setPage') { this.currentPage = param; }
    else if (action === 'goHome') { this.selectedLevel = null; this.selectedLessonId = null; this.currentPage = 'home'; }
  }

  resetState() {
    this.quizIndex = 0; this.quizScore = 0; this.currentCardIndex = 0;
  }

  render() {
    const app = document.getElementById('app');
    const lesson = typeof getLessonData === 'function' ? getLessonData(this.selectedLessonId) : null;
    const terms = lesson ? [...lesson.terms, ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)] : [];

    app.innerHTML = this.renderHeader() + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader() {
    const isLessonActive = this.selectedLessonId;
    return `
      <header class="header">
        <div class="header-content">
          <h2 data-action="goHome" style="cursor:pointer">English Booster</h2>
          ${isLessonActive ? `
          <nav class="nav-menu">
            <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
            <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات</button>
            <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
          </nav>` : ''}
        </div>
      </header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') {
      return `
        <main class="main-content">
          <div class="hero"><h1>خطة الـ 9 أشهر</h1><p>تأسيس من الصفر للاحتراف</p></div>
          <div class="features-grid">
            <div class="feature-card" data-action="selLevel" data-param="beginner"><h3>🌱 المستوى المبتدئ</h3><p>5 دروس أساسية</p></div>
            <div class="feature-card" data-action="selLevel" data-param="intermediate"><h3>🌿 المستوى المتوسط</h3><p>مقالات سياسية وتقنية</p></div>
          </div>
        </main>`;
    }

    if (this.currentPage === 'lessons') {
      const list = getLessonsByLevel(this.selectedLevel);
      return `<main class="main-content">
        <button class="hero-btn" data-action="goHome">← رجوع</button>
        <div class="features-grid" style="margin-top:20px;">
          ${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>${l.title}</h3></div>`).join('')}
        </div></main>`;
    }

    if (this.currentPage === 'reading' && lesson) {
      return `<main class="main-content">
        <div class="reading-card"><h2>${lesson.title}</h2><div class="reading-body">${lesson.content}</div></div>
      </main>`;
    }

    if (this.currentPage === 'flashcards') {
        const t = terms[this.currentCardIndex];
        if(!t) return `<main class="main-content">لا توجد كلمات.</main>`;
        return `<main class="main-content">
          <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
            <div class="flashcard">
              <div class="flashcard-front"><h1>${t.english}</h1><button data-action="speak" data-param="${t.english}">🔊</button></div>
              <div class="flashcard-back"><h1>${t.arabic}</h1></div>
            </div>
          </div>
          <div class="controls">
            <button class="hero-btn" data-action="prevC">السابق</button>
            <button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button>
          </div>
        </main>`;
    }
    return `<main class="main-content">قيد التطوير...</main>`;
  }

  nextC(total) { if(this.currentCardIndex < total - 1) this.currentCardIndex++; }
  prevC() { if(this.currentCardIndex > 0) this.currentCardIndex--; }
  speak(t) { window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); }
}

window.onload = () => new App();
