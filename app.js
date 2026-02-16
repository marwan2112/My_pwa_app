class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
    this.typingTimer = null; // مؤقت للكتابة
    this.init();
  }

  init() {
    this.render();
    this.setupGlobalEvents();
  }

  saveVocab() {
    localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
  }

  setupGlobalEvents() {
    document.addEventListener('click', async (e) => {
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
      else if (action === 'addNewWord') { this.manualAddWord(); }
      else if (action === 'translateNow') { this.fetchTranslation(); } // زر ترجمة يدوي للطوارئ

      this.render();
    });

    // مراقبة الكتابة لجلب الترجمة تلقائياً
    document.addEventListener('input', (e) => {
      if (e.target.id === 'newEng') {
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => this.fetchTranslation(), 1000); // ترجم بعد ثانية من التوقف عن الكتابة
      }
    });
  }

  async fetchTranslation() {
    const engInput = document.getElementById('newEng');
    const arbInput = document.getElementById('newArb');
    if (!engInput || !engInput.value.trim()) return;

    const word = engInput.value.trim();
    arbInput.placeholder = "جاري الترجمة...";
    
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ar`);
      const data = await res.json();
      if (data.responseData.translatedText) {
        arbInput.value = data.responseData.translatedText;
      }
    } catch (error) {
      console.error("Translation Error:", error);
      arbInput.placeholder = "المعنى بالعربي";
    }
  }

  manualAddWord() {
    const eng = document.getElementById('newEng').value.trim();
    const arb = document.getElementById('newArb').value.trim();

    if (eng && arb) {
      const newWord = {
        id: "user-" + Date.now(),
        lessonId: String(this.selectedLessonId),
        english: eng,
        arabic: arb,
        example: "كلمة مضافة يدوياً"
      };
      this.userVocabulary.push(newWord);
      this.saveVocab();
      alert(`✅ تمت إضافة "${eng}"`);
      this.render();
    }
  }

  resetState() { this.quizIndex = 0; this.quizScore = 0; this.currentCardIndex = 0; }

  getCurrentTerms() {
    const lesson = typeof getLessonData === 'function' ? getLessonData(this.selectedLessonId) : null;
    const originalTerms = lesson ? lesson.terms : [];
    const addedTerms = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
    return [...originalTerms, ...addedTerms];
  }

  render() {
    const app = document.getElementById('app');
    const lesson = typeof getLessonData === 'function' ? getLessonData(this.selectedLessonId) : null;
    const terms = this.getCurrentTerms();
    app.innerHTML = this.renderHeader() + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader() {
    const isLesson = this.selectedLessonId;
    return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${isLesson ? `<nav class="nav-menu"><button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button><button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${this.getCurrentTerms().length})</button><button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button></nav>` : ''}</div></header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') return `<main class="main-content"><div class="hero"><h1>خطة الاحتراف</h1></div><div class="features-grid">${levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
    
    if (this.currentPage === 'lessons') {
      const list = getLessonsByLevel(this.selectedLevel);
      return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button><div class="features-grid" style="margin-top:20px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
    }

    if (this.currentPage === 'reading') {
      return `<main class="main-content">
        <button class="hero-btn" data-action="setPage" data-param="lessons">← العودة للدروس</button>
        <div class="reading-card" style="margin-top:15px;">
          <h2>${lesson.title}</h2>
          <div class="reading-body" style="margin-bottom:25px;">${lesson.content}</div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 2px solid #bbf7d0;">
            <h4 style="margin-bottom:10px; color:#166534;">➕ إضافة سريعة:</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <input type="text" id="newEng" placeholder="اكتب الكلمة هنا..." style="flex:1; padding:12px; border-radius:8px; border:1px solid #ddd;">
              <input type="text" id="newArb" placeholder="المعنى سيظهر هنا..." style="flex:1; padding:12px; border-radius:8px; border:1px solid #ddd;">
              <button class="hero-btn" data-action="addNewWord" style="background:#16a34a">حفظ في بطاقاتي</button>
            </div>
          </div>
        </div>
      </main>`;
    }

    if (this.currentPage === 'flashcards') {
      if (!terms.length) return `<main class="main-content">لا توجد كلمات.</main>`;
      const t = terms[this.currentCardIndex];
      return `<main class="main-content"><div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div></div><div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${terms.length}</span><button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button></div></main>`;
    }

    if (this.currentPage === 'quiz') {
      if (this.quizIndex >= terms.length) return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore}/${terms.length}</h2><button class="hero-btn" data-action="resetQ">إعادة</button></main>`;
      const q = terms[this.quizIndex];
      let opts = [...terms].sort(()=>Math.random()-0.5).slice(0,4);
      if(!opts.find(o => o.id === q.id)) opts[0] = q;
      return `<main class="main-content"><div class="reading-card"><h1 style="text-align:center;">${q.english}</h1><div class="options-grid">${opts.sort(()=>Math.random()-0.5).map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div></div></main>`;
    }
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
