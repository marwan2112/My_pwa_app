// ================== App Class - Part 1 ==================
class App {
    constructor() {
        this.levelStats = { A1:0, A2:0, B1:0, B2:0, C1:0, C2:0 };
        this.levelFails = { A1:0, A2:0, B1:0, B2:0, C1:0, C2:0 };
        this.placementLog = [];
        this.placementStep = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.placementScore = 0;
        this.theme = localStorage.getItem('theme') || 'light';

        this.userStats = JSON.parse(localStorage.getItem('userStats')) || { xp: 0, level: 1, badges: [] };
        this.placementResults = JSON.parse(localStorage.getItem('placementResults')) || [];

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

        this.setupGlobalEvents();
        this.render();
    }

    saveData() {
        localStorage.setItem('userVocab', JSON.stringify(this.userVocabulary));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('hiddenFromCards', JSON.stringify(this.hiddenFromCards));
        localStorage.setItem('customLessons', JSON.stringify(this.customLessons));
        if (this.userData) localStorage.setItem('userAccount', JSON.stringify(this.userData));
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

    playTone(type) {
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

    getAdaptiveQuestion() {
        const levelQuestions = window.placementBank[this.currentDifficulty];
        const unused = levelQuestions.filter(q => 
            !this.placementLog.some(p => p.q === q.q)
        );
        const list = unused.length ? unused : levelQuestions;
        const selected = list[Math.floor(Math.random() * list.length)];
        return selected;
    }

    handlePlacement(selected, correct, btn) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const isCorrect = selected.trim().toLowerCase() === correct.trim().toLowerCase();
        if(btn){
            btn.style.background = isCorrect ? "#22c55e" : "#ef4444";
            btn.style.color = "white";
        }

        this.playTone(isCorrect ? "correct" : "error");

        this.placementLog.push({
            q: this.currentQuestion.q,
            chosen: selected,
            correct: correct,
            level: this.currentDifficulty
        });

        if (isCorrect) {
            this.placementScore++;
            this.levelStats[this.currentDifficulty]++;
        } else {
            this.levelFails[this.currentDifficulty]++;
        }

        const levels = ["A1","A2","B1","B2","C1","C2"];
        let idx = levels.indexOf(this.currentDifficulty);

        if (this.levelStats[this.currentDifficulty] >= 3 && idx < levels.length - 1) {
            this.currentDifficulty = levels[idx + 1];
        }

        if (this.levelFails[this.currentDifficulty] >= 2 && idx > 0) {
            this.currentDifficulty = levels[idx - 1];
        }

        this.setTimeline();
        setTimeout(() => { 
            this.placementStep++;
            this.isWaiting = false; 
            this.render(); 
        }, 800);
    }

    setTimeline() {
        const levels = ["A1","A2","B1","B2","C1","C2"];
        let idx = levels.indexOf(this.currentDifficulty);

        const correctCount = this.levelStats[this.currentDifficulty];
        const failCount = this.levelFails[this.currentDifficulty];

        if (correctCount >= 3 && idx < levels.length - 1) {
            this.currentDifficulty = levels[idx + 1];
            return;
        }

        if (failCount >= 2 && idx > 0) {
            this.currentDifficulty = levels[idx - 1];
            return;
        }
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
    setupGlobalEvents() {
        document.addEventListener('click', e => {
            if (e.target.matches('.theme-toggle')) {
                this.toggleTheme();
            }
            if (e.target.matches('.nav-home')) {
                this.currentPage = 'home'; this.render();
            }
            if (e.target.matches('.nav-lessons')) {
                this.currentPage = 'lessons'; this.render();
            }
            if (e.target.matches('.nav-vocab')) {
                this.currentPage = 'vocab'; this.render();
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && this.currentPage === 'quiz') {
                this.checkAnswer(document.querySelector('input.quiz-input')?.value || '');
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    }

    addUserWord(english, arabic) {
        const id = Date.now();
        this.userVocabulary.push({ id, english, arabic, lessonId: this.selectedLessonId });
        this.saveData();
        this.render();
    }

    removeUserWord(id) {
        this.userVocabulary = this.userVocabulary.filter(w => w.id !== id);
        this.saveData();
        this.render();
    }

    markMastered(wordId) {
        if (!this.masteredWords.includes(wordId)) {
            this.masteredWords.push(wordId);
            this.updateProgress(5);
            this.saveData();
        }
    }

    unlockLesson(lessonId) {
        if (!this.unlockedLessons.includes(lessonId)) {
            this.unlockedLessons.push(lessonId);
            this.saveData();
        }
    }

    render() {
        const container = document.getElementById('app');
        if (!container) return;
        container.innerHTML = '';

        if (this.currentPage === 'auth') {
            container.innerHTML = `
                <div class="auth-screen">
                    <h2>Welcome to English Builder</h2>
                    <input type="text" placeholder="Your name" id="user-name"/>
                    <button id="start-btn">Start Learning</button>
                </div>
            `;
            document.getElementById('start-btn').onclick = () => {
                const name = document.getElementById('user-name').value.trim();
                if (name) {
                    this.userData = { name }; 
                    localStorage.setItem('userAccount', JSON.stringify(this.userData));
                    this.currentPage = 'home';
                    this.render();
                }
            };
            return;
        }

        if (this.currentPage === 'home') {
            container.innerHTML = `
                <div class="home-screen">
                    <h2>Hi, ${this.userData?.name || 'Learner'}</h2>
                    <p>Level: ${this.userStats.level} | XP: ${this.userStats.xp}</p>
                    <p>Badges: ${this.userStats.badges.join(' ')}</p>
                    <button class="nav-lessons">Lessons</button>
                    <button class="nav-vocab">Vocabulary</button>
                </div>
            `;
            return;
        }

        if (this.currentPage === 'lessons') {
            container.innerHTML = '<h2>Lessons</h2><div class="lessons-list"></div>';
            const list = container.querySelector('.lessons-list');
            Object.entries(window.lessonsData).forEach(([id, lesson]) => {
                const unlocked = this.unlockedLessons.includes(id) || lesson.isFree;
                const lessonDiv = document.createElement('div');
                lessonDiv.className = 'lesson-card';
                lessonDiv.innerHTML = `
                    <h3>${lesson.title}</h3>
                    <p>${lesson.terms.length} words</p>
                    <button class="start-lesson" data-id="${id}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Start' : 'Locked'}</button>
                `;
                list.appendChild(lessonDiv);
            });

            list.querySelectorAll('.start-lesson').forEach(btn => {
                btn.onclick = () => {
                    this.selectedLessonId = btn.dataset.id;
                    this.currentPage = 'flashcards';
                    this.currentCardIndex = 0;
                    this.render();
                };
            });
            return;
        }

        if (this.currentPage === 'flashcards') {
            const lesson = window.lessonsData[this.selectedLessonId];
            const term = lesson.terms[this.currentCardIndex];
            container.innerHTML = `
                <div class="flashcard-screen">
                    <h2>${lesson.title}</h2>
                    <div class="flashcard">
                        <p>${term.english}</p>
                        <input type="text" class="quiz-input" placeholder="Translate"/>
                        <button class="check-btn">Check</button>
                        <button class="next-btn">Next</button>
                        <button class="speak-btn">🔊</button>
                    </div>
                </div>
            `;
            container.querySelector('.speak-btn').onclick = () => this.speak(term.english);
            container.querySelector('.check-btn').onclick = () => {
                const val = container.querySelector('.quiz-input').value.trim();
                if (val.toLowerCase() === term.arabic.toLowerCase()) {
                    this.markMastered(term.id);
                    this.playTone('correct');
                } else {
                    this.playTone('error');
                }
            };
            container.querySelector('.next-btn').onclick = () => {
                this.currentCardIndex++;
                if (this.currentCardIndex >= lesson.terms.length) {
                    this.currentPage = 'lessons';
                }
                this.render();
            };
            return;
        }

        if (this.currentPage === 'vocab') {
            container.innerHTML = '<h2>My Vocabulary</h2><div class="vocab-list"></div>';
            const list = container.querySelector('.vocab-list');
            this.userVocabulary.forEach(word => {
                const div = document.createElement('div');
                div.className = 'vocab-item';
                div.innerHTML = `
                    <span>${word.english} - ${word.arabic}</span>
                    <button class="del-word" data-id="${word.id}">❌</button>
                `;
                list.appendChild(div);
            });
            list.querySelectorAll('.del-word').forEach(btn => {
                btn.onclick = () => this.removeUserWord(Number(btn.dataset.id));
            });
            return;
        }
    }

    checkAnswer(input) {
        const q = this.quizQuestions[this.quizIndex];
        if (!q) return;

        const isCorrect = input.trim().toLowerCase() === q.arabic.toLowerCase();
        if (isCorrect) {
            this.playTone('correct');
            this.quizScore++;
            this.markMastered(q.id);
        } else {
            this.playTone('error');
        }
        this.quizIndex++;
        if (this.quizIndex >= this.quizQuestions.length) {
            this.renderQuizResult();
        } else {
            this.generateOptions();
            this.render();
        }
    }

    renderQuizResult() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="quiz-result">
                <h2>Quiz Completed!</h2>
                <p>Score: ${this.quizScore}/${this.quizQuestions.length}</p>
                <button class="back-lessons">Back to Lessons</button>
            </div>
        `;
        container.querySelector('.back-lessons').onclick = () => {
            this.currentPage = 'lessons';
            this.render();
        };
    }
    // ================== App Class - Part 3 ==================
    speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }

    playTone(type) {
        const audio = new Audio();
        if (type === 'correct') audio.src = 'sounds/correct.mp3';
        else if (type === 'error') audio.src = 'sounds/error.mp3';
        audio.play();
    }

    updateProgress(points) {
        this.userStats.xp += points;
        if (this.userStats.xp >= this.userStats.level * 100) {
            this.userStats.xp = 0;
            this.userStats.level++;
            this.userStats.badges.push(`Level ${this.userStats.level}`);
        }
        this.saveData();
    }

    saveData() {
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
        localStorage.setItem('masteredWords', JSON.stringify(this.masteredWords));
        localStorage.setItem('unlockedLessons', JSON.stringify(this.unlockedLessons));
        localStorage.setItem('userVocabulary', JSON.stringify(this.userVocabulary));
    }

    loadData() {
        const stats = localStorage.getItem('userStats');
        const mastered = localStorage.getItem('masteredWords');
        const unlocked = localStorage.getItem('unlockedLessons');
        const vocab = localStorage.getItem('userVocabulary');
        if (stats) this.userStats = JSON.parse(stats);
        if (mastered) this.masteredWords = JSON.parse(mastered);
        if (unlocked) this.unlockedLessons = JSON.parse(unlocked);
        if (vocab) this.userVocabulary = JSON.parse(vocab);
    }

    generateQuiz(lessonId) {
        const lesson = window.lessonsData[lessonId];
        if (!lesson) return;
        this.quizQuestions = lesson.terms;
        this.quizIndex = 0;
        this.quizScore = 0;
        this.currentPage = 'quiz';
        this.render();
    }

    generateOptions() {
        const q = this.quizQuestions[this.quizIndex];
        const options = [q.arabic];
        while (options.length < 4) {
            const randomWord = this.quizQuestions[Math.floor(Math.random() * this.quizQuestions.length)].arabic;
            if (!options.includes(randomWord)) options.push(randomWord);
        }
        options.sort(() => Math.random() - 0.5);
        q.options = options;
    }

    init() {
        this.loadData();
        if (!this.userData) {
            this.currentPage = 'auth';
        }
        this.render();
        this.setupGlobalEvents();
    }
}

// ================== Initialize App ==================
window.lessonsData = {}; // Placeholder, actual lessons JSON should be loaded here
// Example lesson structure:
// window.lessonsData['1'] = { title: 'Lesson 1', isFree: true, terms: [ {id:1, english:'Hello', arabic:'مرحبا'}, ... ] }

const app = new App();
app.init();

// ================== Utility Functions ==================
function loadLessonsFromJSON(json) {
    window.lessonsData = json;
    app.render();
}

// ================== Optional: Sample Sounds Loader ==================
const loadSampleSounds = () => {
    ['correct', 'error'].forEach(type => {
        const audio = new Audio(`sounds/${type}.mp3`);
        audio.load();
    });
};
loadSampleSounds();
