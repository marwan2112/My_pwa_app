class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    // تحميل الكلمات التي أضافها المستخدم من الذاكرة
    this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.setupSelection();
  }

  saveVocab() {
    localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const param = btn.dataset.param;

      if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
      else if (action === 'selLesson') { this.selectedLessonId = param; this.currentPage = 'reading'; this.resetState(); }
      else if (action === 'setPage') { this.currentPage = param; }
      else if (action === 'goHome') { this.selectedLevel = null; this.selectedLessonId = null; this.currentPage = 'home'; }
      else if (action === 'nextC') { this.nextCard(btn.dataset.total); }
      else if (action === 'prevC') { this.prevCard(); }
      else if (action === 'speak') { window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); }
      else if (action === 'ansQ') { this.handleAnswer(btn, param, btn.dataset.correct); }
      else if (action === 'resetQ') { this.resetState(); }

      this.render();
    });
  }

  setupSelection() {
    document.addEventListener('mouseup', () => {
      const text = window.getSelection().toString().trim();
      if (text && this.currentPage === 'reading') {
        setTimeout(() => {
          const ar = prompt(`ترجمة كلمة "${text}" بالعربية:`);
          if (ar) {
            const ex = prompt(`ضع الكلمة في جملة (اختياري):`);
            // إضافة الكلمة الجديدة لقائمة المستخدم مع ربطها بالدرس الحالي
            const newEntry = {
              id: Date.now(),
              lessonId: this.selectedLessonId,
              english: text,
              arabic: ar,
              example: ex || 'Added by you'
            };
            this.userVocabulary.push(newEntry);
            this.saveVocab();
            alert(`تمت إضافة "${text}" إلى البطاقات بنجاح!`);
            this.render();
          }
        }, 100);
      }
    });
  }

  resetState() {
    this.quizIndex = 0; this.quizScore = 0; this.currentCardIndex = 0;
  }

  render() {
    const app = document.getElementById('app');
    const lesson = typeof getLessonData === 'function' ? getLessonData(this.selectedLessonId) : null;
    
    // دمج كلمات الدرس الأصلية مع كلمات المستخدم لهذا الدرس
    const terms = lesson ? [
      ...lesson.terms, 
      ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)
    ] : [];

    app.innerHTML = this.renderHeader() + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader() {
    const nav = this.selectedLessonId ? `
      <nav class="nav-menu">
        <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
        <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات</button>
        <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
      </nav>` : '';
    return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${nav}</div></header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') {
      return `<main class="main-content"><div class="hero"><h1>خطة الاحتراف</h1></div><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
    }

    if (this.currentPage === 'lessons') {
      const list = getLessonsByLevel(this.selectedLevel);
      return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع للمستويات</button><div class="features-grid" style="margin-top:20px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
    }

    if (this.currentPage === 'reading' && lesson) {
      return `<main class="main-content">
        <button class="hero-btn" data-action="setPage" data-param="lessons" style="margin-bottom:15px;">← العودة لقائمة الدروس</button>
        <div class="reading-card"><h2>${lesson.title}</h2><p style="color:#1e40af; font-size:0.8rem; margin-bottom:10px;">💡 حدد أي كلمة لترجمتها وإضافتها لبطاقاتك</p><div class="reading-body">${lesson.content}</div></div>
      </main>`;
    }

    if (this.currentPage === 'flashcards') {
      if (!terms.length) return `<main class="main-content">لا توجد كلمات بعد. اذهب للنص وظلل الكلمات الصعبة.</main>`;
      const t = terms[this.currentCardIndex];
      return `<main class="main-content">
        <button class="hero-btn" data-action="setPage" data-param="reading" style="margin-bottom:15px;">← عودة للنص</button>
        <div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard">
          <div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊 نطق</button></div>
          <div class="flashcard-back"><h1>${t.arabic}</h1><p>${t.example}</p></div>
        </div></div>
        <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${terms.length}</span><button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button></div></main>`;
    }

    if (this.currentPage === 'quiz') {
      if (this.quizIndex >= terms.length) return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore}/${terms.length}</h2><button class="hero-btn" data-action="resetQ">إعادة الاختبار</button></main>`;
      const q = terms[this.quizIndex];
      return `<main class="main-content"><div class="reading-card"><h3>ما معنى: <span style="color:blue">${q.english}</span>؟</h3><div class="options-grid">${[...lesson.terms, ...this.userVocabulary].sort(()=>Math.random()-0.5).slice(0,4).map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div></div></main>`;
    }
    return '';
  }

  handleAnswer(btn, selected, correct) {
    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(b => b.style.background = b.innerText === correct ? "#22c55e" : (b.innerText === selected ? "#ef4444" : "white"));
    if(selected === correct) this.quizScore++;
    setTimeout(() => { this.quizIndex++; this.render(); }, 1000);
  }

  nextCard(total) { if (this.currentCardIndex < total - 1) this.currentCardIndex++; }
  prevCard() { if (this.currentCardIndex > 0) this.currentCardIndex--; }
}

window.onload = () => new App();
