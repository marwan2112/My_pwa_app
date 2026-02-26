
class App {
    constructor() {
        this.placementStep = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.placementScore = 0;
        this.theme = localStorage.getItem('theme') || 'light';
        this.jumbleArabicHint = ''; // الترجمة العربية للجملة كمساعدة

        // تعريف الإحصائيات (XP والنقاط) والسجل
        this.userStats = JSON.parse(localStorage.getItem('userStats')) || { xp: 0, level: 1, badges: [] };
        this.placementResults = JSON.parse(localStorage.getItem('placementResults')) || [];
        this.placementFullHistory = JSON.parse(localStorage.getItem('placementFullHistory')) || [];
        this.currentPlacementDetails = [];
        this.viewingPlacementDetails = null;

        // نظام العملات (اللآلئ)
        this.userCoins = JSON.parse(localStorage.getItem('userCoins')) || 0;

        // متغيرات خاصة بميزة إعادة ترتيب الجمل
        this.jumbleOriginalSentence = '';
        this.jumbleWords = [];
        this.jumbleUserAnswer = [];
        this.jumbleChecked = false;
        this.jumbleCorrect = false;
        this.jumbleHintUsed = false;
        this.jumbleHistory = []; // سجل الجمل المستخدمة

        // متغيرات خاصة بميزة الاستماع
        this.listeningRemaining = [];
        this.listeningCurrent = null;
        this.listeningOptions = [];
        this.listeningAnswered = false;
        this.listeningTimer = null;
        this.listeningErrorTimer = null;
        this.listeningUnlocked = false; // لتحديد إذا كان قد دفع للدخول لهذا الدرس

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    updateProgress(points) {
        this.userStats.xp += points;
        this.userStats.level = Math.floor(this.userStats.xp / 100) + 1;
        const totalMastered = this.masteredWords ? this.masteredWords.length : 0;
        if (totalMastered >= 10 && !this.userStats.badges.includes('🥉')) this.userStats.badges.push('🥉');
        if (totalMastered >= 50 && !this.userStats.badges.includes('🥈')) this.userStats.badges.push('🥈');
        if (totalMastered >= 100 && !this.userStats.badges.includes('🥇')) this.userStats.badges.push('🥇');
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    init() {
        // إضافة CSS للوضع الليلي
        this.addThemeStyles();

        document.documentElement.setAttribute('data-theme', this.theme);
        
        if (!window.levels || !window.lessonsData || !window.placementBank) {
            setTimeout(() => this.init(), 500);
            return;
        }

        this.userData = JSON.parse(localStorage.getItem('userAccount')) || null;
        this.userVocabulary = JSON.parse(localStorage.getItem('userVocab')) || [];
        this.masteredWords = JSON.parse(localStorage.getItem('masteredWords')) || [];
        this.unlockedLessons = JSON.parse(localStorage.getItem('unlockedLessons')) || [];
        this.hiddenFromCards = JSON.parse(localStorage.getItem('hiddenFromCards')) || [];
        this.customLessons = JSON.parse(localStorage.getItem('customLessons')) || {}; 

        Object.assign(window.lessonsData, this.customLessons);

        this.currentPage = this.userData ? 'home' : 'auth';
        this.selectedLevel = null;
        this.selectedLessonId = null;
        this.currentCardIndex = 0;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.quizOptions = [];
        this.isWaiting = false;
        this.scrollPos = 0; 
        this.isUnlockTest = false; 
        this.tempLessonToUnlock = null;
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.setupGlobalEvents();
        this.render();
    }

    addThemeStyles() {
        const styleId = 'theme-dynamic-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            [data-theme="dark"] body {
                background-color: #121212 !important;
                color: #ffffff !important;
            }
            [data-theme="dark"] .header {
                background-color: #1e1e1e !important;
                border-bottom: 1px solid #333 !important;
            }
            [data-theme="dark"] .reading-card,
            [data-theme="dark"] .feature-card,
            [data-theme="dark"] .quiz-box,
            [data-theme="dark"] .flashcard-container,
            [data-theme="dark"] .jumble-card {
                background-color: #1e1e1e !important;
                color: #ffffff !important;
                border-color: #444 !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }
            [data-theme="dark"] .hero-btn,
            [data-theme="dark"] .quiz-opt-btn,
            [data-theme="dark"] .nav-btn {
                background-color: #333 !important;
                color: #fff !important;
                border-color: #555 !important;
            }
            [data-theme="dark"] .hero-btn:hover,
            [data-theme="dark"] .quiz-opt-btn:hover {
                background-color: #444 !important;
            }
            [data-theme="dark"] input,
            [data-theme="dark"] textarea {
                background-color: #2d2d2d !important;
                color: #fff !important;
                border-color: #555 !important;
            }
            [data-theme="dark"] .flashcard-front,
            [data-theme="dark"] .flashcard-back {
                background-color: #2d2d2d !important;
                color: #fff !important;
            }
            [data-theme="dark"] .logout-btn {
                background-color: #4a4a4a !important;
                color: #fff !important;
            }
            [data-theme="dark"] .welcome-banner {
                background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
            }
            
            /* أنماط جديدة للوجو والاسم */
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
            }
            .logo-container {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }
            .logo-container img {
                height: 40px;
                width: auto;
                transition: transform 0.3s;
            }
            .logo-container:hover img {
                transform: scale(1.05);
            }
            .logo-container h2 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: bold;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            [data-theme="dark"] .logo-container h2 {
                background: linear-gradient(135deg, #ffd700, #fbbf24);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            /* أنماط صفحة Auth */
            .auth-container {
                text-align: center;
                margin-bottom: 30px;
            }
            .auth-container img {
                height: 100px;
                width: auto;
                margin-bottom: 15px;
            }
            .auth-container h1 {
                font-size: 2.5rem;
                margin: 0;
                color: #1e40af;
            }
            .auth-container p {
                font-size: 1.2rem;
                color: #64748b;
            }
            [data-theme="dark"] .auth-container h1 {
                color: #ffd700;
            }
            [data-theme="dark"] .auth-container p {
                color: #ccc;
            }
            .auth-card {
                max-width: 400px;
                margin: 0 auto;
            }
        `;
        document.head.appendChild(style);
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        if (this.userData) localStorage.setItem('userAccount', JSON.stringify(this.userData));
        localStorage.setItem('userCoins', JSON.stringify(this.userCoins));
    }

    speak(text) {
        if (!text) return;
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
    }

    async translateAuto(text, targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;
        if (!text.trim()) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = "";
            else el.innerText = "";
            return;
        }
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
            const data = await res.json();
            const translatedText = data.responseData.translatedText;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = translatedText;
            else el.innerText = translatedText;
        } catch (e) {}
    }

    // دالة جديدة للترجمة بدون الحاجة لعنصر DOM
    async translateText(text) {
        if (!text) return '';
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
            const data = await res.json();
            return data.responseData.translatedText || '';
        } catch (e) {
            return '';
        }
    }

    playTone(type) {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
        } else {
            osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(110, this.audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
        }

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
    }

    getCorrectAnswer(q) {
        return q.correct || q.answer || q.a || q.right || q.rightAnswer || '';
    }

    getAdaptiveQuestion() {
        const levelQuestions = window.placementBank[this.currentDifficulty];
        if (!levelQuestions || levelQuestions.length === 0) {
            return window.placementBank['A1'][0];
        }
        const available = levelQuestions.filter(q => !this.placementHistory.includes(q.q));
        const list = available.length > 0 ? available : levelQuestions;
        const selected = list[Math.floor(Math.random() * list.length)];
        this.placementHistory.push(selected.q);
        const correctAnswer = this.getCorrectAnswer(selected);
        this.currentPlacementDetails.push({
            level: this.currentDifficulty,
            question: selected.q,
            options: selected.options || [selected.a, selected.b, selected.c, selected.d].filter(o => o !== undefined),
            correct: correctAnswer,
            selected: null,
            isCorrect: null
        });
        return selected;
    }

    handlePlacement(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());

        this.playTone(isCorrect ? 'correct' : 'error');
        if (isCorrect) this.placementScore++;

        const allOptions = document.querySelectorAll('.quiz-opt-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.correct === correct) {
                btn.style.backgroundColor = '#10b981';
                btn.style.color = 'white';
                btn.style.borderColor = '#059669';
            } else if (btn.dataset.param === selected && btn.dataset.correct !== correct) {
                btn.style.backgroundColor = '#ef4444';
                btn.style.color = 'white';
                btn.style.borderColor = '#b91c1c';
            } else {
                btn.style.opacity = '0.7';
            }
        });

        if (this.currentPlacementDetails.length > 0) {
            const last = this.currentPlacementDetails[this.currentPlacementDetails.length - 1];
            last.selected = selected;
            last.isCorrect = isCorrect;
        }

        setTimeout(() => {
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            let idx = levels.indexOf(this.currentDifficulty);
            if (idx === -1) idx = 0;

            if (isCorrect && idx < levels.length - 1) {
                this.currentDifficulty = levels[idx + 1];
            } else if (!isCorrect && idx > 0) {
                this.currentDifficulty = levels[idx - 1];
            }

            this.placementStep++;

            if (this.placementStep >= 25) {
                const res = {
                    level: this.currentDifficulty,
                    date: new Date().toLocaleString('ar-EG'),
                    score: this.placementScore,
                    ielts: this.getIeltsEquivalent(this.currentDifficulty),
                    details: this.currentPlacementDetails
                };
                this.placementResults.unshift(res);
                this.placementFullHistory.push(res);
                localStorage.setItem('placementResults', JSON.stringify(this.placementResults));
                localStorage.setItem('placementFullHistory', JSON.stringify(this.placementFullHistory));
                this.currentPlacementDetails = [];
            }

            this.isWaiting = false;
            this.render();
        }, 1200);
    }

    getIeltsEquivalent(level) {
        const map = { 'A1': '2.0-3.0', 'A2': '3.0-4.0', 'B1': '4.0-5.0', 'B2': '5.5-6.5', 'C1': '7.0-8.0', 'C2': '8.5-9.0' };
        return map[level];
    }

    prepareQuiz(terms, isUnlockMode = false) {
        this.isUnlockTest = isUnlockMode;
        const addedByUser = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const fullPool = [...terms, ...addedByUser].filter(t => !this.hiddenFromCards.includes(String(t.id)));
        
        if (this.isUnlockTest) {
            this.quizQuestions = fullPool.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(fullPool.length/2)));
        } else {
            this.quizQuestions = fullPool;
        }
        this.quizIndex = 0; 
        this.quizScore = 0;
        this.generateOptions();
    }

    generateOptions() {
        if (this.quizIndex >= this.quizQuestions.length) return;
        const currentQ = this.quizQuestions[this.quizIndex];
        const lesson = window.lessonsData[this.selectedLessonId] || { terms: [] };
        let allArb = [...lesson.terms, ...this.userVocabulary].map(t => t.arabic);
        let wrongs = [...new Set(allArb.filter(a => a !== currentQ.arabic))].sort(() => 0.5 - Math.random()).slice(0, 3);
        while(wrongs.length < 3) wrongs.push("خيار " + (wrongs.length + 1));
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());
        if (isCorrect) { 
            this.quizScore++; 
            this.playTone('correct'); 
            btnElement.classList.add('correct-flash');
        } else { 
            this.playTone('error'); 
            btnElement.classList.add('wrong-flash');
        }
        setTimeout(() => { 
            this.quizIndex++; 
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions(); 
            this.isWaiting = false; 
            this.render(); 
        }, 1100);
    }

    // ================== دوال إعادة ترتيب الجمل ==================
    prepareJumble() {
        const lesson = window.lessonsData[this.selectedLessonId];
        if (!lesson) return;

        // محاولة استخراج جمل مفيدة من النص
        const sentences = lesson.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
        // نختار جملة قصيرة ذات معنى (3-7 كلمات)
        const usefulSentences = sentences.filter(s => {
            const words = s.split(/\s+/).length;
            return words >= 3 && words <= 7;
        });

        let availableSentences = usefulSentences.length > 0 ? usefulSentences : sentences;
        if (availableSentences.length === 0) {
            // نبني جملة من الكلمات
            const words = lesson.terms.slice(0, 4).map(t => t.english);
            this.jumbleOriginalSentence = words.join(' ');
        } else {
            // إزالة الجمل المستخدمة سابقاً من القائمة المتاحة
            const unused = availableSentences.filter(s => !this.jumbleHistory.includes(s));
            if (unused.length === 0) {
                // إذا استنفذت كل الجمل، نعيد تعيين التاريخ
                this.jumbleHistory = [];
                this.jumbleOriginalSentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
            } else {
                this.jumbleOriginalSentence = unused[Math.floor(Math.random() * unused.length)];
            }
            // إضافة الجملة إلى التاريخ
            this.jumbleHistory.push(this.jumbleOriginalSentence);
        }

        // ترجمة الجملة إلى العربية للمساعدة
        this.translateText(this.jumbleOriginalSentence).then(translated => {
            this.jumbleArabicHint = translated;
            this.render(); // إعادة الرسم بعد الترجمة
        }).catch(() => {
            this.jumbleArabicHint = '';
            this.render();
        });

        this.jumbleWords = this.jumbleOriginalSentence.split(/\s+/).filter(w => w.length > 0);
        this.shuffleArray(this.jumbleWords);
        this.jumbleUserAnswer = [];
        this.jumbleChecked = false;
        this.jumbleCorrect = false;
        this.jumbleHintUsed = false;
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    handleJumbleSelect(word) {
        if (this.jumbleChecked) return;
        const index = this.jumbleWords.indexOf(word);
        if (index !== -1) {
            this.jumbleWords.splice(index, 1);
            this.jumbleUserAnswer.push(word);
            this.render();
        }
    }

    // إزالة كلمة من المربع العلوي عند النقر عليها (بدون زر)
    handleJumbleRemove(word) {
        if (this.jumbleChecked) return;
        const index = this.jumbleUserAnswer.indexOf(word);
        if (index !== -1) {
            this.jumbleUserAnswer.splice(index, 1);
            this.jumbleWords.push(word);
            this.render();
        }
    }

    handleJumbleReset() {
        this.jumbleWords = this.jumbleOriginalSentence.split(/\s+/).filter(w => w.length > 0);
        this.shuffleArray(this.jumbleWords);
        this.jumbleUserAnswer = [];
        this.jumbleChecked = false;
        this.jumbleCorrect = false;
        this.jumbleHintUsed = false;
        this.render();
    }

    handleJumbleCheck() {
        if (this.jumbleChecked) return;
        const userSentence = this.jumbleUserAnswer.join(' ');
        const isCorrect = (userSentence.toLowerCase().trim() === this.jumbleOriginalSentence.toLowerCase().trim());
        this.jumbleChecked = true;
        this.jumbleCorrect = isCorrect;
        this.playTone(isCorrect ? 'correct' : 'error');
        if (isCorrect) {
            this.updateProgress(5);
        }
        this.render();
    }

    handleJumbleHint() {
        if (this.jumbleChecked) return;
        if (this.jumbleHintUsed) return;
        this.jumbleHintUsed = true;
        // نعرض أول كلمة من الجملة الأصلية في المربع العلوي
        const firstWord = this.jumbleOriginalSentence.split(/\s+/)[0];
        if (firstWord && !this.jumbleUserAnswer.includes(firstWord)) {
            // ننقل الكلمة الأولى من الأسفل إلى الأعلى إذا كانت موجودة
            const index = this.jumbleWords.indexOf(firstWord);
            if (index !== -1) {
                this.jumbleWords.splice(index, 1);
                this.jumbleUserAnswer.push(firstWord);
            }
        }
        this.render();
    }

    handleJumbleNext() {
        this.prepareJumble();
        this.render();
    }

    // ================== دوال اختبار الاستماع ==================
    prepareListeningQuiz() {
        if (this.listeningTimer) {
            clearTimeout(this.listeningTimer);
            this.listeningTimer = null;
        }
        if (this.listeningErrorTimer) {
            clearTimeout(this.listeningErrorTimer);
            this.listeningErrorTimer = null;
        }

        const lesson = window.lessonsData[this.selectedLessonId];
        if (!lesson) return;

        const allTerms = [...lesson.terms, ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)];
        const available = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));

        if (available.length === 0) {
            alert('لا توجد كلمات متاحة للاستماع. قم بإضافة كلمات جديدة أو إعادة تعيين الكلمات المتقنة.');
            return;
        }

        if (this.listeningRemaining.length === 0) {
            this.listeningRemaining = [...available].sort(() => 0.5 - Math.random());
        }

        this.listeningCurrent = this.listeningRemaining[0];
        this.listeningAnswered = false;

        const otherTerms = allTerms.filter(t => t.id !== this.listeningCurrent.id);
        const shuffled = [...otherTerms].sort(() => 0.5 - Math.random());
        const wrongOptions = shuffled.slice(0, 3).map(t => t.arabic);
        while (wrongOptions.length < 3) wrongOptions.push('???');
        this.listeningOptions = [this.listeningCurrent.arabic, ...wrongOptions].sort(() => 0.5 - Math.random());

        this.speak(this.listeningCurrent.english);
    }

    handleListeningAnswer(selectedArabic) {
        if (this.listeningAnswered || !this.listeningCurrent) return;
        this.listeningAnswered = true;

        const isCorrect = (selectedArabic === this.listeningCurrent.arabic);
        this.playTone(isCorrect ? 'correct' : 'error');

        const allOptions = document.querySelectorAll('.listening-opt-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.param === this.listeningCurrent.arabic) {
                btn.style.backgroundColor = '#10b981';
                btn.style.color = 'white';
                btn.style.borderColor = '#059669';
            } else if (btn.dataset.param === selectedArabic && !isCorrect) {
                btn.style.backgroundColor = '#ef4444';
                btn.style.color = 'white';
                btn.style.borderColor = '#b91c1c';
            } else {
                btn.style.backgroundColor = '#555';
                btn.style.color = '#ccc';
            }
        });

        if (isCorrect) {
            // الإجابة صحيحة: نزيل الكلمة من القائمة وننتقل للتي تليها بعد 2.5 ثانية
            this.listeningRemaining.shift();
            this.updateProgress(5);

            this.listeningTimer = setTimeout(() => {
                this.listeningTimer = null;
                if (this.listeningRemaining.length === 0) {
                    alert('🎉 تهانينا! أكملت جميع الكلمات.');
                    this.currentPage = 'reading';
                } else {
                    this.prepareListeningQuiz();
                }
                this.render();
            }, 2500);
        } else {
            // الإجابة خاطئة: لا نغير القائمة، وبعد 1.5 ثانية نعيد تعيين الأزرار ليمكن المحاولة مرة أخرى
            this.listeningErrorTimer = setTimeout(() => {
                this.listeningErrorTimer = null;
                this.listeningAnswered = false; // السماح بإعادة المحاولة
                // إعادة تعيين ألوان الأزرار
                allOptions.forEach(btn => {
                    btn.disabled = false;
                    btn.style.backgroundColor = ''; // إزالة الألوان المخصصة
                    btn.style.color = '';
                    btn.style.borderColor = '';
                });
                // إعادة تشغيل الصوت تلقائياً؟ يمكن اختيارياً:
                // this.speak(this.listeningCurrent.english);
                this.render();
            }, 1500);
        }
    }

    // دالة لفتح اختبار الاستماع بالعملات
    unlockListening() {
        if (this.listeningUnlocked) return true; // مفتوح بالفعل
        if (this.userCoins >= 50) {
            if (confirm('هل تريد فتح اختبار الاستماع لهذا الدرس باستخدام 50 لؤلؤة؟')) {
                this.userCoins -= 50;
                this.listeningUnlocked = true;
                this.saveData();
                this.prepareListeningQuiz();
                this.render();
                return true;
            } else {
                return false;
            }
        } else {
            alert(`❌ ليس لديك لآلئ كافية! تحتاج 50 لؤلؤة. رصيدك الحالي: ${this.userCoins}`);
            return false;
        }
    }

    // دالة لفتح الترتيب بالعملات
    unlockJumble() {
        if (this.jumbleUnlocked) return true;
        if (this.userCoins >= 50) {
            if (confirm('هل تريد فتح تمرين ترتيب الجمل لهذا الدرس باستخدام 50 لؤلؤة؟')) {
                this.userCoins -= 50;
                this.jumbleUnlocked = true;
                this.saveData();
                this.prepareJumble();
                this.render();
                return true;
            } else {
                return false;
            }
        } else {
            alert(`❌ ليس لديك لآلئ كافية! تحتاج 50 لؤلؤة. رصيدك الحالي: ${this.userCoins}`);
            return false;
        }
    }

    // التحقق من إكمال الدرس (جميع الكلمات mastered)
    isLessonCompleted(lessonId) {
        const lesson = window.lessonsData[lessonId];
        if (!lesson) return false;
        const allTermIds = lesson.terms.map(t => String(t.id));
        // التحقق إذا كانت جميع كلمات الدرس موجودة في masteredWords
        return allTermIds.every(id => this.masteredWords.includes(id));
    }

    // منح مكافأة إكمال الدرس (مرة واحدة فقط)
    grantLessonCompletionReward(lessonId) {
        const key = `lesson_completed_${lessonId}`;
        if (!localStorage.getItem(key) && this.isLessonCompleted(lessonId)) {
            this.userCoins += 20;
            localStorage.setItem(key, 'true');
            this.saveData();
            alert(`🎉 أحسنت! أكملت جميع كلمات الدرس وحصلت على 20 لؤلؤة إضافية.`);
        }
    }

    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total, index } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }

            switch(action) {
                case 'masterWord':
                    if (!this.masteredWords.includes(String(param))) {
                        this.masteredWords.push(String(param));
                        this.updateProgress(10);
                        this.saveData();
                        // بعد إتقان كلمة، نتحقق إذا اكتمل الدرس
                        if (this.selectedLessonId) {
                            this.grantLessonCompletionReward(this.selectedLessonId);
                        }
                    }
                    break;

                case 'goHome': 
                    this.currentPage = 'home'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false;
                    this.viewingPlacementDetails = null;
                    break;

                case 'logout': 
                    if(confirm('سيتم حذف التقدم، متأكد؟')){ localStorage.clear(); location.reload(); } 
                    break;

                case 'selLevel': 
                    this.selectedLevel = param; 
                    this.currentPage = (param === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    break;

                case 'toggleTheme':
                    this.toggleTheme();
                    break;

                case 'selLesson':
                    this.scrollPos = window.scrollY;
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const isUnlocked = this.unlockedLessons.includes(String(param)) || (list[0] && list[0].id == param) || this.selectedLevel === 'custom_list';
                    if (isUnlocked) { 
                        this.selectedLessonId = param; 
                        this.currentPage = 'reading'; 
                        this.isUnlockTest = false;

                        // إعادة تعيين حالة الدفع للتمارين الخاصة بهذا الدرس
                        this.listeningUnlocked = false;
                        this.jumbleUnlocked = false;
                        this.jumbleHistory = []; // إعادة تعيين تاريخ الجمل لكل درس جديد
                    } else {
                        const curIdx = list.findIndex(l => l.id == param);
                        const prevId = list[curIdx - 1].id;
                        this.tempLessonToUnlock = param; 
                        this.selectedLessonId = prevId;
                        this.prepareQuiz(window.lessonsData[prevId].terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;

                case 'setPage':
                    if (param === 'listening' && this.selectedLessonId) {
                        if (!this.listeningUnlocked) {
                            if (!this.unlockListening()) return;
                        } else {
                            this.prepareListeningQuiz();
                        }
                    } else if (param === 'jumble' && this.selectedLessonId) {
                        if (!this.jumbleUnlocked) {
                            if (!this.unlockJumble()) return;
                        } else {
                            this.prepareJumble();
                        }
                    } else if (param === 'quiz' && this.selectedLessonId) {
                        this.prepareQuiz(window.lessonsData[this.selectedLessonId].terms, false);
                    }
                    this.currentPage = param;
                    this.currentCardIndex = 0; 
                    break;

                case 'masterWordFlash': 
                    const cardM = document.querySelector('.flashcard-container');
                    if(cardM) {
                        cardM.classList.add('master-anim');
                        setTimeout(() => {
                            if(!this.masteredWords.includes(String(param))) {
                                this.masteredWords.push(String(param));
                                this.updateProgress(10);
                                this.saveData();
                                if (this.selectedLessonId) {
                                    this.grantLessonCompletionReward(this.selectedLessonId);
                                }
                            }
                            this.render();
                        }, 550);
                    }
                    return; 

                case 'deleteWord': 
                    if(confirm('حذف نهائي من البطاقات؟')) { 
                        const cardD = document.querySelector('.flashcard-container');
                        if(cardD) {
                            cardD.classList.add('delete-anim');
                            setTimeout(() => {
                                this.hiddenFromCards.push(String(param)); 
                                this.saveData(); this.render(); 
                            }, 550);
                        }
                    } 
                    return;

                case 'speak': 
                    this.speak(param); 
                    break;

                case 'nextC': 
                    const cardNext = document.querySelector('.flashcard-container');
                    if(cardNext) {
                        cardNext.classList.add('slide-next');
                        setTimeout(() => {
                            if (this.currentCardIndex < (parseInt(total) - 1)) this.currentCardIndex++; 
                            this.render();
                        }, 400);
                    }
                    return;

                case 'prevC': 
                    const cardPrev = document.querySelector('.flashcard-container');
                    if(cardPrev) {
                        cardPrev.classList.add('slide-prev');
                        setTimeout(() => {
                            if (this.currentCardIndex > 0) this.currentCardIndex--; 
                            this.render();
                        }, 400);
                    }
                    return;

                case 'restartCards': 
                    const cardShuffle = document.querySelector('.flashcard-container');
                    if(cardShuffle) cardShuffle.classList.add('shuffle-anim-card');
                    setTimeout(() => {
                        if(param === 'all') {
                            const lessonWords = window.lessonsData[this.selectedLessonId].terms.map(t => String(t.id));
                            this.masteredWords = this.masteredWords.filter(id => !lessonWords.includes(id));
                        }
                        this.currentCardIndex = 0;
                        this.saveData(); this.render();
                    }, 600);
                    return;

                case 'addNewWord':
                    this.handleNewWord();
                    break;

                case 'backToLessons': 
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons'; 
                    this.selectedLessonId = null; 
                    this.isUnlockTest = false;
                    this.render(); 
                    setTimeout(() => window.scrollTo(0, this.scrollPos), 50);
                    return;

                case 'doAuth': 
                    this.handleAuth(); 
                    return;

                case 'doPlacement':
                    this.handlePlacement(param, correct, btn);
                    return;

                case 'viewPlacementDetails':
                    const record = this.placementResults[parseInt(index)];
                    if (record) {
                        this.viewingPlacementDetails = record;
                        this.currentPage = 'placement_details';
                        this.render();
                    }
                    break;

                case 'backFromDetails':
                    this.viewingPlacementDetails = null;
                    this.currentPage = 'placement_test';
                    this.render();
                    break;

                case 'jumbleSelect':
                    this.handleJumbleSelect(param);
                    break;
                case 'jumbleRemove':
                    this.handleJumbleRemove(param);
                    break;
                case 'jumbleReset':
                    this.handleJumbleReset();
                    break;
                case 'jumbleCheck':
                    this.handleJumbleCheck();
                    break;
                case 'jumbleHint':
                    this.handleJumbleHint();
                    break;
                case 'jumbleNext':
                    this.handleJumbleNext();
                    break;
                case 'listeningAnswer':
                    this.handleListeningAnswer(param);
                    break;
            }
            this.render();
        });
    }

    handleAuth() {
        const n = document.getElementById('authName').value;
        const e = document.getElementById('authEmail').value;
        const p = document.getElementById('authPass').value;
        if (n && e && p) {
            this.userData = { name:n, email:e, pass:p };
            // مستخدم جديد يحصل على 100 لؤلؤة
            if (!localStorage.getItem('userAccount')) {
                this.userCoins = 100;
            }
            this.saveData(); 
            this.currentPage = 'home'; 
            this.render();
        }
    }

    handleNewWord() {
        const eng = document.getElementById('newEng').value.trim();
        const arb = document.getElementById('newArb').value.trim();
        if(eng && arb) {
            this.userVocabulary.push({ id: "u"+Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
            this.saveData();
            document.getElementById('newEng').value = '';
            document.getElementById('newArb').value = '';
            this.render();
        }
    }

    async processOCR(input) {
        const file = input.files[0];
        if (!file) return;
        const textArea = document.getElementById('ocrText');
        textArea.value = "⏳ جاري استخراج النص... انتظر قليلاً";
        try {
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            textArea.value = ret.data.text;
            await worker.terminate();
        } catch (e) {
            textArea.value = "❌ خطأ في المعالجة، حاول مرة أخرى";
        }
    }

    saveNewCustomLesson() {
        const titleInput = document.getElementById('newLessonTitle');
        const contentInput = document.getElementById('ocrText');
        const title = titleInput.value.trim() || "نص مخصص " + new Date().toLocaleDateString();
        const content = contentInput.value.trim();
        if (content) {
            const id = 'c' + Date.now();
            const newL = { id, title, content, terms: [] };
            this.customLessons[id] = newL;
            window.lessonsData[id] = newL;
            this.saveData();
            titleInput.value = ''; contentInput.value = '';
            this.currentPage = 'custom_lessons_view';
            this.render();
        }
    }

    deleteCustomLesson(id) {
        if (confirm('حذف النص نهائياً؟')) {
            delete this.customLessons[id];
            delete window.lessonsData[id];
            this.userVocabulary = this.userVocabulary.filter(v => v.lessonId !== String(id));
            this.saveData(); this.render();
        }
    }

    editLessonTitle(id) {
        const newTitle = prompt("العنوان الجديد:", this.customLessons[id].title);
        if (newTitle && newTitle.trim()) {
            this.customLessons[id].title = newTitle.trim();
            if(window.lessonsData[id]) window.lessonsData[id].title = newTitle.trim();
            this.saveData(); this.render();
        }
    }

    editLessonContent(id) {
        const newC = prompt("تعديل نص الموضوع:", this.customLessons[id].content);
        if (newC && newC.trim()) {
            this.customLessons[id].content = newC.trim();
            if(window.lessonsData[id]) window.lessonsData[id].content = newC.trim();
            this.saveData(); this.render();
        }
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;
        const lesson = window.lessonsData[this.selectedLessonId];
        const added = this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId);
        const allTerms = lesson ? [...lesson.terms, ...added] : [];
        
        app.innerHTML = this.getHeader() + `<div id="view">${this.getView(lesson, allTerms)}</div>`;
        
        if(this.currentPage === 'flashcards' && allTerms.length > 0) {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if(active[this.currentCardIndex]) {
                this.translateAuto(active[this.currentCardIndex].english, 'auto-trans-text');
            }
        }
    }

    getHeader() {
        if (this.currentPage === 'auth') return '';
        let nav = '';
        if (this.selectedLessonId && ['reading', 'flashcards', 'quiz', 'jumble', 'listening'].includes(this.currentPage) && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage === 'reading' ? 'active' : ''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage === 'flashcards' ? 'active' : ''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage === 'quiz' ? 'active' : ''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
                <button class="nav-btn ${this.currentPage === 'jumble' ? 'active' : ''}" data-action="setPage" data-param="jumble">🔤 ترتيب</button>
                <button class="nav-btn ${this.currentPage === 'listening' ? 'active' : ''}" data-action="setPage" data-param="listening">🎧 استماع</button>
            </nav>`;
        }
        
        return `<header class="header">
    <div class="header-content">
        <div class="logo-container" data-action="goHome">
            <img src="wordwise_logo.png" alt="WordWise">
            <h2>WordWise</h2>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
            <button data-action="toggleTheme" style="background:none; border:none; font-size:1.3rem; cursor:pointer; padding:5px;">
                ${this.theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div style="background: #ffd700; color: #000; padding: 5px 10px; border-radius: 20px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                <span>💎</span> ${this.userCoins}
            </div>
        </div>
    </div>
    ${nav}
</header>`;
    }

    getView(lesson, allTerms) {
        if (this.currentPage === 'auth') {
            return `<main class="main-content">
                <div class="auth-container">
                    <img src="wordwise_logo.png" alt="WordWise">
                    <h1>WordWise</h1>
                    <p>كن حكيماً في اختيار كلماتك</p>
                </div>
                <div class="reading-card auth-card">
                    <h2>🚀 مرحباً بك</h2>
                    <input id="authName" placeholder="الاسم الكامل" class="auth-input">
                    <input id="authEmail" placeholder="البريد الإلكتروني" class="auth-input">
                    <input type="password" id="authPass" placeholder="كلمة المرور" class="auth-input">
                    <button class="hero-btn" data-action="doAuth" style="width:100%;">ابدأ الآن ✨</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'home') {
            const progressLevel = this.userStats.xp % 100;

            return `<main class="main-content">
                <div class="reading-card welcome-banner" style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border: none; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0;">مرحباً، ${this.userData.name} 👋</h3>
                        <div style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">
                            ⭐ مستوى ${this.userStats.level}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                            <span>التقدم للمستوى التالي</span>
                            <span>${progressLevel}%</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="width: ${progressLevel}%; height: 100%; background: #10b981; box-shadow: 0 0 10px #10b981; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                        </div>
                    </div>

                    <div style="margin-top: 15px; display: flex; gap: 12px; font-size: 1.6rem; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 12px;">
                        ${this.userStats.badges.length > 0 ? this.userStats.badges.join(' ') : '<span style="font-size:0.8rem; opacity:0.8;">اجمع 10 كلمات للحصول على وسامك الأول! 🏅</span>'}
                    </div>
                </div>

                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-top:15px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">📸 إضافة من الكاميرا أو الهاتف</button>
                <button class="hero-btn" data-action="setPage" data-param="placement_test" style="width:100%; background:#ec4899; margin:15px 0; box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.3);">🧠 اختبار مستوى </button>
                
                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:1px solid #f97316;"><h3>📂 نصوصي</h3></div>` : ''}
                </div>
                
                <button data-action="logout" class="logout-btn" style="margin-top: 20px;">تسجيل الخروج</button>
            </main>`;
        }

        if (this.currentPage === 'placement_test') {
            if (this.placementStep >= 25) {
                return `<div class="reading-card result-card">
                    <h2 style="text-align:center;">🏁 نتيجة الاختبار</h2>
                    <div style="background:#f0f7ff; padding:15px; border-radius:10px; margin:10px 0; text-align:center;">
                        <h1 style="color:#1e40af; margin-bottom:5px;">${this.currentDifficulty}</h1>
                        <p style="font-weight:bold; color:#3b82f6;">IELTS: ${this.getIeltsEquivalent(this.currentDifficulty)}</p>
                        <p style="font-size:0.9rem; color:#64748b;">مجموع الإجابات الصحيحة: ${this.placementScore} / 25</p>
                    </div>
                    <h4 style="margin-top:15px;">📜 سجل نتائجك السابقة:</h4>
                    <div style="max-height:200px; overflow-y:auto; font-size:0.9rem; margin-bottom:15px; border:1px solid #e2e8f0; border-radius:8px;">
                        ${this.placementResults.map((r, idx) => `
                            <div style="border-bottom:1px solid #e2e8f0; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span>📅 ${r.date}</span><br>
                                    <strong>المستوى: ${r.level}</strong> (${r.score}/25)
                                </div>
                                <button class="hero-btn" data-action="viewPlacementDetails" data-index="${idx}" style="padding:5px 10px; font-size:0.8rem; background:#3b82f6;">عرض التفاصيل</button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="hero-btn" onclick="appInstance.resetPlacement()" style="background:#ec4899; flex:1;">إعادة الاختبار 🔄</button>
                        <button class="hero-btn" data-action="goHome" style="background:#64748b; flex:1;">الرئيسية</button>
                    </div>
                </div>`;
            }

            const q = this.getAdaptiveQuestion();
            const rawOpts = q.options ? q.options : [q.a, q.b, q.c, q.d];
            const opts = rawOpts.filter(o => o !== undefined).sort(() => 0.5 - Math.random());
            const correctAnswer = this.getCorrectAnswer(q);

            return `<div class="reading-card">
                <div style="display:flex; justify-content:center; margin-bottom:20px;">
                    <span style="background:#e2e8f0; color:#475569; padding:5px 15px; border-radius:20px; font-weight:bold; font-size:0.85rem;">السؤال رقم ${this.placementStep + 1}</span>
                </div>
                <h2 style="margin-bottom:30px; direction:ltr; text-align:left; line-height:1.5;">${q.q}</h2>
                <div class="quiz-options">
                    ${opts.map(opt => `
                        <button class="quiz-opt-btn" 
                                data-action="doPlacement" 
                                data-param="${opt}" 
                                data-correct="${correctAnswer}">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'placement_details' && this.viewingPlacementDetails) {
            const details = this.viewingPlacementDetails.details || [];
            return `<div class="reading-card">
                <button class="hero-btn" data-action="backFromDetails" style="margin-bottom:15px; background:#64748b;">← رجوع</button>
                <h2 style="text-align:center;">تفاصيل اختبار ${this.viewingPlacementDetails.date}</h2>
                <p style="text-align:center;">المستوى النهائي: <strong>${this.viewingPlacementDetails.level}</strong> | الدرجة: ${this.viewingPlacementDetails.score}/25</p>
                <div style="max-height:400px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                    ${details.map((d, i) => `
                        <div style="border-bottom:1px solid #e2e8f0; padding:10px; margin-bottom:5px;">
                            <p><strong>س${i+1}:</strong> ${d.question}</p>
                            <p>مستوى السؤال: ${d.level || 'غير محدد'}</p>
                            <p>إجابتك: ${d.selected || 'لم يجب'} - ${d.isCorrect ? '✅' : '❌'}</p>
                            <p>الإجابة الصحيحة: ${d.correct || 'غير معروفة'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'lessons') {
            const list = window.lessonsList[this.selectedLevel] || [];
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← رجوع</button>
                <div class="features-grid">
                    ${list.map(l => { 
                        const isOk = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id))); 
                        return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isOk?'':'opacity:0.6;'}"><h3>${isOk?'':'🔒 '}${l.title}</h3></div>`; 
                    }).join('')}
                </div></main>`;
        }

        if (this.currentPage === 'custom_lessons_view') {
            const lessons = Object.values(this.customLessons);
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← العودة للرئيسية</button>
                <h2 style="margin-bottom: 20px; text-align:center;">📂 نصوصي الخاصة</h2>
                ${lessons.length === 0 ? '<div class="reading-card" style="text-align:center; padding:30px; color:#666;">لا توجد نصوص محفوظة. صوّر نصك الأول الآن!</div>' : ''}
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${lessons.map(l => `
                        <div class="reading-card" style="border-right: 5px solid #6366f1; text-align: right; direction: rtl;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin:0; color:#4f46e5; cursor:pointer;" data-action="selLesson" data-param="${l.id}">${l.title}</h3>
                                <div style="display: flex; gap: 15px;">
                                    <button onclick="appInstance.editLessonTitle('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                                    <button onclick="appInstance.editLessonContent('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">📝</button>
                                    <button onclick="appInstance.deleteCustomLesson('${l.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
                                </div>
                            </div>
                            <p style="font-size: 0.9rem; color: #555; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; direction: ltr; text-align: left;">
                                ${l.content}
                            </p>
                            <button class="hero-btn" data-action="selLesson" data-param="${l.id}" style="width:100%; padding: 12px; font-size: 1rem; background: #6366f1;">📖 فتح النص للدراسة</button>
                        </div>
                    `).join('')}
                </div>
            </main>`;
        }

        if (this.currentPage === 'reading') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="backToLessons" style="margin-bottom:10px; background:#64748b;">⬅ تراجع</button>
                <div class="reading-card">
                    <h2>${lesson.title}</h2>
                    <div class="scrollable-text" style="direction:ltr; text-align:left; margin-top:10px;">${lesson.content}</div>
                </div>
                <div class="reading-card" style="margin-top:20px; border:1px dashed #6366f1; background:#f0f7ff;">
                    <h4 style="margin-bottom:10px;">إضافة كلمة جديدة:</h4>
                    <input id="newEng" placeholder="اكتب بالإنجليزية هنا..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;" oninput="appInstance.translateAuto(this.value, 'newArb')"> 
                    <input id="newArb" placeholder="الترجمة تظهر هنا..." style="width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ddd; background:#fff;">
                    <button class="hero-btn" data-action="addNewWord" style="width:100%; background:#10b981;">إضافة للقائمة ✅</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'flashcards') {
            const active = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));
            if (active.length === 0) {
                return `<div class="reading-card" style="text-align:center;">
                    <div style="font-size:3rem; margin-bottom:10px;">🧠</div>
                    <h3>🎉 اكتملت المراجعة!</h3>
                    <button class="hero-btn" data-action="restartCards" data-param="all" style="background:#f59e0b;">إعادة تكرار الكل 🔁</button>
                </div>`;
            }
            const t = active[this.currentCardIndex];
            return `<main class="main-content">
                <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <h1>${t.english}</h1>
                        </div>
                        <div class="flashcard-back"><h1 id="auto-trans-text">${t.arabic}</h1></div>
                    </div>
                </div>
                <div class="card-controls-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button class="hero-btn" data-action="speak" data-param="${t.english}" style="background:#6366f1;">🔊 نطق</button>
                    <button class="hero-btn" data-action="masterWordFlash" data-param="${t.id}" style="background:#10b981;">✅ حفظ</button>
                    <button class="hero-btn" data-action="deleteWord" data-param="${t.id}" style="background:#ef4444;">🗑️ حذف</button>
                </div>
                <button class="hero-btn" data-action="restartCards" data-param="remaining" style="width:100%; margin: 15px 0; background:#f59e0b;">🔁 تكرار المتبقي</button>
                <div class="card-nav-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="hero-btn" data-action="prevC" style="background:#64748b;">السابق</button>
                    <button class="hero-btn" data-action="nextC" data-total="${active.length}" style="background:#64748b;">التالي</button>
                </div>
                <div style="text-align:center; margin-top:10px; color:#666;">${this.currentCardIndex + 1} / ${active.length}</div>
            </main>`;
        }

        if (this.currentPage === 'quiz') {
            if (this.quizIndex >= this.quizQuestions.length) {
                const pass = (this.quizScore/this.quizQuestions.length) >= 0.75;
                if (this.isUnlockTest && pass) {
                    this.unlockedLessons.push(String(this.tempLessonToUnlock));
                    // منح 20 لؤلؤة عند فتح درس جديد (لأول مرة)
                    this.userCoins += 20;
                    this.saveData();
                    alert(`🎉 لقد فتحت درساً جديداً وحصلت على 20 لؤلؤة!`);
                }
                this.saveData();
                return `<div class="reading-card finish-box">
                    <h2>${pass ? "نجحت! 🎉" : "حاول مجدداً"}</h2>
                    <button class="hero-btn" data-action="backToLessons">متابعة</button>
                </div>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<div class="reading-card quiz-box">
                <div class="quiz-info">السؤال ${this.quizIndex+1}/${this.quizQuestions.length}</div>
                <h2>${q.english}</h2>
                <button class="quiz-speak-btn" data-action="speak" data-param="${q.english}">🔊</button>
                <div class="quiz-options">
                    ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                </div>
            </div>`;
        }

        // ========== صفحة إعادة ترتيب الجمل ==========
        if (this.currentPage === 'jumble') {
            if (!this.jumbleUnlocked) {
                return `<div class="reading-card" style="text-align: center;">
                    <h3>🔤 ترتيب الجمل</h3>
                    <p>لفتح هذا التمرين تحتاج 50 💎 لؤلؤة.</p>
                    <p>رصيدك الحالي: ${this.userCoins} 💎</p>
                    <button class="hero-btn" onclick="appInstance.unlockJumble()" style="background: #8b5cf6;">فتح (50 💎)</button>
                </div>`;
            }
            return `<div class="reading-card">
                <h3>🔤 رتب الكلمات لتكوين جملة صحيحة</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; padding: 15px; background: ${this.jumbleChecked ? (this.jumbleCorrect ? '#d1fae5' : '#fee2e2') : '#f1f5f9'}; border-radius: 8px; min-height: 60px; border: ${this.jumbleChecked ? (this.jumbleCorrect ? '2px solid #10b981' : '2px solid #ef4444') : 'none'};">
                    ${this.jumbleUserAnswer.map(word => `
                        <span class="jumble-word-top" data-action="jumbleRemove" data-param="${word}" style="cursor: pointer; background: #3b82f6; color: white; padding: 8px 15px; border-radius: 20px; font-size: 1.2rem;">${word}</span>
                    `).join('')}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; padding: 15px; background: #e2e8f0; border-radius: 8px; min-height: 60px;">
                    ${this.jumbleWords.map(word => `
                        <button class="hero-btn" data-action="jumbleSelect" data-param="${word}" style="padding: 8px 15px; background: #64748b; font-size: 1rem; ${this.jumbleChecked ? 'opacity:0.5; pointer-events:none;' : ''}">${word}</button>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="hero-btn" data-action="jumbleReset" style="background:#f59e0b;">🔄 إعادة</button>
                    <button class="hero-btn" data-action="jumbleCheck" style="background:#10b981;" ${this.jumbleChecked ? 'disabled' : ''}>✅ تحقق</button>
                    <button class="hero-btn" data-action="jumbleHint" style="background:#3b82f6;" ${this.jumbleChecked || this.jumbleHintUsed ? 'disabled' : ''}>💡 تلميح</button>
                    ${this.jumbleChecked ? `<button class="hero-btn" data-action="jumbleNext" style="background:#3b82f6;">➡️ التالي</button>` : ''}
                </div>
                ${this.jumbleArabicHint ? `<div style="margin-top: 15px; padding: 10px; background: #e0f2fe; border-radius: 8px; text-align: center; font-size: 1.1rem; color: #0369a1;">🔍 الترجمة: ${this.jumbleArabicHint}</div>` : ''}
                ${this.jumbleHintUsed ? `<p style="margin-top: 10px; color: #f59e0b;">🔎 تلميح: أول كلمة هي "${this.jumbleOriginalSentence.split(/\s+/)[0]}"</p>` : ''}
            </div>`;
        }

        // ========== صفحة اختبار الاستماع ==========
        if (this.currentPage === 'listening') {
            if (!this.listeningUnlocked) {
                return `<div class="reading-card" style="text-align: center;">
                    <h3>🎧 اختبار الاستماع</h3>
                    <p>لفتح هذا الاختبار تحتاج 50 💎 لؤلؤة.</p>
                    <p>رصيدك الحالي: ${this.userCoins} 💎</p>
                    <button class="hero-btn" onclick="appInstance.unlockListening()" style="background: #8b5cf6;">فتح (50 💎)</button>
                </div>`;
            }
            if (!this.listeningCurrent) {
                return `<div class="reading-card"><p>لا توجد كلمات متاحة. حاول مرة أخرى.</p></div>`;
            }
            return `<div class="reading-card">
                <h3>🎧 استمع واختر الكلمة الصحيحة</h3>
                <div style="text-align: center; margin: 30px 0;">
                    <button class="hero-btn" data-action="speak" data-param="${this.listeningCurrent.english}" style="font-size: 2rem; padding: 20px; background: #6366f1;">🔊 استمع مرة أخرى</button>
                </div>
                <div class="quiz-options">
                    ${this.listeningOptions.map(opt => `
                        <button class="quiz-opt-btn listening-opt-btn" data-action="listeningAnswer" data-param="${opt}">${opt}</button>
                    `).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'addLesson') {
            return `<main class="main-content" style="height: 90vh; display: flex; flex-direction: column; gap: 10px;">
                <button class="hero-btn" data-action="goHome" style="background:#64748b; flex-shrink: 0;">← رجوع للرئيسية</button>
                <div class="reading-card" style="flex-grow: 1; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
                    <h3 style="flex-shrink: 0;">📸 إضافة نص ذكي</h3>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #6366f1; flex-shrink: 0;">
                        <input type="file" id="fileInput" accept="image/*" onchange="appInstance.processOCR(this)" style="width: 100%;">
                    </div>
                    <input id="newLessonTitle" placeholder="عنوان النص" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; flex-shrink: 0;">
                    <textarea id="ocrText" placeholder="النص سيظهر هنا..." style="width: 100%; flex-grow: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; line-height: 1.5; resize: none;"></textarea>
                    <button class="hero-btn" onclick="appInstance.saveNewCustomLesson()" style="width: 100%; background:#10b981; padding: 15px; font-size: 1.1rem; flex-shrink: 0;">💾 حفظ النص</button>
                </div>
            </main>`;
        } 
        return `<div style="text-align:center; padding:50px;">جاري التحميل...</div>`;
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        // تحديث اللوجو في الهيدر إذا كان موجوداً
        const logoImg = document.querySelector('.logo-container img');
        if (logoImg) {
            logoImg.src = 'wordwise_logo.png'; // نفس الملف لكل الأوضاع (يمكن تغييره لاحقاً إذا أردت نسختين)
        }
        
        this.render();
    }

    resetPlacement() { 
        this.placementStep = 0;
        this.placementScore = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.currentPlacementDetails = [];
        this.render();
    }
}

const appInstance = new App();
```
