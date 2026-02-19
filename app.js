class App {
  constructor() {
    this.currentPage = 'home';
    this.selectedLevel = null;
    this.selectedLessonId = null;
    this.currentCardIndex = 0;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizQuestions = []; // مصفوفة لتخزين الأسئلة المجهزة للاختبار
    
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

  isLessonUnlocked(lessonId, levelId) {
    const levelLessons = window.lessonsList[levelId] || [];
    if (levelLessons.length > 0 && String(levelLessons[0].id) === String(lessonId)) return true;
    return this.unlockedLessons.includes(String(lessonId));
  }

  // ميزة الفتح: تجهيز مصفوفة أسئلة فريدة وغير مكررة
  prepareQuiz(terms) {
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

  toggleMastered(wordId) {
    if (this.masteredWords.includes(wordId)) {
      this.masteredWords = this.masteredWords.filter(id => id !== wordId);
    } else {
      this.masteredWords.push(wordId);
    }
    this.saveData();
    this.render();
  }

  deleteWord(wordId) {
    if (confirm('هل أنت متأكد من حذف هذه الكلمة نهائياً؟')) {
      this.userVocabulary = this.userVocabulary.filter(v => String(v.id) !== String(wordId));
      this.masteredWords = this.masteredWords.filter(id => id !== wordId);
      this.saveData();
      this.render();
    }
  }

  async scanImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusDiv = document.getElementById('ocr-status');
    statusDiv.innerText = "⏳ جاري قراءة النص... انتظر قليلاً";
    try {
      const result = await Tesseract.recognize(file, 'eng');
      document.getElementById('custom-text-input').value = result.data.text;
      statusDiv.innerText = "✅ تمت القراءة بنجاح!";
    } catch (e) { statusDiv.innerText = "❌ فشل في قراءة الصورة."; }
  }

  saveCustomLesson() {
    const text = document.getElementById('custom-text-input').value.trim();
    if (!text) return alert("الرجاء إضافة نص أولاً");
    const newId = "custom-" + Date.now();
    const newLesson = { id: newId, title: "نص مستورد " + new Date().toLocaleDateString('ar-EG'), content: text, terms: [] };
    if(!window.lessonsData) window.lessonsData = {};
    window.lessonsData[newId] = newLesson;
    this.unlockedLessons.push(newId);
    this.selectedLessonId = newId;
    this.currentPage = 'reading';
    this.saveData();
    this.render();
  }

  setupGlobalEvents() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const param = btn.dataset.param;

      if (action === 'selLevel') { this.selectedLevel = param; this.currentPage = 'lessons'; }
      else if (action === 'selLesson') { 
          if (this.isLessonUnlocked(param, this.selectedLevel)) {
              this.selectedLessonId = param; 
              this.currentPage = 'reading'; 
              this.resetState(); 
          } else {
              if (confirm('هذا الدرس مقفل. هل تريد خوض اختبار الفتح؟')) {
                  this.startUnlockTest(param);
              }
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
      else if (action === 'goHome') { this.selectedLevel = null; this.selectedLessonId = null; this.currentPage = 'home'; this.isUnlockTest = false; }
      else if (action === 'nextC') { this.nextCard(btn.dataset.total); }
      else if (action === 'prevC') { this.prevCard(); }
      else if (action === 'speak') { 
          const utterance = new SpeechSynthesisUtterance(param);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance); 
      }
      else if (action === 'ansQ') { this.handleAnswer(btn, param, btn.dataset.correct); }
      else if (action === 'resetQ') { 
          const lesson = window.lessonsData[this.selectedLessonId];
          const added = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
          this.prepareQuiz([...(lesson?.terms || []), ...added]);
          this.render();
      }
      else if (action === 'addNewWord') { this.manualAddWord(); }
      else if (action === 'masterWord') { this.toggleMastered(param); }
      else if (action === 'deleteWord') { this.deleteWord(param); }
      
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
      if (data.responseData.translatedText) arbInput.value = data.responseData.translatedText;
    } catch (e) { arbInput.placeholder = "اكتب الترجمة يدوياً"; }
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

  resetState() { 
      this.quizIndex = 0; 
      this.quizScore = 0; 
      this.currentCardIndex = 0; 
      this.isUnlockTest = false; 
      this.quizQuestions = [];
  }

  render() {
    const app = document.getElementById('app');
    const lesson = window.lessonsData ? window.lessonsData[this.selectedLessonId] : null;
    const addedTerms = this.userVocabulary.filter(v => String(v.lessonId) === String(this.selectedLessonId));
    const terms = [...(lesson?.terms || []), ...addedTerms];
    app.innerHTML = this.renderHeader(terms) + `<div id="view">${this.renderView(lesson, terms)}</div>`;
  }

  renderHeader(terms) {
    const isLesson = this.selectedLessonId;
    const activeTermsCount = terms.filter(t => !this.masteredWords.includes(t.id)).length;
    return `<header class="header"><div class="header-content"><h2 data-action="goHome" style="cursor:pointer">English Booster</h2>${isLesson ? `<nav class="nav-menu"><button class="nav-btn ${this.currentPage==='reading'?'active':''}" data-action="setPage" data-param="reading">النص</button><button class="nav-btn ${this.currentPage==='flashcards'?'active':''}" data-action="setPage" data-param="flashcards">البطاقات (${activeTermsCount})</button><button class="nav-btn ${this.currentPage==='quiz'?'active':''}" data-action="setPage" data-param="quiz">الاختبار</button></nav>` : ''}</div></header>`;
  }

  renderView(lesson, terms) {
    if (this.currentPage === 'home') {
      return `<main class="main-content">
        <div class="hero"><h1>خطة الاحتراف</h1></div>
        <div style="text-align:center; margin-bottom:20px;">
            <button class="hero-btn" data-action="setPage" data-param="addLesson" style="background:#8b5cf6; width:90%;">📸 إضافة نص عبر الكاميرا</button>
        </div>
        <div class="features-grid">${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><div style="font-size:3rem">${l.icon}</div><h3>${l.name}</h3></div>`).join('')}</div>
      </main>`;
    }
    
    if (this.currentPage === 'addLesson') {
      return `<main class="main-content">
          <button class="hero-btn" data-action="goHome">← رجوع</button>
          <div class="reading-card" style="margin-top:20px;">
              <h3 style="text-align:center;">إضافة نص خاص</h3>
              <p id="ocr-status" style="font-size:0.8rem; color:#1e3a8a; text-align:center; min-height:20px;"></p>
              <input type="file" id="imageInput" accept="image/*" capture="environment" style="display:none;" onchange="window.appInstance.scanImage(event)">
              <div style="display:flex; flex-direction:column; gap:10px;">
                  <button class="hero-btn" onclick="document.getElementById('imageInput').click()" style="background:#8b5cf6; margin:0;">📸 تصوير نص بالكاميرا</button>
                  <textarea id="custom-text-input" placeholder="النص سيظهر هنا..." style="width:100%; height:200px; border-radius:12px; padding:12px; border:1px solid #ddd; direction:ltr; text-align:left;"></textarea>
                  <button class="hero-btn" onclick="window.appInstance.saveCustomLesson()" style="background:#16a34a; margin:0;">💾 حفظ كدرس</button>
              </div>
          </div>
      </main>`;
    }

    if (this.currentPage === 'lessons') {
      const list = window.lessonsList ? window.lessonsList[this.selectedLevel] : [];
      return `<main class="main-content">
        <button class="hero-btn" data-action="goHome">← رجوع</button>
        <div class="features-grid" style="margin-top:20px;">
            ${list.map(l => {
                const unlocked = this.isLessonUnlocked(l.id, this.selectedLevel);
                return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${unlocked ? '' : 'opacity:0.6; position:relative;'}">
                    <h3>${l.title}</h3>
                    ${unlocked ? '' : '<div style="font-size:1.5rem; position:absolute; top:5px; right:10px;">🔒</div>'}
                </div>`;
            }).join('')}
        </div></main>`;
    }

    if (this.currentPage === 'reading') {
        if (!lesson) return `<main class="main-content">النص غير موجود</main>`;
        return `<main class="main-content" style="padding: 10px; height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><button class="hero-btn" data-action="setPage" data-param="lessons" style="margin:0; padding: 4px 12px; font-size: 0.8rem;">← رجوع</button><h3>${lesson.title}</h3></div>
            <div style="flex-grow: 1; overflow-y: auto; background: white; padding: 15px; border-radius: 12px; border: 1px solid #eee; text-align: left; direction: ltr;">${lesson.content}</div>
            <div style="background: #f0fdf4; padding: 12px; border-radius: 12px; border: 2px solid #bbf7d0; margin-top:10px;">
              <input type="text" id="newEng" placeholder="Word" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-bottom:5px;">
              <input type="text" id="newArb" placeholder="المعنى" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-bottom:5px;">
              <button class="hero-btn" data-action="addNewWord" style="background: #16a34a; width:100%; margin:0;">حفظ الكلمة</button>
            </div></main>`;
    }

    if (this.currentPage === 'flashcards') {
        const activeTerms = terms.filter(t => !this.masteredWords.includes(t.id));
        if (!activeTerms.length) return `<main class="main-content" style="text-align:center;"><h2>🎉 بطل!</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع</button></main>`;
        const t = activeTerms[this.currentCardIndex] || activeTerms[0];
        return `<main class="main-content">
            <div class="flashcard-container" onclick="this.classList.toggle('flipped')"><div class="flashcard"><div class="flashcard-front"><h1>${t.english}</h1><button class="hero-btn" data-action="speak" data-param="${t.english}">🔊</button></div><div class="flashcard-back"><h1>${t.arabic}</h1></div></div></div>
            <div style="display:flex; justify-content:center; gap:10px; margin: 15px 0;">
                <button class="hero-btn" data-action="masterWord" data-param="${t.id}" style="background:#059669;">✅ حفظتها</button>
                <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#dc2626;">🗑️ حذف</button>
            </div>
            <div class="controls"><button class="hero-btn" data-action="prevC">السابق</button><span>${this.currentCardIndex + 1} / ${activeTerms.length}</span><button class="hero-btn" data-action="nextC" data-total="${activeTerms.length}">التالي</button></div>
        </main>`;
    }

    if (this.currentPage === 'quiz') {
      if (!this.quizQuestions.length) return `<main class="main-content" style="text-align:center"><h2>لا توجد كلمات كافية للاختبار</h2><button class="hero-btn" data-action="setPage" data-param="reading">رجوع</button></main>`;

      if (this.quizIndex >= this.quizQuestions.length) {
          const scorePercent = (this.quizScore / this.quizQuestions.length) * 100;
          if (this.isUnlockTest) {
              if (scorePercent >= 70) {
                  return `<main class="main-content" style="text-align:center"><h2>🎉 مبروك! نجحت بنسبة ${scorePercent.toFixed(0)}%</h2><p>تم فتح الدرس بنجاح.</p><button class="hero-btn" onclick="window.appInstance.unlockLesson('${this.tempLessonToUnlock}')">ادخل للدرس</button></main>`;
              } else {
                  return `<main class="main-content" style="text-align:center"><h2>😟 للاسف، نتيجتك ${scorePercent.toFixed(0)}%</h2><p>يجب أن تحصل على 70% لفتح هذا الدرس.</p><button class="hero-btn" data-action="goHome">العودة للرئيسية</button></main>`;
              }
          }
          return `<main class="main-content" style="text-align:center"><h2>النتيجة: ${this.quizScore} من ${this.quizQuestions.length}</h2><button class="hero-btn" data-action="resetQ">إعادة الاختبار</button></main>`;
      }

      const q = this.quizQuestions[this.quizIndex];
      // توليد خيارات من مصفوفة الأسئلة لضمان عدم التكرار الخارجي
      let opts = [q];
      let otherPool = terms.filter(t => t.id !== q.id);
      let randomOthers = otherPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      opts = [...opts, ...randomOthers].sort(() => 0.5 - Math.random());

      return `<main class="main-content">
        <div class="reading-card">
            <h3 style="text-align:center; color:#6b7280; margin-bottom:10px;">السؤال ${this.quizIndex + 1} من ${this.quizQuestions.length}</h3>
            <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:20px;">
                <h1>${q.english}</h1><button class="hero-btn" data-action="speak" data-param="${q.english}">🔊</button>
            </div>
            <div class="options-grid">${opts.map(o => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${o.arabic}" data-correct="${q.arabic}">${o.arabic}</button>`).join('')}</div>
        </div></main>`;
    }
  }

  handleAnswer(btn, selected, correct) {
    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(b => { 
        b.style.pointerEvents = 'none'; 
        if (b.innerText === correct) {
            b.style.background = "#22c55e"; 
            b.style.color = "white";
        } else if (b.innerText === selected) {
            b.style.background = "#ef4444"; 
            b.style.color = "white";
        }
    });
    
    if(selected === correct) this.quizScore++;
    
    // الانتقال بعد 1 ثانية بالضبط لإتاحة الفرصة لرؤية الجواب
    setTimeout(() => { 
        this.quizIndex++; 
        this.render(); 
    }, 1000);
  }

  nextCard(total) { if (this.currentCardIndex < total - 1) this.currentCardIndex++; }
  prevCard() { if (this.currentCardIndex > 0) this.currentCardIndex--; }
}
