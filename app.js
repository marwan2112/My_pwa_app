class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.masteredWords = new Set();
    this.userVocabulary = []; // للكلمات التي يضيفها المستخدم من النص
    this.init();
  }

  init() { this.render(); this.setupEventListeners(); this.setupTextSelection(); }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const { action, param } = target.dataset;
      this[action]?.(param);
    });
  }

  // ميزة تحديد الكلمة والترجمة (تلقائياً للبطاقات)
  setupTextSelection() {
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection().toString().trim();
      if (selection && selection.length > 0 && this.currentPage === 'reading') {
        this.handleNewWord(selection);
      }
    });
  }

  handleNewWord(word) {
    const confirmAdd = confirm(`هل تريد إضافة الكلمة "${word}" إلى بطاقاتك؟`);
    if (confirmAdd) {
        const arabic = prompt(`ما هو معنى "${word}" بالعربي؟`);
        if (arabic) {
            const newTerm = { id: Date.now(), english: word, arabic: arabic, example: "Added from text context.", custom: true };
            this.userVocabulary.push(newTerm);
            alert("تمت الإضافة بنجاح لكل الخيارات!");
        }
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.renderHeader() + `<div id="content-area">${this.renderContent()}</div>`;
  }

  renderHeader() {
    const nav = this.selectedLessonId ? [
      { label: 'النص', page: 'reading' },
      { label: 'البطاقات', page: 'flashcards' },
      { label: 'المطابقة', page: 'matching' },
      { label: 'الاختبار', page: 'quiz' }
    ] : [];
    return `<header class="header"><div class="header-content"><div class="header-title" data-action="goHome">English Booster</div>
    <nav class="nav-menu">${nav.map(b => `<button class="nav-btn ${this.currentPage===b.page?'active':''}" data-action="setPage" data-param="${b.page}">${b.label}</button>`).join('')}</nav></div></header>`;
  }

  renderContent() {
    const data = getLessonData(this.selectedLessonId);
    const combinedTerms = data ? [...data.terms, ...this.userVocabulary] : [];

    switch (this.currentPage) {
      case 'home': return this.renderLevels();
      case 'lessons': return this.renderLessonsList();
      case 'reading': return `<main class="main-content"><div class="exercise-card card-enter"><h2>${data.title}</h2><p style="color:#64748b; font-size:0.8rem;">* حدد أي كلمة لترجمتها وإضافتها لبطاقاتك</p><div class="reading-body">${data.content}</div></div></main>`;
      case 'flashcards': return this.renderFlashcards(combinedTerms);
      case 'quiz': return this.renderQuiz(combinedTerms);
      case 'matching': return this.renderMatching(combinedTerms);
      default: return this.renderLevels();
    }
  }

  renderLevels() {
    return `<main class="main-content"><div class="hero"><h1>خطة الـ 9 أشهر للاحتراف</h1><p>ابدأ رحلتك من الصفر</p></div><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selectLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
  }

  renderLessonsList() {
    const list = getLessonsByLevel(this.selectedLevel);
    return `<main class="main-content"><button class="hero-btn" data-action="goHome">← العودة</button><div class="features-grid" style="margin-top:20px;">${list.map(les => `<div class="feature-card" data-action="selectLesson" data-param="${les.id}"><h3>${les.title}</h3><p>${les.description}</p></div>`).join('')}</div></main>`;
  }

  renderFlashcards(terms) {
    const term = terms[this.currentCardIndex];
    if(!term) return `<div class="main-content">لا توجد كلمات بعد.</div>`;
    return `<main class="main-content">
      <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
        <div class="flashcard">
          <div class="flashcard-front"><span class="highlight-word">${term.english}</span><button class="nav-btn" style="margin-top:20px" data-action="speak" data-param="${term.english}">🔊 نطق</button></div>
          <div class="flashcard-back"><h2>${term.arabic}</h2><p style="margin-top:20px; color:#1e40af; font-style:italic;">Example: ${term.example || ''}</p></div>
        </div>
      </div>
      <div class="controls"><button class="nav-btn" data-action="prevCard">السابق</button><span>${this.currentCardIndex+1}/${terms.length}</span><button class="nav-btn" data-action="nextCard">التالي</button></div></main>`;
  }

  renderQuiz(terms) {
    if (this.quizIndex >= terms.length) return `<div class="main-content"><h1>انتهى! النتيجة: ${this.quizScore}</h1><button class="hero-btn" data-action="resetQuiz">إعادة</button></div>`;
    const current = terms[this.quizIndex];
    const options = shuffleArray([...terms]).slice(0, 4);
    if(!options.find(o => o.id === current.id)) options[0] = current;

    return `<main class="main-content"><div class="quiz-header">سؤال ${this.quizIndex+1} | نتيجة: ${this.quizScore}</div>
      <div class="exercise-card"><h3>ما معنى: <span style="color:#1e40af">${current.english}</span>؟</h3>
      <div class="options-grid" style="margin-top:20px;">
        ${shuffleArray(options).map(o => `<button class="quiz-opt-btn" data-action="checkAnswer" data-param="${o.arabic}" data-correct="${current.arabic}">${o.arabic}</button>`).join('')}
      </div></div></main>`;
  }

  checkAnswer(selected) {
    const btns = document.querySelectorAll('.quiz-opt-btn');
    const correct = btns[0].dataset.correct;
    btns.forEach(b => {
        if(b.innerText === correct) b.style.background = "#22c55e";
        if(b.innerText === selected && selected !== correct) b.style.background = "#ef4444";
    });
    if(selected === correct) { this.quizScore++; this.playSound('correct'); } else { this.playSound('wrong'); }
    setTimeout(() => { this.quizIndex++; this.render(); }, 1500);
  }

  renderMatching(terms) {
    // منطق المطابقة المتطور: إخفاء الكلمات المطابقة
    if(!this.mSet) {
        const set = shuffleArray([...terms]).slice(0, 5);
        this.mSet = { eng: shuffleArray([...set]), arb: shuffleArray([...set]), solved: new Set() };
    }
    return `<main class="main-content"><div class="matching-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <div>${this.mSet.eng.map(t => this.mSet.solved.has(t.id) ? '' : `<button class="match-btn" id="eng-${t.id}" data-action="mSelect" data-param="eng-${t.id}">${t.english}</button>`).join('')}</div>
      <div>${this.mSet.arb.map(t => this.mSet.solved.has(t.id) ? '' : `<button class="match-btn" id="arb-${t.id}" data-action="mSelect" data-param="arb-${t.id}">${t.arabic}</button>`).join('')}</div>
    </div><button class="hero-btn" style="width:100%; margin-top:20px;" data-action="resMatch">تحديث</button></main>`;
  }

  // منطق المساعدة
  setPage(p) { this.currentPage = p; this.render(); }
  selectLevel(id) { this.selectedLevel = id; this.currentPage = 'lessons'; this.render(); }
  selectLesson(id) { this.selectedLessonId = id; this.currentPage = 'reading'; this.render(); }
  goHome() { this.selectedLessonId = null; this.setPage('home'); }
  speak(t) { const m = new SpeechSynthesisUtterance(t); m.lang = 'en-US'; window.speechSynthesis.speak(m); }
  nextCard() { this.currentCardIndex++; this.render(); }
  prevCard() { if(this.currentCardIndex > 0) this.currentCardIndex--; this.render(); }
  playSound(type) { /* يمكنك إضافة ملفات صوتية هنا */ }
}

window.onload = () => new App();
