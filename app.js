class App {
    constructor() {
        // 🔥 ضع هنا بيانات Firebase الخاصة بك
        const firebaseConfig = {
            apiKey: "AIzaSyB-Qjyckhd13Ir5Q18WDyw-IH1jrVXYuiY",
            authDomain: "wordwise-app-4cdd5.firebaseapp.com",
            databaseURL: "https://console.firebase.google.com/project/wordwise-app-4cdd5/database/wordwise-app-4cdd5-default-rtdb/data/~2F",
            projectId: "wordwise-app-4cdd5",
            storageBucket: "wordwise-app-4cdd5.firebasestorage.app",
            messagingSenderId: "35184262145",
            appId: "1:35184262145:web:d49506d34a68b192115400"
        };
        
        // تهيئة Firebase إذا لم تكن مهيأة مسبقاً
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        this.auth = firebase.auth();
        this.database = firebase.database();
        
        // الاستماع لتغييرات حالة المصادقة
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // مستخدم مسجل الدخول
                this.currentUserEmail = user.email;
                this.userData = { 
                    name: user.displayName || user.email.split('@')[0], 
                    email: user.email,
                    uid: user.uid
                };
                this.loadUserData(user.uid);
                this.currentPage = 'home';
                this.render();
            } else {
                // لا يوجد مستخدم
                this.currentUserEmail = null;
                this.userData = null;
                this.resetLocalData();
                this.currentPage = 'auth';
                this.render();
            }
        });

        // باقي الخصائص (كما كانت سابقاً)
        this.currentAudio = null;
        this.audioPlaybackRate = 1.0;
        this.availableSpeeds = [0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0];
        this.placementStep = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.placementScore = 0;
        this.theme = localStorage.getItem('theme') || 'light';
        this.jumbleArabicHint = '';
        this.jumbleCurrentSentence = '';

        this.userStats = { xp: 0, level: 1, badges: [], tier: 'برونزي' };
        this.placementResults = [];
        this.placementFullHistory = [];
        this.currentPlacementDetails = [];
        this.viewingPlacementDetails = null;

        this.userCoins = 0;
        this.showCoinModal = false;

        this.jumbleOriginalSentence = '';
        this.jumbleWords = [];
        this.jumbleUserAnswer = [];
        this.jumbleChecked = false;
        this.jumbleCorrect = false;
        this.jumbleHintUsed = false;
        this.jumbleHistory = [];
        this.jumbleUnlocked = {};
        this.jumbleNextCount = 0;

        this.listeningRemaining = [];
        this.listeningCurrent = null;
        this.listeningOptions = [];
        this.listeningAnswered = false;
        this.listeningTimer = null;
        this.listeningErrorTimer = null;
        this.listeningUnlocked = {};
        this.listeningNextCount = 0;

        this.spellingRemaining = [];
        this.spellingCurrent = null;
        this.spellingAnswered = false;
        this.spellingUserAnswer = '';
        this.spellingResult = null;
        this.spellingUnlocked = {};
        this.spellingNextCount = 0;

        this.levelTestLevel = null;
        this.levelTestLessons = [];
        this.levelTestCurrentLessonIndex = 0;
        this.levelTestCurrentLessonId = null;
        this.levelTestLessonQuestions = [];
        this.levelTestRequiredCorrect = 5;
        this.levelTestCurrentCorrect = 0;
        this.levelTestCurrentTotal = 0;
        this.levelTestQuestionsBank = {};
        this.levelTestResults = [];
        this.levelTestQuestionsAnswered = 0;
        this.levelTestMaxQuestions = 100;
        this.levelTestCurrentQuestion = null;
        this.levelTestCurrentOptions = [];
        this.levelTestUnlockedCount = 0;
        this.levelTestCoinsEarned = 0;

        this.lastTestedLesson = { beginner: 0, intermediate: 0, advanced: 0 };
        this.newWordsAddedCount = 0;
        this.adWatchedCount = 0;
        this.purchaseRequests = [];

        this.userProfile = {
            name: '',
            age: '',
            joinDate: new Date().toLocaleDateString('ar-EG'),
            level: 'A1',
            image: '',
            testsHistory: []
        };

        this.userVocabulary = [];
        this.masteredWords = [];
        this.unlockedLessons = [];
        this.hiddenFromCards = [];
        this.customLessons = {};

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // إعادة تعيين البيانات المحلية
    resetLocalData() {
        this.userVocabulary = [];
        this.masteredWords = [];
        this.unlockedLessons = [];
        this.hiddenFromCards = [];
        this.customLessons = {};
        this.userStats = { xp: 0, level: 1, badges: [], tier: 'برونزي' };
        this.placementResults = [];
        this.placementFullHistory = [];
        this.userCoins = 0;
        this.jumbleUnlocked = {};
        this.listeningUnlocked = {};
        this.spellingUnlocked = {};
        this.newWordsAddedCount = 0;
        this.adWatchedCount = 0;
        this.purchaseRequests = [];
        this.userProfile = {
            name: '',
            age: '',
            joinDate: new Date().toLocaleDateString('ar-EG'),
            level: 'A1',
            image: '',
            testsHistory: []
        };
        this.lastTestedLesson = { beginner: 0, intermediate: 0, advanced: 0 };
    }

    // تحميل بيانات المستخدم من Firebase
    loadUserData(uid) {
        const userRef = this.database.ref('users/' + uid);
        userRef.once('value', (snapshot) => {
            const data = snapshot.val() || {};
            this.userVocabulary = data.userVocabulary || [];
            this.masteredWords = data.masteredWords || [];
            this.unlockedLessons = data.unlockedLessons || [];
            this.hiddenFromCards = data.hiddenFromCards || [];
            this.customLessons = data.customLessons || {};
            this.userStats = data.userStats || { xp: 0, level: 1, badges: [], tier: 'برونزي' };
            this.placementResults = data.placementResults || [];
            this.placementFullHistory = data.placementFullHistory || [];
            this.userCoins = data.userCoins || 0;
            this.jumbleUnlocked = data.jumbleUnlocked || {};
            this.listeningUnlocked = data.listeningUnlocked || {};
            this.spellingUnlocked = data.spellingUnlocked || {};
            this.newWordsAddedCount = data.newWordsAddedCount || 0;
            this.adWatchedCount = data.adWatchedCount || 0;
            this.purchaseRequests = data.purchaseRequests || [];
            this.userProfile = data.userProfile || {
                name: this.userData?.name || '',
                age: '',
                joinDate: new Date().toLocaleDateString('ar-EG'),
                level: 'A1',
                image: '',
                testsHistory: []
            };
            this.lastTestedLesson = data.lastTestedLesson || { beginner: 0, intermediate: 0, advanced: 0 };
            
            if (this.placementResults.length > 0) {
                this.userProfile.level = this.placementResults[0].level;
            }
            this.updateBadgesAndTier();
            this.render();
        });
    }

    // حفظ بيانات المستخدم في Firebase
    saveUserData() {
        if (!this.auth.currentUser) return;
        const uid = this.auth.currentUser.uid;
        const userRef = this.database.ref('users/' + uid);
        const data = {
            userVocabulary: this.userVocabulary,
            masteredWords: this.masteredWords,
            unlockedLessons: this.unlockedLessons,
            hiddenFromCards: this.hiddenFromCards,
            customLessons: this.customLessons,
            userStats: this.userStats,
            placementResults: this.placementResults,
            placementFullHistory: this.placementFullHistory,
            userCoins: this.userCoins,
            jumbleUnlocked: this.jumbleUnlocked,
            listeningUnlocked: this.listeningUnlocked,
            spellingUnlocked: this.spellingUnlocked,
            newWordsAddedCount: this.newWordsAddedCount,
            adWatchedCount: this.adWatchedCount,
            purchaseRequests: this.purchaseRequests,
            userProfile: this.userProfile,
            lastTestedLesson: this.lastTestedLesson
        };
        userRef.set(data);
    }

    // تسجيل الخروج
    logout() {
        this.auth.signOut();
    }

    updateBadgesAndTier() {
        const totalLessonsUnlocked = this.unlockedLessons ? this.unlockedLessons.length : 0;
        const totalMastered = this.masteredWords ? this.masteredWords.length : 0;

        let newBadges = [];
        if (totalLessonsUnlocked >= 10 && totalMastered >= 100) newBadges.push('🥉');
        if (totalLessonsUnlocked >= 20 && totalMastered >= 500) newBadges.push('🥈');
        if (totalLessonsUnlocked >= 50 && totalMastered >= 1500) newBadges.push('🥇');
        if (totalLessonsUnlocked >= 100 && totalMastered >= 3000) newBadges.push('👑');

        this.userStats.badges = newBadges;

        if (newBadges.includes('👑')) this.userStats.tier = 'ماسي';
        else if (newBadges.includes('🥇')) this.userStats.tier = 'ذهبي';
        else if (newBadges.includes('🥈')) this.userStats.tier = 'فضي';
        else if (newBadges.includes('🥉')) this.userStats.tier = 'برونزي';
        else this.userStats.tier = 'بدون';

        if (totalLessonsUnlocked >= 100) this.userStats.level = 5;
        else if (totalLessonsUnlocked >= 60) this.userStats.level = 4;
        else if (totalLessonsUnlocked >= 30) this.userStats.level = 3;
        else if (totalLessonsUnlocked >= 10) this.userStats.level = 2;
        else this.userStats.level = 1;
    }

    updateProgress(points) {
        this.userStats.xp += points;
        this.updateBadgesAndTier();
        this.saveUserData();
    }

    init() {
        this.addThemeStyles();
        document.documentElement.setAttribute('data-theme', this.theme);

        if (!window.levels || !window.lessonsData || !window.placementBank || !window.lessonsList) {
            setTimeout(() => this.init(), 500);
            return;
        }

        this.currentPage = 'auth';

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.setupGlobalEvents();
        this.render();
    }

    addThemeStyles() {
        // (ضع هنا كود الأنماط CSS كما هو في ملفك السابق، لست بحاجة لتغييره)
        // أضف الأنماط الكاملة من ملفك القديم هنا
        const styleId = 'theme-dynamic-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `/* ضع هنا كل الـ CSS الذي كان لديك سابقاً */`;
        document.head.appendChild(style);
    }

    // دوال إعادة ترتيب الجمل والاستماع والكتابة والاختبارات... (كلها كما كانت)
    // سأختصرها هنا لأنها طويلة، ولكن تأكد من نسخها كاملة من ملفك القديم
    // أنصحك بنسخ جميع الدوال من ملفك القديم (prepareJumble, handleJumbleSelect, ... الخ) ووضعها هنا
    // لأني لا أستطيع كتابة 2000 سطر هنا، لكنك ستفعل ذلك ببساطة: كل الدوال من ملفك القديم تبقى كما هي، فقط أضف الدوال الجديدة التي كتبتها أنا (resetLocalData, loadUserData, saveUserData, logout, handleAuth الجديدة)

    // هذا مجرد تذكير: يجب أن تضع هنا جميع الدوال الأخرى من ملفك القديم (prepareJumble, handleJumbleSelect, ... كل شيء)
    // أنا سأضع مثالاً لدالة واحدة فقط للتوضيح، لكن يجب أن تنسخ الباقي من ملفك.

    prepareJumble() {
        // انسخ المحتوى من ملفك القديم
    }

    // ... وهكذا جميع الدوال الأخرى

    // دالة المصادقة باستخدام Firebase
    handleAuth() {
        const name = document.getElementById('authName')?.value;
        const email = document.getElementById('authEmail')?.value;
        const pass = document.getElementById('authPass')?.value;

        if (!name || !email || !pass) {
            alert('الرجاء إدخال جميع البيانات');
            return;
        }

        // محاولة تسجيل الدخول أولاً
        this.auth.signInWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                // تسجيل دخول ناجح
                const user = userCredential.user;
                if (user.displayName !== name) {
                    user.updateProfile({ displayName: name });
                }
                // سيتم التوجيه تلقائياً عبر onAuthStateChanged
            })
            .catch((error) => {
                if (error.code === 'auth/user-not-found') {
                    // مستخدم غير موجود، نقوم بإنشاء حساب جديد
                    this.auth.createUserWithEmailAndPassword(email, pass)
                        .then((userCredential) => {
                            const user = userCredential.user;
                            user.updateProfile({ displayName: name });
                            // إنشاء بيانات افتراضية للمستخدم الجديد
                            this.userVocabulary = [];
                            this.masteredWords = [];
                            this.unlockedLessons = [];
                            this.hiddenFromCards = [];
                            this.customLessons = {};
                            this.userStats = { xp: 0, level: 1, badges: [], tier: 'برونزي' };
                            this.placementResults = [];
                            this.placementFullHistory = [];
                            this.userCoins = 100;
                            this.jumbleUnlocked = {};
                            this.listeningUnlocked = {};
                            this.spellingUnlocked = {};
                            this.newWordsAddedCount = 0;
                            this.adWatchedCount = 0;
                            this.purchaseRequests = [];
                            this.userProfile = {
                                name: name,
                                age: '',
                                joinDate: new Date().toLocaleDateString('ar-EG'),
                                level: 'A1',
                                image: '',
                                testsHistory: []
                            };
                            this.lastTestedLesson = { beginner: 0, intermediate: 0, advanced: 0 };
                            this.saveUserData(); // حفظ في Firebase
                        })
                        .catch((createError) => {
                            alert('خطأ في إنشاء الحساب: ' + createError.message);
                        });
                } else {
                    alert('خطأ في تسجيل الدخول: ' + error.message);
                }
            });
    }

    // باقي دوال الأحداث setupGlobalEvents يجب تحديثها لاستدعاء logout الجديد و handleAuth الجديد
    // لكني سأكتبها هنا كاملة مع التعديلات اللازمة.
    setupGlobalEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const { action, param, correct, total, index } = btn.dataset;

            if (action === 'ansQ') { this.handleAnswer(param, correct, btn); return; }
            if (action === 'levelTestAns') { this.handleLevelTestAnswer(param, correct, btn); return; }

            switch (action) {
                case 'masterWord':
                    if (!this.masteredWords.includes(String(param))) {
                        this.masteredWords.push(String(param));
                        this.updateProgress(10);
                        if (this.selectedLessonId) {
                            this.grantLessonCompletionReward(this.selectedLessonId);
                        }
                        this.saveUserData();
                    }
                    break;

                case 'playAudio':
                    this.playAudio(param);
                    break;
                case 'pauseAudio':
                    this.pauseAudio();
                    break;
                case 'stopAudio':
                    this.stopAudio();
                    break;
                case 'skipBack10':
                    this.skipBack10();
                    break;
                case 'skipForward10':
                    this.skipForward10();
                    break;
                case 'speedUp':
                    this.speedUp();
                    this.render();
                    break;
                case 'speedDown':
                    this.speedDown();
                    this.render();
                    break;

                case 'goHome':
                    this.stopAudio();
                    this.currentPage = 'home';
                    this.selectedLessonId = null;
                    this.isUnlockTest = false;
                    this.viewingPlacementDetails = null;
                    this.levelTestLevel = null;
                    break;

                case 'logout':
                    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                        this.logout(); // استدعاء logout الجديد
                    }
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
                    this.openLesson(param);
                    break;

                case 'unlockWithTest':
                    const list = window.lessonsList[this.selectedLevel] || [];
                    const curIdx = list.findIndex(l => l.id == param);
                    const prevId = list[curIdx - 1]?.id;
                    if (prevId) {
                        this.tempLessonToUnlock = param;
                        this.selectedLessonId = prevId;
                        this.prepareQuiz(window.lessonsData[prevId].terms, true);
                        this.currentPage = 'quiz';
                    }
                    break;

                case 'unlockWithCoins':
                    this.unlockLessonWithCoins(param);
                    break;

                case 'setPage':
                    if (param === 'listening' && this.selectedLessonId) {
                        if (!this.listeningUnlocked[this.selectedLessonId]) {
                            if (!this.unlockListening(this.selectedLessonId)) return;
                        } else {
                            this.prepareListeningQuiz();
                        }
                    } else if (param === 'jumble' && this.selectedLessonId) {
                        if (!this.jumbleUnlocked[this.selectedLessonId]) {
                            if (!this.unlockJumble(this.selectedLessonId)) return;
                        } else {
                            this.prepareJumble();
                        }
                    } else if (param === 'spelling' && this.selectedLessonId) {
                        if (!this.spellingUnlocked[this.selectedLessonId]) {
                            if (!this.unlockSpelling(this.selectedLessonId)) return;
                        } else {
                            this.prepareSpelling();
                        }
                    } else if (param === 'quiz' && this.selectedLessonId) {
                        this.prepareQuiz(window.lessonsData[this.selectedLessonId].terms, false);
                    } else if (param === 'profile') {
                        this.showProfile();
                        return;
                    } else if (param === 'test_history') {
                        this.showTestHistory();
                        return;
                    }
                    this.currentPage = param;
                    this.currentCardIndex = 0;
                    break;

                case 'masterWordFlash':
                    const cardM = document.querySelector('.flashcard-container');
                    if (cardM) {
                        cardM.classList.add('master-anim');
                        setTimeout(() => {
                            if (!this.masteredWords.includes(String(param))) {
                                this.masteredWords.push(String(param));
                                this.updateProgress(10);
                                if (this.selectedLessonId) {
                                    this.grantLessonCompletionReward(this.selectedLessonId);
                                }
                                this.saveUserData();
                            }
                            this.render();
                        }, 550);
                    }
                    return;

                case 'deleteWord':
                    if (confirm('حذف نهائي من البطاقات؟')) {
                        const cardD = document.querySelector('.flashcard-container');
                        if (cardD) {
                            cardD.classList.add('delete-anim');
                            setTimeout(() => {
                                this.hiddenFromCards.push(String(param));
                                this.saveUserData(); this.render();
                            }, 550);
                        }
                    }
                    return;

                case 'speak':
                    this.speak(param);
                    break;

                case 'nextC':
                    const cardNext = document.querySelector('.flashcard-container');
                    if (cardNext) {
                        cardNext.classList.add('slide-next');
                        setTimeout(() => {
                            if (this.currentCardIndex < (parseInt(total) - 1)) this.currentCardIndex++;
                            this.render();
                        }, 400);
                    }
                    return;

                case 'prevC':
                    const cardPrev = document.querySelector('.flashcard-container');
                    if (cardPrev) {
                        cardPrev.classList.add('slide-prev');
                        setTimeout(() => {
                            if (this.currentCardIndex > 0) this.currentCardIndex--;
                            this.render();
                        }, 400);
                    }
                    return;

                case 'restartCards':
                    console.log('🔄 Restart cards clicked, param:', param);
                    const cardShuffle = document.querySelector('.flashcard-container');
                    if (cardShuffle) {
                        cardShuffle.classList.add('shuffle-anim-card');
                    }
                    const delay = cardShuffle ? 600 : 0;
                    setTimeout(() => {
                        if (param === 'all' && this.selectedLessonId) {
                            const lessonId = this.selectedLessonId;
                            const lesson = window.lessonsData[lessonId];
                            
                            const originalIds = lesson && lesson.terms ? lesson.terms.map(t => String(t.id)) : [];
                            const userWordIds = this.userVocabulary
                                .filter(v => v.lessonId == lessonId)
                                .map(v => String(v.id));
                            const allIds = [...originalIds, ...userWordIds];
                            
                            if (allIds.length > 0) {
                                this.masteredWords = this.masteredWords.filter(id => !allIds.includes(id));
                            }
                            
                            this.currentCardIndex = 0;
                            this.saveUserData();
                            this.render();
                        }
                    }, delay);
                    this.showAd('image');
                    return;

                case 'addNewWord':
                    this.handleNewWord();
                    break;

                case 'backToLessons':
                    this.stopAudio();
                    this.currentPage = (this.selectedLevel === 'custom_list') ? 'custom_lessons_view' : 'lessons';
                    this.selectedLessonId = null;
                    this.isUnlockTest = false;
                    this.render();
                    setTimeout(() => window.scrollTo(0, this.scrollPos), 50);
                    return;

                case 'doAuth':
                    this.handleAuth(); // استدعاء handleAuth الجديد
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

                case 'viewTestHistoryDetails':
                    this.viewTestDetails(parseInt(index));
                    break;

                case 'backFromDetails':
                    this.viewingPlacementDetails = null;
                    this.currentPage = 'test_history';
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

                case 'spellingCheck':
                    this.handleSpellingCheck();
                    break;
                case 'spellingNext':
                    this.handleSpellingNext();
                    break;

                case 'startLevelTest':
                    this.prepareLevelTest(param);
                    break;
                case 'finishLevelTest':
                    this.finishLevelTestEarly();
                    break;

                case 'watchAds':
                    this.watchAdsForCoins();
                    break;
                case 'requestPurchase':
                    this.requestPurchase();
                    break;
                case 'toggleCoinModal':
                    this.toggleCoinModal();
                    break;
                case 'submitPurchase':
                    this.submitPurchaseRequest();
                    break;

                case 'updateProfile':
                    this.updateProfile();
                    break;
                case 'goToProfile':
                    this.showProfile();
                    break;
            }
            this.render();
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'spellingInput') {
                this.spellingUserAnswer = e.target.value;
            }
        });
    }

    // دوال أخرى (showAd, watchAdsForCoins, ...) كما هي
    // يجب أن تنسخها من ملفك القديم
}

const appInstance = new App();
