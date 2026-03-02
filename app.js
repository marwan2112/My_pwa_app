```java
class App {
    constructor() {
        this.currentAudio = null; // كائن الصوت الحالي
        this.audioPlaybackRate = 1.0; // السرعة الافتراضية
        this.availableSpeeds = [0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0]; // السرعات المتاحة
        this.placementStep = 0;
        this.currentDifficulty = 'A1';
        this.placementHistory = [];
        this.placementScore = 0;
        this.theme = localStorage.getItem('theme') || 'light';
        this.jumbleArabicHint = ''; // الترجمة العربية للجملة كمساعدة
        this.jumbleCurrentSentence = ''; // لتتبع الجملة التي طلبت الترجمة لها

        // تعريف الإحصائيات (XP والنقاط) والسجل
        this.userStats = JSON.parse(localStorage.getItem('userStats')) || { xp: 0, level: 1, badges: [], tier: 'برونزي' };
        this.placementResults = JSON.parse(localStorage.getItem('placementResults')) || [];
        this.placementFullHistory = JSON.parse(localStorage.getItem('placementFullHistory')) || [];
        this.currentPlacementDetails = [];
        this.viewingPlacementDetails = null;

        // نظام العملات (اللآلئ)
        this.userCoins = JSON.parse(localStorage.getItem('userCoins')) || 0;
        this.showCoinModal = false; // للتحكم في إظهار نافذة العملات

        // متغيرات خاصة بميزة إعادة ترتيب الجمل
        this.jumbleOriginalSentence = '';
        this.jumbleWords = [];
        this.jumbleUserAnswer = [];
        this.jumbleChecked = false;
        this.jumbleCorrect = false;
        this.jumbleHintUsed = false;
        this.jumbleHistory = []; // سجل الجمل المستخدمة
        this.jumbleUnlocked = {}; // تخزين حالة فتح الترتيب لكل درس
        this.jumbleNextCount = 0; // عداد الضغط على التالي في الترتيب

        // متغيرات خاصة بميزة الاستماع
        this.listeningRemaining = [];
        this.listeningCurrent = null;
        this.listeningOptions = [];
        this.listeningAnswered = false;
        this.listeningTimer = null;
        this.listeningErrorTimer = null;
        this.listeningUnlocked = {}; // تخزين حالة فتح الاستماع لكل درس
        this.listeningNextCount = 0; // عداد الضغط على التالي في الاستماع

        // متغيرات خاصة بتمرين الكتابة (Spelling)
        this.spellingRemaining = [];
        this.spellingCurrent = null;
        this.spellingAnswered = false;
        this.spellingUserAnswer = '';
        this.spellingResult = null; // 'correct', 'wrong', null
        this.spellingUnlocked = {}; // تخزين حالة فتح الكتابة لكل درس
        this.spellingNextCount = 0; // عداد الضغط على التالي في الكتابة

        // متغيرات خاصة بالاختبار الشامل للمستوى (Level Mastery Test)
        this.levelTestLevel = null; // المستوى المختار: 'beginner', 'intermediate', 'advanced'
        this.levelTestLessons = []; // قائمة الدروس في هذا المستوى (مرتبة)
        this.levelTestCurrentLessonIndex = 0; // فهرس الدرس الحالي في القائمة
        this.levelTestCurrentLessonId = null; // معرف الدرس الحالي
        this.levelTestLessonQuestions = []; // كلمات الدرس الحالي (مخلوطة عشوائياً)
        this.levelTestRequiredCorrect = 5; // عدد الإجابات الصحيحة المطلوبة لاجتياز الدرس الحالي (يبدأ بـ 5)
        this.levelTestCurrentCorrect = 0; // عدد الإجابات الصحيحة في الدرس الحالي
        this.levelTestCurrentTotal = 0; // عدد الأسئلة المجاب عنها في الدرس الحالي
        this.levelTestQuestionsBank = {}; // بنك الكلمات المتبقية لكل درس (لإعادة المحاولة)
        this.levelTestResults = []; // نتائج الدروس: { lessonId, passed, attempts }
        this.levelTestQuestionsAnswered = 0; // إجمالي الأسئلة المجاب عنها
        this.levelTestMaxQuestions = 100; // الحد الأقصى للأسئلة
        this.levelTestCurrentQuestion = null;
        this.levelTestCurrentOptions = [];
        this.levelTestUnlockedCount = 0; // عدد الدروس المفتوحة في هذا الاختبار
        this.levelTestCoinsEarned = 0; // اللؤلؤ المكتسب من فتح الدروس

        // تحميل آخر درس تم اختباره لكل مستوى (سيتم استخدامه للبدء)
        this.lastTestedLesson = JSON.parse(localStorage.getItem('lastTestedLesson')) || { beginner: 0, intermediate: 0, advanced: 0 };

        // تحميل حالة فتح التمارين
        const savedUnlocked = JSON.parse(localStorage.getItem('unlockedExercises')) || {};
        this.jumbleUnlocked = savedUnlocked.jumble || {};
        this.listeningUnlocked = savedUnlocked.listening || {};
        this.spellingUnlocked = savedUnlocked.spelling || {};

        // متغيرات الإعلانات والشراء
        this.newWordsAddedCount = JSON.parse(localStorage.getItem('newWordsAddedCount')) || 0; // عدد الكلمات الجديدة المضافة
        this.adWatchedCount = JSON.parse(localStorage.getItem('adWatchedCount')) || 0; // عدد الإعلانات التي تمت مشاهدتها (لكسب 50 لؤلؤة)

        // معلومات الشراء (بدون عرض IBAN)
        this.purchaseRequests = JSON.parse(localStorage.getItem('purchaseRequests')) || [];

        // بيانات الملف الشخصي
        this.userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
            name: '',
            age: '',
            joinDate: new Date().toLocaleDateString('ar-EG'),
            level: 'A1',
            image: '',
            testsHistory: []
        };

        // تحديث مستوى اللغة من آخر اختبار مستوى
        if (this.placementResults.length > 0) {
            this.userProfile.level = this.placementResults[0].level;
        }

        // تحديث الشارات والمستوى
        this.updateBadgesAndTier();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    updateBadgesAndTier() {
        const totalLessonsUnlocked = this.unlockedLessons ? this.unlockedLessons.length : 0;
        const totalMastered = this.masteredWords ? this.masteredWords.length : 0;

        // تحديث الشارات
        let newBadges = [];
        if (totalLessonsUnlocked >= 10 && totalMastered >= 100) newBadges.push('🥉'); // برونزي
        if (totalLessonsUnlocked >= 20 && totalMastered >= 500) newBadges.push('🥈'); // فضي
        if (totalLessonsUnlocked >= 50 && totalMastered >= 1500) newBadges.push('🥇'); // ذهبي
        if (totalLessonsUnlocked >= 100 && totalMastered >= 3000) newBadges.push('👑'); // ماسي

        this.userStats.badges = newBadges;

        // تحديث التاج (tier) بناءً على عدد الشارات
        if (newBadges.includes('👑')) this.userStats.tier = 'ماسي';
        else if (newBadges.includes('🥇')) this.userStats.tier = 'ذهبي';
        else if (newBadges.includes('🥈')) this.userStats.tier = 'فضي';
        else if (newBadges.includes('🥉')) this.userStats.tier = 'برونزي';
        else this.userStats.tier = 'بدون';

        // تحديث مستوى المستخدم بناءً على الدروس المفتوحة (نظام ذكي)
        if (totalLessonsUnlocked >= 100) this.userStats.level = 5;
        else if (totalLessonsUnlocked >= 60) this.userStats.level = 4;
        else if (totalLessonsUnlocked >= 30) this.userStats.level = 3;
        else if (totalLessonsUnlocked >= 10) this.userStats.level = 2;
        else this.userStats.level = 1;

        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    updateProgress(points) {
        this.userStats.xp += points;
        const totalMastered = this.masteredWords ? this.masteredWords.length : 0;
        this.updateBadgesAndTier();
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    init() {
        // إضافة CSS للوضع الليلي والأنماط الأخرى (بدون أنماط الخيارات)
        this.addThemeStyles();

        document.documentElement.setAttribute('data-theme', this.theme);

        if (!window.levels || !window.lessonsData || !window.placementBank || !window.lessonsList) {
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
            /* أنماط الوضع الليلي */
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
            [data-theme="dark"] .jumble-card,
            [data-theme="dark"] .spelling-card {
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

            /* أنماط الهيدر واللوجو */
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

            /* أنماط تمرين الكتابة */
            .spelling-input {
                width: 100%;
                padding: 15px;
                font-size: 1.2rem;
                border: 2px solid #ddd;
                border-radius: 8px;
                margin: 20px 0;
                direction: ltr;
                text-align: left;
            }
            .spelling-feedback {
                font-size: 1.2rem;
                font-weight: bold;
                margin: 10px 0;
            }
            .correct-feedback {
                color: #10b981;
            }
            .wrong-feedback {
                color: #ef4444;
            }

            /* أنماط الإعلانات والشراء */
            .ad-container {
                margin: 20px 0;
                padding: 15px;
                background: #f0f0f0;
                border-radius: 10px;
                text-align: center;
                border: 1px dashed #ffd700;
            }
            .bank-info {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 10px;
                font-size: 0.9rem;
                margin: 10px 0;
            }

            /* أنماط النافذة المنبثقة للعملات */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s;
            }
            .modal-content {
                background: white;
                border-radius: 16px;
                padding: 25px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                animation: slideUp 0.3s;
                position: relative;
            }
            [data-theme="dark"] .modal-content {
                background: #1e1e1e;
                color: white;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .modal-header h3 {
                margin: 0;
            }
            .close-btn {
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0 5px;
                color: #999;
                transition: color 0.2s;
            }
            .close-btn:hover {
                color: #333;
            }
            [data-theme="dark"] .close-btn:hover {
                color: white;
            }
            .coin-option {
                background: #f5f5f5;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                border: 1px solid #e0e0e0;
            }
            [data-theme="dark"] .coin-option {
                background: #2d2d2d;
                border-color: #444;
            }
            .coin-option:hover {
                transform: scale(1.02);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }

            /* أنماط صفحة الملف الشخصي */
            .profile-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            .profile-image {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: #e0e0e0;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 3px solid #ffd700;
                cursor: pointer;
            }
            .profile-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .profile-image svg {
                width: 70px;
                height: 70px;
                fill: #aaa;
            }
            .profile-info {
                width: 100%;
                background: #f9f9f9;
                border-radius: 12px;
                padding: 15px;
                margin: 5px 0;
            }
            [data-theme="dark"] .profile-info {
                background: #2d2d2d;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            [data-theme="dark"] .info-row {
                border-bottom-color: #444;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .progress-bar-container {
                width: 100%;
                height: 10px;
                background: #e0e0e0;
                border-radius: 5px;
                margin: 10px 0;
            }
            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #ffd700, #ffa500);
                border-radius: 5px;
                transition: width 0.3s;
            }

            /* أنماط النوافذ المنبثقة للنتائج */
            .result-modal {
                text-align: center;
            }
            .result-icon {
                font-size: 4rem;
                margin-bottom: 15px;
            }
            .result-message {
                font-size: 1.2rem;
                margin-bottom: 20px;
            }

            /* أنماط خيار فتح الدرس */
            .unlock-choice {
                display: flex;
                gap: 15px;
                flex-direction: column;
                margin: 20px 0;
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
        localStorage.setItem('lastTestedLesson', JSON.stringify(this.lastTestedLesson));
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));

        // حفظ حالة فتح التمارين
        const unlockedExercises = {
            jumble: this.jumbleUnlocked,
            listening: this.listeningUnlocked,
            spelling: this.spellingUnlocked
        };
        localStorage.setItem('unlockedExercises', JSON.stringify(unlockedExercises));

        // حفظ عدادات الإعلانات وطلبات الشراء
        localStorage.setItem('newWordsAddedCount', JSON.stringify(this.newWordsAddedCount));
        localStorage.setItem('adWatchedCount', JSON.stringify(this.adWatchedCount));
        localStorage.setItem('purchaseRequests', JSON.stringify(this.purchaseRequests));
    }

    // دالة لعرض إعلان (وهمية، ستستدعي موب ادد)
    showAd(type, callback) {
        console.log(`📺 عرض إعلان من نوع ${type}`);
        setTimeout(() => {
            if (callback) callback(true);
        }, 2000);
        alert(`جارٍ عرض الإعلان...`);
    }

    // مشاهدة 3 إعلانات لكسب 50 لؤلؤة
    watchAdsForCoins() {
        if (this.adWatchedCount >= 3) {
            this.showCustomModal('info', '⚠️', 'لقد استنفدت حصتك اليومية من مشاهدة الإعلانات. حاول غداً!');
            return;
        }
        this.showAd('rewarded', (success) => {
            if (success) {
                this.adWatchedCount++;
                if (this.adWatchedCount === 3) {
                    this.userCoins += 50;
                    this.showCustomModal('success', '🎉', 'تهانينا! حصلت على 50 لؤلؤة.');
                    this.saveData();
                    this.render();
                } else {
                    alert(`✅ تمت مشاهدة الإعلان ${this.adWatchedCount}/3`);
                }
            }
        });
    }

    // طلب شراء 300 لؤلؤة
    requestPurchase() {
        this.showPurchaseForm = true;
        this.showCoinModal = true;
        this.render();
    }

    submitPurchaseRequest() {
        const name = document.getElementById('purchaseName')?.value;
        const email = document.getElementById('purchaseEmail')?.value;
        const phone = document.getElementById('purchasePhone')?.value;
        if (!name || !email || !phone) {
            this.showCustomModal('error', '❌', 'الرجاء إدخال جميع البيانات');
            return;
        }
        this.purchaseRequests.push({
            name,
            email,
            phone,
            coins: 300,
            date: new Date().toISOString(),
            status: 'pending'
        });
        this.saveData();
        this.showCustomModal('success', '✅', 'تم إرسال طلبك بنجاح. سيتم التواصل معك قريباً لإتمام عملية الدفع.');
        this.showPurchaseForm = false;
        this.showCoinModal = false;
        this.render();
    }

    // إظهار/إخفاء نافذة العملات
    toggleCoinModal() {
        this.showCoinModal = !this.showCoinModal;
        this.showPurchaseForm = false;
        this.render();
    }

    // إظهار نافذة منبثقة جميلة
    showCustomModal(type, icon, message) {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-overlay';
        modalDiv.onclick = (e) => {
            if (e.target === modalDiv) modalDiv.remove();
        };
        modalDiv.innerHTML = `
            <div class="modal-content result-modal">
                <div class="result-icon">${icon}</div>
                <div class="result-message">${message}</div>
                <button class="hero-btn" onclick="this.closest('.modal-overlay').remove()" style="background:#3b82f6;">حسناً</button>
            </div>
        `;
        document.body.appendChild(modalDiv);
    }

    // دالة جديدة لفتح درس بالعملات (بدلاً من الاختبار)
    unlockLessonWithCoins(lessonId) {
        if (this.userCoins >= 100) {
            if (confirm('هل تريد فتح هذا الدرس باستخدام 100 لؤلؤة؟')) {
                this.userCoins -= 100;
                this.unlockedLessons.push(String(lessonId));
                this.saveData();
                this.updateBadgesAndTier();
                this.showCustomModal('success', '🎉', 'تم فتح الدرس بنجاح!');
                this.render();
                return true;
            } else {
                return false;
            }
        } else {
            this.showCustomModal('error', '❌', 'ليس لديك لآلئ كافية! تحتاج 100 لؤلؤة.');
            return false;
        }
    }

    // تعديل فتح الدرس: إما اختبار أو دفع
    openLesson(lessonId) {
        const list = window.lessonsList[this.selectedLevel] || [];
        const isUnlocked = this.unlockedLessons.includes(String(lessonId)) || (list[0] && list[0].id == lessonId) || this.selectedLevel === 'custom_list';
        if (isUnlocked) {
            // الدرس مفتوح بالفعل
            this.selectedLessonId = lessonId;
            this.currentPage = 'reading';
            this.isUnlockTest = false;
        } else {
            // الدرس مقفل، نعرض خيارين
            this.tempLessonToUnlock = lessonId;
            this.currentPage = 'unlock_choice';
        }
        this.render();
    }

    // إضافة اختبار إلى التاريخ
    addTestToHistory(testType, score, details) {
        this.userProfile.testsHistory.push({
            type: testType,
            date: new Date().toLocaleString('ar-EG'),
            score: score,
            details: details
        });
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
    }

    // صفحة الملف الشخصي
    showProfile() {
        this.currentPage = 'profile';
        this.render();
    }

    // عرض سجل اختبارات المستوى
    showTestHistory() {
        this.currentPage = 'test_history';
        this.render();
    }

    // عرض تفاصيل اختبار معين من السجل
    viewTestDetails(index) {
        const record = this.placementResults[index];
        if (record) {
            this.viewingPlacementDetails = record;
            this.currentPage = 'placement_details';
            this.render();
        }
    }

    // تحديث بيانات الملف الشخصي
    updateProfile() {
        const newName = document.getElementById('profileName')?.value;
        const newAge = document.getElementById('profileAge')?.value;
        const newPassword = document.getElementById('profilePassword')?.value;
        const imageFile = document.getElementById('profileImage')?.files[0];

        if (newName) this.userProfile.name = newName;
        if (newAge) this.userProfile.age = newAge;
        if (newPassword && this.userData) {
            this.userData.pass = newPassword;
        }
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userProfile.image = e.target.result;
                this.saveData();
                this.render();
            };
            reader.readAsDataURL(imageFile);
        } else {
            this.saveData();
            this.render();
        }
    }

    // حساب مستوى اللغة (A1, A2, ...) - يعيد آخر مستوى تم الحصول عليه من اختبار المستوى
    getEnglishLevel() {
        return this.userProfile.level || 'A1';
    }

    // ================== دوال إعادة ترتيب الجمل ==================
    prepareJumble() {
        const lesson = window.lessonsData[this.selectedLessonId];
        if (!lesson) return;

        const termWords = lesson.terms.map(t => t.english.toLowerCase());

        const sentences = lesson.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

        const usefulSentences = sentences.filter(s => {
            const words = s.split(/\s+/).length;
            if (words < 3 || words > 7) return false;
            const lower = s.toLowerCase();
            return termWords.some(word => lower.includes(word));
        });

        let availableSentences = usefulSentences.length > 0 ? usefulSentences : sentences.filter(s => {
            const words = s.split(/\s+/).length;
            return words >= 3 && words <= 7;
        });

        if (availableSentences.length === 0) {
            const words = lesson.terms.slice(0, 4).map(t => t.english);
            this.jumbleOriginalSentence = words.join(' ');
        } else {
            const unused = availableSentences.filter(s => !this.jumbleHistory.includes(s));
            if (unused.length === 0) {
                this.jumbleHistory = [];
                this.jumbleOriginalSentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
            } else {
                this.jumbleOriginalSentence = unused[Math.floor(Math.random() * unused.length)];
            }
            this.jumbleHistory.push(this.jumbleOriginalSentence);
        }

        this.jumbleCurrentSentence = this.jumbleOriginalSentence;

        this.translateText(this.jumbleOriginalSentence).then(translated => {
            if (this.jumbleCurrentSentence === this.jumbleOriginalSentence) {
                this.jumbleArabicHint = translated;
            }
            this.render();
        }).catch(() => {
            if (this.jumbleCurrentSentence === this.jumbleOriginalSentence) {
                this.jumbleArabicHint = '';
            }
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
        if (!this.jumbleHintUsed) {
            const firstWord = this.jumbleOriginalSentence.split(/\s+/)[0];
            if (firstWord && !this.jumbleUserAnswer.includes(firstWord)) {
                const index = this.jumbleWords.indexOf(firstWord);
                if (index !== -1) {
                    this.jumbleWords.splice(index, 1);
                    this.jumbleUserAnswer.push(firstWord);
                }
            }
            this.jumbleHintUsed = true;
        } else {
            const originalWords = this.jumbleOriginalSentence.split(/\s+/);
            for (let word of originalWords) {
                if (!this.jumbleUserAnswer.includes(word) && this.jumbleWords.includes(word)) {
                    const index = this.jumbleWords.indexOf(word);
                    this.jumbleWords.splice(index, 1);
                    this.jumbleUserAnswer.push(word);
                    break;
                }
            }
        }
        this.render();
    }

    handleJumbleNext() {
        this.jumbleNextCount++;
        if (this.jumbleNextCount % 10 === 0) {
            this.showAd('image');
        }
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
            btn.classList.remove('correct-answer', 'wrong-answer', 'other-option');
            if (btn.dataset.param === this.listeningCurrent.arabic) {
                btn.classList.add('correct-answer');
            } else if (btn.dataset.param === selectedArabic && !isCorrect) {
                btn.classList.add('wrong-answer');
            } else {
                btn.classList.add('other-option');
            }
        });

        if (isCorrect) {
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
            this.listeningErrorTimer = setTimeout(() => {
                this.listeningErrorTimer = null;
                this.listeningAnswered = false;
                // إعادة تعيين الألوان
                allOptions.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('correct-answer', 'wrong-answer', 'other-option');
                });
                this.render();
            }, 1500);
        }
    }

    // دالة لفتح اختبار الاستماع بالعملات (مرة واحدة لكل درس)
    unlockListening(lessonId) {
        if (this.listeningUnlocked[lessonId]) return true;
        if (this.userCoins >= 50) {
            if (confirm('هل تريد فتح اختبار الاستماع لهذا الدرس باستخدام 50 لؤلؤة؟')) {
                this.userCoins -= 50;
                this.listeningUnlocked[lessonId] = true;
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
    unlockJumble(lessonId) {
        if (this.jumbleUnlocked[lessonId]) return true;
        if (this.userCoins >= 50) {
            if (confirm('هل تريد فتح تمرين ترتيب الجمل لهذا الدرس باستخدام 50 لؤلؤة؟')) {
                this.userCoins -= 50;
                this.jumbleUnlocked[lessonId] = true;
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

    // دالة لفتح الكتابة بالعملات
    unlockSpelling(lessonId) {
        if (this.spellingUnlocked[lessonId]) return true;
        if (this.userCoins >= 50) {
            if (confirm('هل تريد فتح تمرين الكتابة لهذا الدرس باستخدام 50 لؤلؤة؟')) {
                this.userCoins -= 50;
                this.spellingUnlocked[lessonId] = true;
                this.saveData();
                this.prepareSpelling();
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

    // ================== دوال تمرين الكتابة (Spelling) ==================
    prepareSpelling() {
        const lesson = window.lessonsData[this.selectedLessonId];
        if (!lesson) return;

        const allTerms = [...lesson.terms, ...this.userVocabulary.filter(v => v.lessonId == this.selectedLessonId)];
        const available = allTerms.filter(t => !this.masteredWords.includes(String(t.id)) && !this.hiddenFromCards.includes(String(t.id)));

        if (available.length === 0) {
            alert('لا توجد كلمات متاحة للكتابة. قم بإضافة كلمات جديدة أو إعادة تعيين الكلمات المتقنة.');
            return;
        }

        if (this.spellingRemaining.length === 0) {
            this.spellingRemaining = [...available].sort(() => 0.5 - Math.random());
        }

        this.spellingCurrent = this.spellingRemaining[0];
        this.spellingAnswered = false;
        this.spellingUserAnswer = '';
        this.spellingResult = null;
    }

    handleSpellingCheck() {
        if (this.spellingAnswered || !this.spellingCurrent) return;
        const userAnswer = this.spellingUserAnswer.trim().toLowerCase();
        const correctAnswer = this.spellingCurrent.english.trim().toLowerCase();
        const isCorrect = (userAnswer === correctAnswer);
        this.spellingAnswered = true;
        this.spellingResult = isCorrect ? 'correct' : 'wrong';
        this.playTone(isCorrect ? 'correct' : 'error');
        if (isCorrect) {
            this.updateProgress(5);
            this.spellingRemaining.shift();
        } else {
            if (this.spellingRemaining.length > 1) {
                const wrongWord = this.spellingRemaining.shift();
                this.spellingRemaining.push(wrongWord);
            }
        }
        this.render();
    }

    handleSpellingNext() {
        if (this.spellingRemaining.length === 0) {
            alert('🎉 تهانينا! أكملت جميع الكلمات.');
            this.currentPage = 'reading';
        } else {
            this.spellingNextCount++;
            if (this.spellingNextCount % 10 === 0) {
                this.showAd('image');
            }
            this.prepareSpelling();
        }
        this.render();
    }

    handleSpellingInput(e) {
        this.spellingUserAnswer = e.target.value;
    }

    // ================== دوال الاختبار الشامل للمستوى ==================
    prepareLevelTest(levelParam) {
        let lessonIds = [];
        let levelName = '';

        if (levelParam === 'beginner') {
            levelName = 'beginner';
            lessonIds = window.lessonsList['beginner'] ? window.lessonsList['beginner'].map(l => l.id) : [];
        } else if (levelParam === 'intermediate') {
            levelName = 'intermediate';
            lessonIds = window.lessonsList['intermediate'] ? window.lessonsList['intermediate'].map(l => l.id) : [];
        } else if (levelParam === 'advanced') {
            levelName = 'advanced';
            lessonIds = window.lessonsList['advanced'] ? window.lessonsList['advanced'].map(l => l.id) : [];
        } else {
            return;
        }

        if (lessonIds.length === 0) {
            alert('لا توجد دروس في هذا المستوى.');
            return;
        }

        this.levelTestLevel = levelName;
        this.levelTestLessons = lessonIds;

        let startIndex = 0;
        for (let i = 0; i < lessonIds.length; i++) {
            if (!this.unlockedLessons.includes(lessonIds[i])) {
                startIndex = i;
                break;
            }
        }
        if (startIndex === 0 && this.unlockedLessons.includes(lessonIds[0])) {
            startIndex = this.lastTestedLesson[levelName] || 0;
            if (startIndex >= lessonIds.length) startIndex = 0;
        }

        this.levelTestCurrentLessonIndex = startIndex;
        this.levelTestCurrentLessonId = lessonIds[startIndex];
        this.levelTestRequiredCorrect = 5;
        this.levelTestCurrentCorrect = 0;
        this.levelTestCurrentTotal = 0;
        this.levelTestQuestionsBank = {};
        this.levelTestResults = [];
        this.levelTestQuestionsAnswered = 0;
        this.levelTestCurrentQuestion = null;
        this.levelTestUnlockedCount = 0;
        this.levelTestCoinsEarned = 0;

        lessonIds.forEach(id => {
            const lesson = window.lessonsData[id];
            if (lesson && lesson.terms) {
                let allWords = [...lesson.terms];
                const added = this.userVocabulary.filter(v => v.lessonId == id);
                allWords.push(...added);
                allWords = allWords.filter(t => !this.hiddenFromCards.includes(String(t.id)));
                this.shuffleArray(allWords);
                this.levelTestQuestionsBank[id] = allWords;
            } else {
                this.levelTestQuestionsBank[id] = [];
            }
        });

        this.loadNextLevelTestQuestion();
        this.currentPage = 'level_test';
        this.render();
    }

    // دالة مساعدة لجمع كل كلمات المستوى (للاستخدام في توليد الخيارات)
    getAllLevelWords() {
        if (!this.levelTestLevel) return [];
        const lessonIds = this.levelTestLessons || [];
        let allWords = [];
        lessonIds.forEach(id => {
            const lesson = window.lessonsData[id];
            if (lesson && lesson.terms) {
                allWords = allWords.concat(lesson.terms);
            }
            // إضافة الكلمات المضافة من المستخدم
            const added = this.userVocabulary.filter(v => v.lessonId == id);
            allWords = allWords.concat(added);
        });
        // إزالة الكلمات المخفية والمتقنة
        allWords = allWords.filter(t => !this.hiddenFromCards.includes(String(t.id)) && !this.masteredWords.includes(String(t.id)));
        // إزالة التكرار (حسب id)
        const unique = {};
        allWords.forEach(w => unique[w.id] = w);
        return Object.values(unique);
    }

    loadNextLevelTestQuestion() {
        if (this.levelTestQuestionsAnswered >= this.levelTestMaxQuestions) {
            this.finishLevelTestEarly();
            return;
        }

        const lessonId = this.levelTestCurrentLessonId;
        if (!lessonId) {
            this.finishLevelTestEarly();
            return;
        }

        let bank = this.levelTestQuestionsBank[lessonId];
        if (!bank || bank.length === 0) {
            this.moveToNextLesson();
            return;
        }

        this.levelTestCurrentQuestion = bank.shift();

        // جمع الخيارات الخاطئة
        let wrongOptions = [];

        // 1. من بنك الدرس الحالي (بعد إزالة السؤال الحالي)
        const currentLessonWords = [...bank]; // نسخة من البنك المتبقي
        this.shuffleArray(currentLessonWords);
        for (let i = 0; i < 3; i++) {
            if (currentLessonWords.length > i) {
                wrongOptions.push(currentLessonWords[i].arabic);
            } else {
                break;
            }
        }

        // 2. إذا لم يكتمل العدد، نستخدم كلمات من جميع دروس المستوى (عدا السؤال الحالي)
        if (wrongOptions.length < 3) {
            const allLevelWords = this.getAllLevelWords().filter(w => w.id !== this.levelTestCurrentQuestion.id);
            this.shuffleArray(allLevelWords);
            for (let i = 0; i < 3 - wrongOptions.length; i++) {
                if (allLevelWords.length > i) {
                    wrongOptions.push(allLevelWords[i].arabic);
                } else {
                    break;
                }
            }
        }

        // 3. إذا ما زال العدد ناقصاً، نضيف '???'
        while (wrongOptions.length < 3) {
            wrongOptions.push('???');
        }

        // تكوين الخيارات النهائية (صحيح + 3 خاطئة) وخلطها
        const options = [this.levelTestCurrentQuestion.arabic, ...wrongOptions];
        this.shuffleArray(options);
        this.levelTestCurrentOptions = options;
    }

    handleLevelTestAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());

        this.playTone(isCorrect ? 'correct' : 'error');

        // تلوين الأزرار باستخدام كلاسات
        const allOptions = document.querySelectorAll('.quiz-opt-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('correct-answer', 'wrong-answer', 'other-option');

            if (btn.dataset.correct === correct) {
                btn.classList.add('correct-answer');
            } else if (btn.dataset.param === selected && btn.dataset.correct !== correct) {
                btn.classList.add('wrong-answer');
            } else {
                btn.classList.add('other-option');
            }
        });

        this.levelTestQuestionsAnswered++;
        this.levelTestCurrentTotal++;
        if (isCorrect) {
            this.levelTestCurrentCorrect++;
        }

        if (!this.levelTestAnswers) this.levelTestAnswers = [];
        this.levelTestAnswers.push({
            question: this.levelTestCurrentQuestion,
            selected: selected,
            correct: correct,
            isCorrect: isCorrect
        });

        setTimeout(() => {
            if (this.levelTestCurrentCorrect >= this.levelTestRequiredCorrect) {
                // اجتاز الدرس
                if (!this.unlockedLessons.includes(this.levelTestCurrentLessonId)) {
                    this.unlockedLessons.push(this.levelTestCurrentLessonId);
                    this.levelTestUnlockedCount++;
                    this.userCoins += 20; // مكافأة لكل درس يُفتح
                    this.levelTestCoinsEarned += 20;
                    this.levelTestResults.push({
                        lessonId: this.levelTestCurrentLessonId,
                        passed: true,
                        attempts: this.levelTestCurrentTotal
                    });
                }
                this.moveToNextLesson();
            } else {
                // لم يجتز الدرس بعد
                if (this.levelTestQuestionsBank[this.levelTestCurrentLessonId].length === 0) {
                    const lesson = window.lessonsData[this.levelTestCurrentLessonId];
                    if (lesson && lesson.terms) {
                        let allWords = [...lesson.terms];
                        const added = this.userVocabulary.filter(v => v.lessonId == this.levelTestCurrentLessonId);
                        allWords.push(...added);
                        allWords = allWords.filter(t => !this.hiddenFromCards.includes(String(t.id)));
                        this.shuffleArray(allWords);
                        this.levelTestQuestionsBank[this.levelTestCurrentLessonId] = allWords;
                        this.levelTestRequiredCorrect += 2;
                        this.levelTestCurrentCorrect = 0;
                        this.levelTestCurrentTotal = 0;
                    } else {
                        this.moveToNextLesson();
                        this.isWaiting = false;
                        this.render();
                        return;
                    }
                }
                this.loadNextLevelTestQuestion();
            }
            this.isWaiting = false;
            this.render();
        }, 1200);
    }

    moveToNextLesson() {
        this.levelTestCurrentLessonIndex++;
        if (this.levelTestCurrentLessonIndex >= this.levelTestLessons.length) {
            this.finishLevelTestEarly();
            return;
        }
        this.levelTestCurrentLessonId = this.levelTestLessons[this.levelTestCurrentLessonIndex];
        this.levelTestRequiredCorrect = 5;
        this.levelTestCurrentCorrect = 0;
        this.levelTestCurrentTotal = 0;
        this.loadNextLevelTestQuestion();
    }

    finishLevelTestEarly() {
        const lastLessonIndex = this.levelTestCurrentLessonIndex;
        this.lastTestedLesson[this.levelTestLevel] = lastLessonIndex;
        this.saveData();

        const passedLessons = this.levelTestResults.filter(r => r.passed).map(r => r.lessonId);
        let message = '';
        if (passedLessons.length > 0) {
            message = `✅ تم فتح الدروس: ${passedLessons.join('، ')}.`;
            if (this.levelTestCurrentLessonIndex < this.levelTestLessons.length) {
                message += ` توقف عند الدرس ${this.levelTestLessons[this.levelTestCurrentLessonIndex]}.`;
            } else {
                message += ` 🎉 لقد أكملت جميع الدروس!`;
            }
        } else {
            if (this.levelTestCurrentLessonIndex < this.levelTestLessons.length) {
                message = `لم يتم فتح أي درس. استمر من الدرس ${this.levelTestLessons[this.levelTestCurrentLessonIndex]}.`;
            } else {
                message = `🎉 لقد أكملت جميع الدروس مسبقاً.`;
            }
        }

        // إضافة اللؤلؤ المكتسب
        if (this.levelTestCoinsEarned > 0) {
            message += `\nحصلت على ${this.levelTestCoinsEarned} لؤلؤة إضافية.`;
        }

        this.levelTestResultMessage = message;

        this.showAd('video', () => {
            this.currentPage = 'level_test_result';
            this.render();
            this.showCustomModal('info', '📊', message);
        });
    }

    // ================== دوال أخرى ==================
    isLessonCompleted(lessonId) {
        const lesson = window.lessonsData[lessonId];
        if (!lesson) return false;
        const allTermIds = lesson.terms.map(t => String(t.id));
        return allTermIds.every(id => this.masteredWords.includes(id));
    }

    grantLessonCompletionReward(lessonId) {
        const key = `lesson_completed_${lessonId}`;
        if (!localStorage.getItem(key) && this.isLessonCompleted(lessonId)) {
            this.userCoins += 20;
            localStorage.setItem(key, 'true');
            this.saveData();
            this.updateBadgesAndTier();
            this.showCustomModal('success', '🎉', `أحسنت! أكملت جميع كلمات الدرس وحصلت على 20 لؤلؤة إضافية.`);
        }
    }

    // ================== دوال الصوت والاختبارات العادية ==================
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
            this.audioCtx.resume().then(() => {
                this._playTone(type);
            }).catch(() => {});
        } else {
            this._playTone(type);
        }
    }

    _playTone(type) {
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

    playAudio(src) {
        const fullSrc = new URL(src, window.location.href).href;
        if (this.currentAudio) {
            if (this.currentAudio.src === fullSrc && !this.currentAudio.ended) {
                this.currentAudio.play();
                return;
            } else {
                this.currentAudio.pause();
            }
        }
        this.currentAudio = new Audio(fullSrc);
        this.currentAudio.playbackRate = this.audioPlaybackRate;
        this.currentAudio.play();
    }

    pauseAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
    }

    skipBack10() {
        if (this.currentAudio) {
            this.currentAudio.currentTime = Math.max(0, this.currentAudio.currentTime - 10);
        }
    }

    skipForward10() {
        if (this.currentAudio) {
            this.currentAudio.currentTime = Math.min(this.currentAudio.duration, this.currentAudio.currentTime + 10);
        }
    }

    setAudioSpeed(rate) {
        if (rate >= 0.5 && rate <= 3.0) {
            this.audioPlaybackRate = rate;
            if (this.currentAudio) {
                this.currentAudio.playbackRate = rate;
            }
            this.render();
        }
    }

    speedUp() {
        const currentIndex = this.availableSpeeds.indexOf(this.audioPlaybackRate);
        if (currentIndex < this.availableSpeeds.length - 1) {
            this.setAudioSpeed(this.availableSpeeds[currentIndex + 1]);
        }
    }

    speedDown() {
        const currentIndex = this.availableSpeeds.indexOf(this.audioPlaybackRate);
        if (currentIndex > 0) {
            this.setAudioSpeed(this.availableSpeeds[currentIndex - 1]);
        }
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
            btn.classList.remove('correct-answer', 'wrong-answer', 'other-option');
            if (btn.dataset.correct === correct) {
                btn.classList.add('correct-answer');
            } else if (btn.dataset.param === selected && btn.dataset.correct !== correct) {
                btn.classList.add('wrong-answer');
            } else {
                btn.classList.add('other-option');
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

            if (this.placementStep >= 35) {
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
                this.addTestToHistory('اختبار مستوى', this.placementScore, this.currentPlacementDetails);

                // تحديث مستوى اللغة في الملف الشخصي
                this.userProfile.level = res.level;
                localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
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
            this.quizQuestions = fullPool.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(fullPool.length / 2)));
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
        while (wrongs.length < 3) wrongs.push("خيار " + (wrongs.length + 1));
        this.quizOptions = [currentQ.arabic, ...wrongs].sort(() => 0.5 - Math.random());
    }

    handleAnswer(selected, correct, btnElement) {
        if (this.isWaiting) return;
        this.isWaiting = true;
        const isCorrect = (selected.trim().toLowerCase() === correct.trim().toLowerCase());
        if (isCorrect) {
            this.quizScore++;
            this.playTone('correct');
        } else {
            this.playTone('error');
        }

        const allOptions = document.querySelectorAll('.quiz-opt-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('correct-answer', 'wrong-answer', 'other-option');
            if (btn.dataset.correct === correct) {
                btn.classList.add('correct-answer');
            } else if (btn.dataset.param === selected && btn.dataset.correct !== correct) {
                btn.classList.add('wrong-answer');
            } else {
                btn.classList.add('other-option');
            }
        });

        setTimeout(() => {
            this.quizIndex++;
            if (this.quizIndex < this.quizQuestions.length) this.generateOptions();
            this.isWaiting = false;
            this.render();
        }, 1100);
    }

    // ================== الأحداث العامة ==================
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
                        this.saveData();
                        if (this.selectedLessonId) {
                            this.grantLessonCompletionReward(this.selectedLessonId);
                        }
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
                    if (confirm('سيتم حذف التقدم، متأكد؟')) { localStorage.clear(); location.reload(); }
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
                    // فتح الدرس بالاختبار (الطريقة القديمة)
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
                    // فتح الدرس بالعملات
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
                    if (confirm('حذف نهائي من البطاقات؟')) {
                        const cardD = document.querySelector('.flashcard-container');
                        if (cardD) {
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
                    const cardShuffle = document.querySelector('.flashcard-container');
                    if (cardShuffle) {
                        cardShuffle.classList.add('shuffle-anim-card');
                        setTimeout(() => {
                            if (param === 'all') {
                                const lessonWords = window.lessonsData[this.selectedLessonId].terms.map(t => String(t.id));
                                this.masteredWords = this.masteredWords.filter(id => !lessonWords.includes(id));
                            }
                            this.currentCardIndex = 0;
                            this.saveData(); this.render();
                        }, 600);
                        this.showAd('image');
                    }
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

                // أحداث جديدة للعملات والإعلانات
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

                // أحداث الملف الشخصي
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

    handleAuth() {
        const n = document.getElementById('authName').value;
        const e = document.getElementById('authEmail').value;
        const p = document.getElementById('authPass').value;
        if (n && e && p) {
            this.userData = { name: n, email: e, pass: p };
            if (!localStorage.getItem('userAccount')) {
                this.userCoins = 100;
                this.userProfile.name = n;
                this.userProfile.joinDate = new Date().toLocaleDateString('ar-EG');
            }
            this.saveData();
            this.currentPage = 'home';
            this.render();
        }
    }

    handleNewWord() {
        const eng = document.getElementById('newEng').value.trim();
        const arb = document.getElementById('newArb').value.trim();
        if (eng && arb) {
            this.userVocabulary.push({ id: "u" + Date.now(), lessonId: String(this.selectedLessonId), english: eng, arabic: arb });
            this.saveData();
            document.getElementById('newEng').value = '';
            document.getElementById('newArb').value = '';
            this.newWordsAddedCount++;
            if (this.newWordsAddedCount % 10 === 0) {
                this.showAd('video');
            }
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
            if (window.lessonsData[id]) window.lessonsData[id].title = newTitle.trim();
            this.saveData(); this.render();
        }
    }

    editLessonContent(id) {
        const newC = prompt("تعديل نص الموضوع:", this.customLessons[id].content);
        if (newC && newC.trim()) {
            this.customLessons[id].content = newC.trim();
            if (window.lessonsData[id]) window.lessonsData[id].content = newC.trim();
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

        if (this.showCoinModal) {
            const modalDiv = document.createElement('div');
            modalDiv.className = 'modal-overlay';
            modalDiv.onclick = (e) => {
                if (e.target === modalDiv) this.toggleCoinModal();
            };
            let modalContent = '';
            if (this.showPurchaseForm) {
                modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>💰 طلب شراء 300 لؤلؤة</h3>
                            <span class="close-btn" onclick="appInstance.toggleCoinModal()">&times;</span>
                        </div>
                        <p style="text-align:center; margin-bottom:15px;">مقابل 1 دولار أمريكي</p>
                        <div class="purchase-form">
                            <input type="text" id="purchaseName" placeholder="الاسم الكامل" />
                            <input type="email" id="purchaseEmail" placeholder="البريد الإلكتروني" />
                            <input type="tel" id="purchasePhone" placeholder="رقم الهاتف" />
                            <button class="hero-btn" data-action="submitPurchase" style="background:#10b981;">إرسال الطلب</button>
                        </div>
                    </div>
                `;
            } else {
                modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>💰 خيارات العملات</h3>
                            <span class="close-btn" onclick="appInstance.toggleCoinModal()">&times;</span>
                        </div>
                        <div class="coin-option" onclick="appInstance.watchAdsForCoins()">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:1.2rem;">👁️ مشاهدة 3 إعلانات</span>
                                <span style="background:#ffd700; padding:5px 10px; border-radius:20px;">+50</span>
                            </div>
                        </div>
                        <div class="coin-option" onclick="appInstance.requestPurchase()">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:1.2rem;">💳 شراء 300 لؤلؤة</span>
                                <span style="background:#ffd700; padding:5px 10px; border-radius:20px;">1$</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            modalDiv.innerHTML = modalContent;
            app.appendChild(modalDiv);
        }
    }

    getHeader() {
        if (this.currentPage === 'auth') return '';
        let nav = '';
        if (this.selectedLessonId && ['reading', 'flashcards', 'quiz', 'jumble', 'listening', 'spelling'].includes(this.currentPage) && !this.isUnlockTest) {
            nav = `<nav class="nav-menu">
                <button class="nav-btn ${this.currentPage === 'reading' ? 'active' : ''}" data-action="setPage" data-param="reading">📖 النص</button>
                <button class="nav-btn ${this.currentPage === 'flashcards' ? 'active' : ''}" data-action="setPage" data-param="flashcards">🎴 بطاقات</button>
                <button class="nav-btn ${this.currentPage === 'quiz' ? 'active' : ''}" data-action="setPage" data-param="quiz">🧩 اختبار</button>
                <button class="nav-btn ${this.currentPage === 'jumble' ? 'active' : ''}" data-action="setPage" data-param="jumble">🔤 ترتيب</button>
                <button class="nav-btn ${this.currentPage === 'listening' ? 'active' : ''}" data-action="setPage" data-param="listening">🎧 استماع</button>
                <button class="nav-btn ${this.currentPage === 'spelling' ? 'active' : ''}" data-action="setPage" data-param="spelling">✍️ كتابة</button>
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
            <div style="background: #ffd700; color: #000; padding: 5px 10px; border-radius: 20px; font-weight: bold; display: flex; align-items: center; gap: 5px; cursor:pointer;" data-action="toggleCoinModal">
                <span>💎</span> ${this.userCoins}
                <span style="font-size:1.2rem;">➕</span>
            </div>
            <button data-action="goToProfile" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">👤</button>
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
            const totalLessons = this.unlockedLessons ? this.unlockedLessons.length : 0;
            const totalMastered = this.masteredWords ? this.masteredWords.length : 0;

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
                    <div style="margin-top: 10px; font-size:0.9rem;">التاج الحالي: ${this.userStats.tier}</div>
                    <div style="margin-top: 5px; font-size:0.9rem;">الدروس المفتوحة: ${totalLessons} | الكلمات المتقنة: ${totalMastered}</div>
                </div>

                <button class="hero-btn" data-action="setPage" data-param="addLesson" style="width:100%; background:#8b5cf6; margin-top:15px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">📸 إضافة من الكاميرا أو الهاتف</button>
                <button class="hero-btn" data-action="setPage" data-param="placement_test" style="width:100%; background:#ec4899; margin:15px 0; box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.3);">🧠 اختبار مستوى </button>

                <div class="features-grid">
                    ${window.levels.map(l => `<div class="feature-card" data-action="selLevel" data-param="${l.id}"><h3>${l.icon} ${l.name}</h3></div>`).join('')}
                    ${Object.keys(this.customLessons).length > 0 ? `<div class="feature-card" data-action="selLevel" data-param="custom_list" style="border:1px solid #f97316;"><h3>📂 نصوصي</h3></div>` : ''}
                </div>

                <button data-action="logout" class="logout-btn" style="margin-top: 20px; background: #dc2626; color: white; padding: 14px 20px; font-size: 1.2rem; font-weight: bold; border-radius: 10px; width: 100%; border: none; cursor: pointer;">تسجيل الخروج</button>
            </main>`;
        }

        if (this.currentPage === 'profile') {
            const englishLevel = this.getEnglishLevel();
            const totalLessons = this.unlockedLessons.length;
            const totalMastered = this.masteredWords.length;
            const progressPercent = (totalLessons / 100) * 100;

            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← رجوع</button>
                <div class="reading-card profile-container">
                    <div class="profile-image" onclick="document.getElementById('profileImage').click()">
                        ${this.userProfile.image ?
                    `<img src="${this.userProfile.image}" alt="profile">` :
                    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="#aaa"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
                }
                    </div>
                    <input type="file" id="profileImage" accept="image/*" style="display:none;" onchange="appInstance.updateProfile()">

                    <div class="profile-info">
                        <div class="info-row"><span>الاسم:</span> <span><input type="text" id="profileName" value="${this.userProfile.name || this.userData?.name || ''}" placeholder="الاسم"></span></div>
                        <div class="info-row"><span>العمر:</span> <span><input type="number" id="profileAge" value="${this.userProfile.age || ''}" placeholder="العمر"></span></div>
                        <div class="info-row"><span>تاريخ الانضمام:</span> <span>${this.userProfile.joinDate}</span></div>
                        <div class="info-row"><span>المستوى في التطبيق:</span> <span>${this.userStats.level}</span></div>
                        <div class="info-row"><span>مستوى اللغة:</span> <span>${englishLevel}</span></div>
                        <div class="info-row"><span>كلمة المرور:</span> <span><input type="password" id="profilePassword" placeholder="جديدة"></span></div>
                    </div>

                    <div style="width:100%; margin:15px 0;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>التقدم العام</span>
                            <span>${totalLessons} درس / 100</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>

                    <button class="hero-btn" data-action="updateProfile" style="background:#10b981;">حفظ التغييرات</button>

                    <h4 style="margin:15px 0 10px;">📜 سجل الاختبارات</h4>
                    <button class="hero-btn" data-action="setPage" data-param="test_history" style="background:#3b82f6;">عرض سجل الاختبارات</button>
                </div>
            </main>`;
        }

        if (this.currentPage === 'test_history') {
            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← الرجوع للرئيسية</button>
                <div class="reading-card">
                    <h2 style="text-align:center;">📋 سجل اختبارات المستوى</h2>
                    ${this.placementResults.length === 0 ?
                    '<p style="text-align:center; color:#666;">لا توجد اختبارات سابقة</p>' :
                    `<div class="history-list">
                        ${this.placementResults.map((r, idx) => `
                            <div class="history-item" onclick="appInstance.viewTestDetails(${idx})">
                                <div style="display:flex; justify-content:space-between;">
                                    <span><strong>${r.date}</strong></span>
                                    <span>المستوى: ${r.level}</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-top:5px;">
                                    <span>الدرجة: ${r.score}/35</span>
                                    <span>IELTS: ${r.ielts}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
                </div>
            </main>`;
        }

        if (this.currentPage === 'placement_test') {
            if (this.placementStep >= 35) {
                return `<div class="reading-card result-card">
                    <h2 style="text-align:center;">🏁 نتيجة الاختبار</h2>
                    <div style="background:#f0f7ff; padding:15px; border-radius:10px; margin:10px 0; text-align:center;">
                        <h1 style="color:#1e40af; margin-bottom:5px;">${this.currentDifficulty}</h1>
                        <p style="font-weight:bold; color:#3b82f6;">IELTS: ${this.getIeltsEquivalent(this.currentDifficulty)}</p>
                        <p style="font-size:0.9rem; color:#64748b;">مجموع الإجابات الصحيحة: ${this.placementScore} / 35</p>
                    </div>
                    <h4 style="margin-top:15px;">📜 سجل نتائجك السابقة:</h4>
                    <div style="max-height:200px; overflow-y:auto; font-size:0.9rem; margin-bottom:15px; border:1px solid #e2e8f0; border-radius:8px;">
                        ${this.placementResults.map((r, idx) => `
                            <div style="border-bottom:1px solid #e2e8f0; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span>📅 ${r.date}</span><br>
                                    <strong>المستوى: ${r.level}</strong> (${r.score}/35)
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
                <p style="text-align:center;">المستوى النهائي: <strong>${this.viewingPlacementDetails.level}</strong> | الدرجة: ${this.viewingPlacementDetails.score}/35</p>
                <div style="max-height:400px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                    ${details.map((d, i) => `
                        <div style="border-bottom:1px solid #e2e8f0; padding:10px; margin-bottom:5px;">
                            <p><strong>س${i + 1}:</strong> ${d.question}</p>
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
            let testLevelParam = '';
            if (this.selectedLevel === 'beginner') testLevelParam = 'beginner';
            else if (this.selectedLevel === 'intermediate') testLevelParam = 'intermediate';
            else if (this.selectedLevel === 'advanced') testLevelParam = 'advanced';

            return `<main class="main-content">
                <button class="hero-btn" data-action="goHome" style="margin-bottom:15px; background:#64748b;">← رجوع</button>
                ${testLevelParam ? `
                <div style="margin-bottom:20px; text-align:center;">
                    <button class="hero-btn" data-action="startLevelTest" data-param="${testLevelParam}" style="background:#8b5cf6;">📊 اختبار المستوى الشامل (100 سؤال)</button>
                </div>
                ` : ''}
                <div class="features-grid">
                    ${list.map(l => {
                const isOk = (list[0].id == l.id || this.unlockedLessons.includes(String(l.id)));
                return `<div class="feature-card" data-action="selLesson" data-param="${l.id}" style="${isOk ? '' : 'opacity:0.6;'}"><h3>${isOk ? '' : '🔒 '}${l.title}</h3></div>`;
            }).join('')}
                </div>
            </main>`;
        }

        if (this.currentPage === 'unlock_choice') {
            return `<div class="reading-card" style="text-align:center;">
                <h3>🔓 فتح الدرس</h3>
                <p>اختر طريقة فتح الدرس:</p>
                <div class="unlock-choice">
                    <button class="hero-btn" data-action="unlockWithTest" data-param="${this.tempLessonToUnlock}" style="background:#3b82f6;">🧪 خوض الاختبار</button>
                    <button class="hero-btn" data-action="unlockWithCoins" data-param="${this.tempLessonToUnlock}" style="background:#ffd700; color:#000;">💰 دفع 100 لؤلؤة (رصيدك: ${this.userCoins})</button>
                </div>
                <button class="hero-btn" data-action="goHome" style="margin-top:15px; background:#64748b;">الرئيسية</button>
            </div>`;
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
            const audioSrc = lesson.audio || `audio/${lesson.id}.mp3`;

            return `<main class="main-content">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <button class="hero-btn" data-action="backToLessons" style="background:#64748b;">⬅ تراجع</button>
                    <div style="display: flex; gap: 5px; background: #f0f0f0; padding: 5px; border-radius: 8px; flex-wrap: wrap;">
                        <button class="hero-btn" data-action="playAudio" data-param="${audioSrc}" style="background:#3b82f6; padding: 5px 10px;">▶️ تشغيل</button>
                        <button class="hero-btn" data-action="pauseAudio" style="background:#f59e0b; padding: 5px 10px;">⏸️ إيقاف مؤقت</button>
                        <button class="hero-btn" data-action="stopAudio" style="background:#ef4444; padding: 5px 10px;">⏹️ إيقاف</button>
                        <button class="hero-btn" data-action="skipBack10" style="background:#8b5cf6; padding: 5px 10px;">⏪ 10</button>
                        <button class="hero-btn" data-action="skipForward10" style="background:#8b5cf6; padding: 5px 10px;">10 ⏩</button>
                        <button class="hero-btn" data-action="speedDown" style="background:#8b5cf6; padding: 5px 10px;">🐢</button>
                        <span style="background:#fff; padding: 5px 10px; border-radius: 5px;">${this.audioPlaybackRate.toFixed(2)}x</span>
                        <button class="hero-btn" data-action="speedUp" style="background:#8b5cf6; padding: 5px 10px;">🐇</button>
                    </div>
                </div>
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
                        <div class="flashcard-back"><h1>${t.arabic}</h1></div>
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
                const pass = (this.quizScore / this.quizQuestions.length) >= 0.75;
                if (this.isUnlockTest && pass) {
                    this.unlockedLessons.push(String(this.tempLessonToUnlock));
                    this.userCoins += 20;
                    this.saveData();
                    this.updateBadgesAndTier();
                    this.showCustomModal('success', '🎉', `لقد فتحت درساً جديداً وحصلت على 20 لؤلؤة!`);
                }
                this.saveData();
                return `<div class="reading-card finish-box">
                    <h2>${pass ? "نجحت! 🎉" : "حاول مجدداً"}</h2>
                    <button class="hero-btn" data-action="backToLessons">متابعة</button>
                </div>`;
            }
            const q = this.quizQuestions[this.quizIndex];
            return `<div class="reading-card quiz-box">
                <div class="quiz-info">السؤال ${this.quizIndex + 1}/${this.quizQuestions.length}</div>
                <h2>${q.english}</h2>
                <button class="quiz-speak-btn" data-action="speak" data-param="${q.english}">🔊</button>
                <div class="quiz-options">
                    ${this.quizOptions.map(opt => `<button class="quiz-opt-btn" data-action="ansQ" data-param="${opt}" data-correct="${q.arabic}">${opt}</button>`).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'jumble') {
            if (!this.jumbleUnlocked[this.selectedLessonId]) {
                return `<div class="reading-card" style="text-align: center;">
                    <h3>🔤 ترتيب الجمل</h3>
                    <p>لفتح هذا التمرين تحتاج 50 💎 لؤلؤة (مرة واحدة فقط للدرس).</p>
                    <p>رصيدك الحالي: ${this.userCoins} 💎</p>
                    <button class="hero-btn" onclick="appInstance.unlockJumble('${this.selectedLessonId}')" style="background: #8b5cf6;">فتح (50 💎)</button>
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

        if (this.currentPage === 'listening') {
            if (!this.listeningUnlocked[this.selectedLessonId]) {
                return `<div class="reading-card" style="text-align: center;">
                    <h3>🎧 اختبار الاستماع</h3>
                    <p>لفتح هذا الاختبار تحتاج 50 💎 لؤلؤة (مرة واحدة فقط للدرس).</p>
                    <p>رصيدك الحالي: ${this.userCoins} 💎</p>
                    <button class="hero-btn" onclick="appInstance.unlockListening('${this.selectedLessonId}')" style="background: #8b5cf6;">فتح (50 💎)</button>
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

        if (this.currentPage === 'spelling') {
            if (!this.spellingUnlocked[this.selectedLessonId]) {
                return `<div class="reading-card" style="text-align: center;">
                    <h3>✍️ تمرين الكتابة</h3>
                    <p>لفتح هذا التمرين تحتاج 50 💎 لؤلؤة (مرة واحدة فقط للدرس).</p>
                    <p>رصيدك الحالي: ${this.userCoins} 💎</p>
                    <button class="hero-btn" onclick="appInstance.unlockSpelling('${this.selectedLessonId}')" style="background: #8b5cf6;">فتح (50 💎)</button>
                </div>`;
            }
            if (!this.spellingCurrent) {
                return `<div class="reading-card"><p>لا توجد كلمات متاحة. حاول مرة أخرى.</p></div>`;
            }
            return `<div class="reading-card spelling-card">
                <h3>✍️ اكتب الكلمة بالانجليزية</h3>
                <div style="font-size: 2rem; text-align: center; margin: 20px 0; padding: 20px; background: #f0f7ff; border-radius: 12px;">
                    ${this.spellingCurrent.arabic}
                </div>
                <input type="text" id="spellingInput" class="spelling-input" placeholder="اكتب الكلمة هنا..." value="${this.spellingUserAnswer}" ${this.spellingAnswered ? 'disabled' : ''}>
                ${this.spellingResult ? `
                    <div class="spelling-feedback ${this.spellingResult === 'correct' ? 'correct-feedback' : 'wrong-feedback'}">
                        ${this.spellingResult === 'correct' ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة!'}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="hero-btn" data-action="spellingCheck" style="background:#10b981;" ${this.spellingAnswered ? 'disabled' : ''}>✅ تحقق</button>
                    ${this.spellingAnswered ? `<button class="hero-btn" data-action="spellingNext" style="background:#3b82f6;">➡️ التالي</button>` : ''}
                </div>
            </div>`;
        }

        if (this.currentPage === 'level_test') {
            if (!this.levelTestCurrentQuestion) {
                return `<div class="reading-card"><p>جاري تحضير الاختبار...</p></div>`;
            }
            const q = this.levelTestCurrentQuestion;
            const options = this.levelTestCurrentOptions || [];

            return `<div class="reading-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <span style="background:#e2e8f0; color:#475569; padding:5px 15px; border-radius:20px; font-weight:bold; font-size:0.85rem;">
                        السؤال ${this.levelTestQuestionsAnswered + 1} / ${this.levelTestMaxQuestions}
                    </span>
                    <button class="hero-btn" data-action="finishLevelTest" style="background:#ef4444; padding:5px 15px;">⏹️ إنهاء الاختبار</button>
                </div>
                <h2 style="margin-bottom:30px; text-align:center; font-size:2rem;">${q.english}</h2>
                <div style="text-align: center; margin: 10px 0;">
                    <button class="quiz-speak-btn" data-action="speak" data-param="${q.english}">🔊</button>
                </div>
                <div class="quiz-options">
                    ${options.map(opt => `
                        <button class="quiz-opt-btn"
                                data-action="levelTestAns"
                                data-param="${opt}"
                                data-correct="${q.arabic}">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        }

        if (this.currentPage === 'level_test_result') {
            return `<div class="reading-card">
                <h2 style="text-align:center;">🏁 نتيجة الاختبار الشامل</h2>
                <div style="background:#f0f7ff; padding:15px; border-radius:10px; margin:20px 0; text-align:center;">
                    <p style="font-size:1.2rem;">${this.levelTestResultMessage}</p>
                </div>
                <button class="hero-btn" data-action="goHome" style="background:#64748b;">العودة للرئيسية</button>
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

        const logoImg = document.querySelector('.logo-container img');
        if (logoImg) {
            logoImg.src = 'wordwise_logo.png';
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
