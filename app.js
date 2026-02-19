class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
    this.typingTimer = null;
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
      
      this.render();
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'newEng') {
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => this.fetchTranslation(), 1000);
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
    } catch (e) {
      arbInput.placeholder = "اكتب الترجمة يدوياً";
    }
  }

  manualAddWord() {
    const eng = document.getElementById('newEng').value.trim();
    const arb = document.getElementById('newArb').value.trim();
    if (eng && arb) {
      this.userVocabulary.push({ 
        id: "u-" + Date.now(), 
        lessonId: String(this.selectedLessonId), 
        english: eng, 
        arabic: arb 
      });
      this.saveVocab();
      alert(`✅ تمت إضافة "${eng}"`);
      document.getElementById('newEng').value = '';
      document.getElementById('newArb').value = '';
      this.render();
    }
  }

  resetState() { this.quizIndex = 0; this.quizScore = 0; this.currentCardIndex = 0; }

  render() {
    const app = document.getElementById('app');
    const lesson = window.lessonsData ? window.lessonsData[this.selectedLessonId] : null;
    const addedTerms = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
    const terms = [...(lesson?.terms || []), ...addedTerms];

    app.innerHTML = this.renderHeader(terms) + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader(terms) {
    const isLesson = this.selectedLessonId;
    return `
      <header class="header">
        <div class="header-content">
          <h2 data-action="goHome" style="cursor:pointer">English Booster</h2>
          ${isLesson ? `
            <nav class="nav-menu">
              <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
              <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${terms.length})</button>
              <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>` : ''}
        </div>
      </header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') return `<main class="main-content"><div class="hero"><h1>خطة الاحتراف</h1></div><div class="features-grid">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div></main>`;
    
    if (this.currentPage === 'lessons') {
      const list = window.lessonsList ? window.lessonsList[this.selectedLevel] : [];
      return `<main class="main-content"><button class="hero-btn" data-action="goHome">← رجوع</button><div class="features-grid" style="margin-top:20px;">${list.map(l => `<div class="feature-card" data-action="selLesson" data-param="${l.id}"><h3>${l.title}</h3></div>`).join('')}</div></main>`;
    }

if (this.currentPage === 'reading') {
      if (!lesson) return `<main class="main-content">النص غير موجود</main>`;
      return `
        <main class="main-content" style="padding: 10px; height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-shrink: 0;">
             <button class="hero-btn" data-action="setPage" data-param="lessons" style="margin:0; padding: 4px 12px; font-size: 0.8rem;">← رجوع</button>
             <h3 style="margin:0; font-size: 0.9rem; color: #1e3a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${lesson.title}</h3>
          </div>
          
          <div style="flex-grow: 1; overflow-y: auto; background: white; padding: 15px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 10px; -webkit-overflow-scrolling: touch;">
            <div style="white-space: pre-wrap; line-height: 1.6; font-size: 1rem; color: #333;">${lesson.content}</div>
          </div>

          <div style="background: #f0fdf4; padding: 12px; border-radius: 12px; border: 2px solid #bbf7d0; flex-shrink: 0;">
            <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; color: #166534;">➕ إضافة سريعة:</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="text" id="newEng" placeholder="الكلمة (English)" 
                style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box;">
              
              <input type="text" id="newArb" placeholder="المعنى (عربي)" 
                style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box;">
              
              <button class="hero-btn" data-action="addNewWord" 
                style="background: #16a34a; border: none; color: white; margin: 0; padding: 12px; width: 100%; font-weight: bold;">حفظ في البطاقات</button>
            </div>
          </div>
        </main>`;
    }
    if (this.currentPage === 'flashcards') {
      if (!terms.length) return `<main class="main-content">لا توجد كلمات في هذا الدرس.</main>`;
      const t = terms[this.currentCardIndex];
      return `<main class="main-content"><div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}" style="margin-top:20px">🔊 استمع</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div></div><div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1} / ${terms.length}</span><button class="hero-btn" data-action="nextC" data-total="${terms.length}">التالي</button></div></main>`;
    }

    if (this.currentPage === 'quiz') {
      if (this.quizIndex >= terms.length) return `<main class="main-content" style="text-align:center"><h2>النتيجة النهائية: ${this.quizScore} من ${terms.length}</h2><button class="hero-btn" data-action="resetQ">إعادة الاختبار</button></main>`;
      const q = terms[this.quizIndex];
      let opts = [...terms].sort(()=>Math.random()-0.5).slice(0,4);
      if(!opts.find(o => o.english === q.english)) opts[0] = q;
      return `<main class="main-content"><div class="reading-card"><h1 style="text-align:center;margin-bottom:30px;">${q.english}</h1><div class="options-grid">${opts.sort(()=>Math.random()-0.5).map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div></div></main>`;
    }
  }

  handleAnswer(btn, selected, correct) {
    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(b => {
      b.style.pointerEvents = 'none';
      if (b.innerText === correct) b.style.background = "#22c55e";
      else if (b.innerText === selected) b.style.background = "#ef4444";
    });
    if(selected === correct) this.quizScore++;
    setTimeout(() => { this.quizIndex++; this.render(); }, 1200);
  }

  nextCard(total) { if (this.currentCardIndex < total - 1) { this.currentCardIndex++; } }
  prevCard() { if (this.currentCardIndex > 0) { this.currentCardIndex--; } }
}

document.addEventListener('DOMContentLoaded', () => { window.appInstance = new App(); });
