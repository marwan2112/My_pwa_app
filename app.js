class App {
  constructor() {
    // الحالة الافتراضية
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizQuestions = []; 
    
    // تحميل البيانات من الذاكرة المحلية
    this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
    this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
    this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
    
    this.isUnlockTest = false; 
    this.tempLessonToUnlock = null;
    this.typingTimer = null;

    this.init();
  }

  init() {
    this.render();
    this.setupGlobalEvents();
  }

  saveData() {
    localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
    localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
    localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
  }

  // --- نظام فتح الدروس ---
  isLessonUnlocked(lessonId, levelId) {
    const levelLessons = window.lessonsList ? window.lessonsList[levelId] : [];
    if (levelLessons && levelLessons.length > 0 && String(levelLessons[0].id) === String(lessonId)) return true;
    return this.unlockedLessons.includes(String(lessonId));
  }

  prepareQuiz(terms) {
    // خلط الكلمات واختيار نصفها في حال كان اختبار فتح
    const shuffled = [...terms].sort(() => 0.5 - Math.random());
    const limit = this.isUnlockTest ? Math.max(1, Math.floor(terms.length / 2)) : terms.length;
    this.quizQuestions = shuffled.slice(0, limit);
    this.quizIndex = 0;
    this.quizScore = 0;
  }

  startUnlockTest(targetLessonId) {
    const levelLessons = window.lessonsList[this.selectedLevel];
    const currentIndex = levelLessons.findIndex(l => String(l.id) === String(targetLessonId));
    const prevLessonId = levelLessons[currentIndex - 1].id;
    const prevLessonData = window.lessonsData[prevLessonId];
    const prevAdded = this.userVocabulary.filter(v => String(v.lessonId) === String(prevLessonId));
    const allPrevTerms = [...(prevLessonData?.terms || []), ...prevAdded];
    
    if (allPrevTerms.length < 2) {
        this.unlockLesson(targetLessonId);
        return;
    }

    this.isUnlockTest = true;
    this.tempLessonToUnlock = targetLessonId;
    this.prepareQuiz(allPrevTerms);
    this.currentPage = 'quiz';
    this.render();
  }

  unlockLesson(lessonId) {
    if (!this.unlockedLessons.includes(String(lessonId))) {
        this.unlockedLessons.push(String(lessonId));
        this.saveData();
    }
    this.isUnlockTest = false;
    this.selectedLessonId = lessonId;
    this.currentPage = 'reading';
    this.render();
  }

  // --- ميزات الكاميرا وOCR ---
  async scanImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusDiv = document.getElementById('ocr-status');
    statusDiv.innerText = "⏳ جاري القراءة...";
    try {
      const result = await Tesseract.recognize(file, 'eng');
      document.getElementById('custom-text-input').value = result.data.text;
      statusDiv.innerText = "✅ تمت القراءة!";
    } catch (e) {
      statusDiv.innerText = "❌ فشل التحويل";
    }
  }

  saveCustomLesson() {
    const text = document.getElementById('custom-text-input').value.trim();
    if (!text) return alert("اكتب نصاً أولاً");
    const newId = "custom-" + Date.now();
    if(!window.lessonsData) window.lessonsData = {};
    window.lessonsData[newId] = { id: newId, title: "نص مستورد", content: text, terms: [] };
    this.unlockedLessons.push(newId);
    this.selectedLessonId = newId;
    this.currentPage = 'reading';
    this.saveData();
    this.render();
  }

  // --- إدارة الأحداث ---
  setupGlobalEvents() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, param } = btn.dataset;

      if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
      else if (action === 'selLesson') { 
          if (this.isLessonUnlocked(param, this.selectedLevel)) {
              this.selectedLessonId = param; this.currentPage = 'reading'; this.resetState(); 
          } else {
              if (confirm('الدرس مقفل. ابدأ الاختبار لفتحه؟')) this.startUnlockTest(param);
          }
      }
      else if (action === 'setPage') { 
          if (param === 'quiz') {
              const lesson = window.lessonsData[this.selectedLessonId];
              const added = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
              const all = [...(lesson?.terms || []), ...added].filter(t => !this.masteredWords.includes(t.id));
              this.prepareQuiz(all);
          }
          this.currentPage = param; 
      }
      else if (action === 'goHome') { this.resetState(); this.selectedLevel = null; this.selectedLessonId = null; this.currentPage = 'home'; }
      else if (action === 'speak') { window.speechSynthesis.speak(new SpeechSynthesisUtterance(param)); }
      else if (action === 'ansQ') { this.handleAnswer(btn, param, btn.dataset.correct); }
      else if (action === 'addNewWord') { this.manualAddWord(); }
      else if (action === 'nextC') { if (this.currentCardIndex < (parseInt(btn.dataset.total) - 1)) this.currentCardIndex++; }
      else if (action === 'prevC') { if (this.currentCardIndex > 0) this.currentCardIndex--; }
      
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
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(engInput.value)}&langpair=en|ar`);
      const data = await res.json();
      if (data.responseData.translatedText) arbInput.value = data.responseData.translatedText;
    } catch (e) { arbInput.placeholder = "اكتب الترجمة يدوياً"; }
  }

  handleAnswer(btn, selected, correct) {
    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(b => { 
        b.style.pointerEvents = 'none'; 
        if (b.innerText === correct) b.style.background = "#22c55e";
        else if (b.innerText === selected) b.style.background = "#ef4444";
        b.style.color = "white";
    });
    if(selected === correct) this.quizScore++;
    setTimeout(() => { this.quizIndex++; this.render(); }, 1000);
  }

  manualAddWord() {
    const eng = document.getElementById('newEng').value.trim();
    const arb = document.getElementById('newArb').value.trim();
    if (eng && arb) {
      this.userVocabulary.push({ id: "u-" + Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
      this.saveData();
      document.getElementById('newEng').value = '';
      document.getElementById('newArb').value = '';
      this.render();
    }
  }

  resetState() { this.quizIndex = 0; this.quizScore = 0; this.currentCardIndex = 0; this.isUnlockTest = false; }

  // --- العرض (Rendering) ---
  render() {
    const app = document.getElementById('app');
    if (!app) return;
    const lesson = window.lessonsData ? window.lessonsData[this.selectedLessonId] : null;
    const addedTerms = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
    const terms = [...(lesson?.terms || []), ...addedTerms];
    app.innerHTML = this.renderHeader(terms) + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader(terms) {
    const activeTermsCount = terms.filter(t => !this.masteredWords.includes(t.id)).length;
    return `
      <header class="header">
        <div class="header-content">
          <h2 data-action="goHome" style="cursor:pointer">English Booster</h2>
          ${this.selectedLessonId ? `
            <nav class="nav-menu">
              <button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button>
              <button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeTermsCount})</button>
              <button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button>
            </nav>` : ''}
        </div>
      </header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') {
      return `<main class="main-content">
        <div class="hero"><h1>خطة الاحتراف</h1></div>
        <button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:90%; margin: 10px auto; display:block;">📸 إضافة نص عبر الكاميرا</button>
        <div class="features-grid">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div>
      </main>`;
    }

    if (this.currentPage === 'addLesson') {
      return `<main class="main-content">
          <button class="hero-btn" data-action="goHome">← رجوع</button>
          <div class="reading-card" style="margin-top:20px;">
              <h3 style="text-align:center;">إضافة نص خاص</h3>
              <p id="ocr-status" style="text-align:center; color:#1e3a8a;"></p>
              <input type="file" id="imageInput" accept="image/*" capture="environment" style="display:none;" onchange="window.appInstance.scanImage(event)">
              <button class="hero-btn" onclick="document.getElementById('imageInput').click()" style="background:#8b5cf6; width:100%;">📸 تصوير النص</button>
              <textarea id="custom-text-input" placeholder="النص هنا..." style="width:100%; height:150px; margin:10px 0; padding:10px; border-radius:8px;"></textarea>
              <button class="hero-btn" onclick="window.appInstance.saveCustomLesson()" style="background:#16a34a; width:100%;">💾 حفظ الدرس</button>
          </div>
      </main>`;
    }

    if (this.currentPage === 'lessons') {
      const list = window.lessonsList[this.selectedLevel] || [];
      return `<main class="main-content">
        <button class="hero-btn" data-action="goHome">← رجوع</button>
        <div class="features-grid" style="margin-top:20px;">
            ${list.map(l => {
                const unlocked = this.isLessonUnlocked(l.id, this.selectedLevel);
                return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${unlocked ? '' : 'opacity:0.6; position:relative;'}">
                    <h3>${l.title}</h3>
                    ${unlocked ? '' : '<div style="position:absolute; top:5px; right:10px;">🔒</div>'}
                </div>`;
            }).join('')}
        </div></main>`;
    }

    if (this.currentPage === 'quiz') {
      if (!this.quizQuestions.length) return `<main class="main-content" style="text-align:center"><h2>لا توجد كلمات</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع</button></main>`;
      
      if (this.quizIndex >= this.quizQuestions.length) {
          const scorePercent = (this.quizScore / this.quizQuestions.length) * 100;
          if (this.isUnlockTest) {
              if (scorePercent >= 70) {
                  return `<main class="main-content" style="text-align:center"><h2>🎉 مبروك! (${scorePercent.toFixed(0)}%)</h2><button class="hero-btn" onclick="window.appInstance.unlockLesson('${this.tempLessonToUnlock}')">افتح الدرس</button></main>`;
              }
              return `<main class="main-content" style="text-align:center"><h2>😟 للاسف (${scorePercent.toFixed(0)}%)</h2><p>تحتاج 70% للنجاح</p><button class="hero-btn" data-action="goHome">رجوع</button></main>`;
          }
          return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore}/${this.quizQuestions.length}</h2><button class="hero-btn" data-action="goHome">الرئيسية</button></main>`;
      }

      const q = this.quizQuestions[this.quizIndex];
      let opts = [q, ...terms.filter(t => t.id !== q.id).sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());

      return `<main class="main-content">
        <div class="reading-card">
            <h3 style="text-align:center;">سؤال ${this.quizIndex + 1} من ${this.quizQuestions.length}</h3>
            <h1 style="text-align:center; margin:20px 0;">${q.english}</h1>
            <div class="options-grid">${opts.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div>
        </div></main>`;
    }

    if (this.currentPage === 'reading') {
      return `<main class="main-content" style="height:80vh; display:flex; flex-direction:column;">
          <div style="flex:1; overflow-y:auto; background:white; padding:15px; border-radius:12px; text-align:left;">${lesson?.content}</div>
          <div style="padding:10px; background:#f0fdf4; border-radius:12px; margin-top:10px;">
            <input type="text" id="newEng" placeholder="Word" style="width:100%; padding:8px; margin-bottom:5px;">
            <input type="text" id="newArb" placeholder="المعنى" style="width:100%; padding:8px; margin-bottom:5px;">
            <button class="hero-btn" data-action="addNewWord" style="background:#16a34a; width:100%; margin:0;">حفظ الكلمة</button>
          </div>
      </main>`;
    }

    if (this.currentPage === 'flashcards') {
        const active = terms.filter(t => !this.masteredWords.includes(t.id));
        if(!active.length) return `<main class="main-content" style="text-align:center"><h2>أنهيت الكلمات!</h2></main>`;
        const t = active[this.currentCardIndex] || active[0];
        return `<main class="main-content">
            <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
                <div class="flashcard">
                    <div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div>
                    <div class="flashcard-back"><h1>${t.arabic}</h1></div>
                </div>
            </div>
            <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex+1}/${active.length}</span><button class="hero-btn" data-action="nextC" data-total="${active.length}">التالي</button></div>
        </main>`;
    }
    
    return `<main class="main-content">جاري التحميل...</main>`;
  }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => { 
    if (window.levels && window.lessonsList) {
        window.appInstance = new App(); 
    } else {
        console.error("تحذير: ملفات البيانات (levels.js/lessons.js) لم تُحمل بعد.");
    }
});
