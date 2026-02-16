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

  init() { this.render(); this.setupSelection(); }

  saveVocab() { localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary)); }

  setupSelection() {
    document.addEventListener('mouseup', () => {
      const text = window.getSelection().toString().trim();
      if (text && this.currentPage === 'reading') {
        const ar = prompt(`ترجمة كلمة "${text}" للعربية:`);
        if (ar) {
          const ex = prompt(`مثال بالإنجليزية لهذه الكلمة:`);
          const newTerm = { id: Date.now(), lessonId: this.selectedLessonId, english: text, arabic: ar, example: ex || 'Added from reading.' };
          this.userVocabulary.push(newTerm);
          this.saveVocab();
          alert("تم حفظ الكلمة في البطاقات والاختبارات بنجاح!");
        }
      }
    });
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.renderHeader() + `<div id="view">${this.renderView()}</div>`;
  }

  renderHeader() {
    const nav = this.selectedLessonId ? [
      { id: 'reading', n: 'النص' }, { id: 'flashcards', n: 'البطاقات' },
      { id: 'matching', n: 'المطابقة' }, { id: 'quiz', n: 'الاختبار' }
    ] : [];
    return `<header class="header"><div class="header-content">
      <h2 data-action="goHome" style="cursor:pointer">English Booster</h2>
      <nav class="nav-menu">
        ${nav.map(b => `<button class="nav-btn ${this.currentPage===b.id?'active':''}" data-action="setPage" data-param="${b.id}">${b.n}</button>`).join('')}
      </nav></div></header>`;
  }

  renderView() {
    const lesson = getLessonData(this.selectedLessonId);
    const combinedTerms = lesson ? [...lesson.terms, ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)] : [];

    switch (this.currentPage) {
      case 'home': return this.drawHome();
      case 'lessons': return this.drawLessons();
      case 'reading': return `<main class="main-content">
        <button class="hero-btn" data-action="setPage" data-param="lessons">← العودة للدروس</button>
        <div class="reading-card" style="margin-top:20px;">
          <small style="color:blue">* حدد أي كلمة لترجمتها وحفظها فوراً</small>
          <h2 style="margin:10px 0">${lesson.title}</h2>
          <div class="reading-body">${lesson.content}</div>
        </div></main>`;
      case 'flashcards': return this.drawFlash(combinedTerms);
      case 'quiz': return this.drawQuiz(combinedTerms);
      case 'matching': return this.drawMatch(combinedTerms);
      default: return this.drawHome();
    }
  }

  drawHome() {
    return `<main class="main-content"><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
  }

  drawLessons() {
    const list = getLessonsByLevel(this.selectedLevel);
    return `<main class="main-content"><button class="hero-btn" data-action="goHome">← العودة للمستويات</button><div class="features-grid" style="margin-top:20px;">${list.map(s => `<div class="feature-card" data-action="selLesson" data-param="${s.id}"><h3>${s.title}</h3><p>${s.description}</p></div>`).join('')}</div></main>`;
  }

  drawFlash(terms) {
    if(terms.length === 0) return `<div class="main-content">لا توجد كلمات. حدد كلمات من النص أولاً.</div>`;
    const t = terms[this.currentCardIndex];
    return `<main class="main-content">
      <div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard">
        <div class="flashcard-front"><div class="highlight-word">${t.english}</div><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊 نطق</button></div>
        <div class="flashcard-back"><div class="back-meaning">${t.arabic}</div><div class="back-example">"${t.example}"</div></div>
      </div></div>
      <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1} / ${terms.length}</span><button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button></div></main>`;
  }

  drawQuiz(terms) {
    if(this.quizIndex >= terms.length) return `<div class="main-content"><h2>النتيجة: ${this.quizScore} / ${terms.length}</h2><button class="hero-btn" data-action="resetQ">إعادة الاختبار</button></div>`;
    const curr = terms[this.quizIndex];
    const opts = shuffleArray([...terms]).slice(0,4); if(!opts.find(x=>x.id===curr.id)) opts[0]=curr;
    return `<main class="main-content"><div class="reading-card"><h3>ما معنى: <span style="color:#1e40af">${curr.english}</span>؟</h3>
      <div class="options-grid">${shuffleArray(opts).map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${curr.arabic}">${o.arabic}</button>`).join('')}</div>
    </div></main>`;
  }

  ansQ(selected, e) {
    const correct = e.target.dataset.correct;
    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(b => {
      if(b.innerText === correct) b.style.background = "#22c55e";
      else if(b.innerText === selected) b.style.background = "#ef4444";
    });
    if(selected === correct) this.quizScore++;
    setTimeout(() => { this.quizIndex++; this.render(); }, 1000);
  }

  drawMatch(terms) {
    if(!this.mSet) {
      const set = shuffleArray([...terms]).slice(0,5);
      this.mSet = { eng: shuffleArray([...set]), arb: shuffleArray([...set]), solved: [] };
    }
    return `<main class="main-content"><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
      <div>${this.mSet.eng.map(t => this.mSet.solved.includes(t.id) ? `<div class="match-btn" style="visibility:hidden"></div>` : `<button class="match-btn ${this.mSelect?.id===t.id && this.mSelect?.side==='e' ? 'selected' : ''}" data-action="mClick" data-id="${t.id}" data-side="e">${t.english}</button>`).join('')}</div>
      <div>${this.mSet.arb.map(t => this.mSet.solved.includes(t.id) ? `<div class="match-btn" style="visibility:hidden"></div>` : `<button class="match-btn ${this.mSelect?.id===t.id && this.mSelect?.side==='a' ? 'selected' : ''}" data-action="mClick" data-id="${t.id}" data-side="a">${t.arabic}</button>`).join('')}</div>
    </div><button class="hero-btn" style="width:100%; margin-top:20px;" data-action="resMatch">تحديث اللعبة</button></main>`;
  }

  mClick(p, e) {
    const id = e.target.dataset.id;
    const side = e.target.dataset.side;
    if(!this.mSelect) { this.mSelect = {id, side}; } 
    else {
      if(this.mSelect.id === id && this.mSelect.side !== side) { this.mSet.solved.push(id); }
      this.mSelect = null;
    }
    this.render();
  }

  // المساعدة
  setPage(p) { this.currentPage = p; this.render(); }
  selLevel(l) { this.selectedLevel = l; this.currentPage = 'lessons'; this.render(); }
  selLesson(id) { this.selectedLessonId = id; this.currentPage = 'reading'; this.quizIndex=0; this.quizScore=0; this.currentCardIndex=0; this.render(); }
  goHome() { this.selectedLevel = null; this.selectedLessonId = null; this.setPage('home'); }
  nextC(p, e) { if(this.currentCardIndex < e.target.dataset.total - 1) this.currentCardIndex++; this.render(); }
  prevC() { if(this.currentCardIndex > 0) this.currentCardIndex--; this.render(); }
  resMatch() { this.mSet = null; this.render(); }
  resetQ() { this.quizIndex = 0; this.quizScore = 0; this.render(); }
  speak(t) { const s = new SpeechSynthesisUtterance(t); s.lang='en-US'; window.speechSynthesis.speak(s); }
}

window.onload = () => new App();
