// script.js - Основная логика приложения
class VerbTrainer {
    constructor() {
        this.verbs = window.verbsData || {};
        
        if (Object.keys(this.verbs).length === 0) {
            console.error('Данные не загрузились! Проверьте файл verbs-data.js');
            alert('Ошибка: данные не загрузились! Проверьте файл verbs-data.js');
        } else {
            console.log(`Загружено ${Object.keys(this.verbs).length} глаголов`);
        }
        
        this.currentExercise = null;
        this.stats = { 
            correct: 0,
            total: 0,
            wrong: 0
        };
        this.selectedTimes = ['presente'];
        this.selectedPronouns = ['yo'];
        this.selectedGroups = ['all'];
        this.selectedLevels = ['all'];
        this.wrongAnswers = [];
        this.isReviewMode = false;
        
        this.initElements();
        this.bindEvents();
        this.loadStats();
    }
    
    initElements() {
        this.settingsSection = document.getElementById('settingsSection');
        this.exerciseSection = document.getElementById('exerciseSection');
        this.currentVerbElem = document.getElementById('currentVerb');
        this.currentTimeElem = document.getElementById('currentTime');
        this.currentPronounElem = document.getElementById('currentPronoun');
        this.answerInput = document.getElementById('answerInput');
        this.feedbackElem = document.getElementById('feedback');
        this.correctCountElem = document.getElementById('correctCount');
        this.totalCountElem = document.getElementById('totalCount');
        this.wrongCountElem = document.getElementById('wrongCount');
        this.reviewBtn = document.getElementById('reviewBtn');
        this.reviewCountElem = document.getElementById('reviewCount');
        this.backBtn = document.getElementById('backBtn');
        
        this.waitingForNext = false;
        
        // Инициализация выбранных времён и местоимений
        this.updateSelectedTimes();
        this.updateSelectedPronouns();
        
        // Инициализация выбранных групп и уровней
        this.updateSelectedGroups();
        this.updateSelectedLevels();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startTraining());
        document.getElementById('reviewBtn').addEventListener('click', () => this.startReview());
        document.getElementById('checkBtn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('skipBtn').addEventListener('click', () => this.nextExercise());
        document.getElementById('showAnswerBtn').addEventListener('click', () => this.showAnswer());
        this.backBtn.addEventListener('click', () => this.returnToSettings());
        
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (this.waitingForNext) {
                    this.nextExercise();
                } else {
                    this.checkAnswer();
                }
            }
        });
        
        // Обработка чекбоксов времён
        document.querySelectorAll('input[name="time"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedTimes());
        });
        
        // Обработка чекбоксов местоимений
        document.querySelectorAll('input[name="pronoun"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedPronouns());
        });
        
        // Обработка чекбоксов групп
        document.querySelectorAll('input[name="group"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleGroupChange());
        });
        
        // Обработка чекбоксов уровней
        document.querySelectorAll('input[name="level"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleLevelChange());
        });
        
        // Обновление кнопки повтора при любом изменении настроек
        const allCheckboxes = document.querySelectorAll('input[name="time"], input[name="pronoun"], input[name="group"], input[name="level"]');
        allCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateReviewButton());
        });
    }
    
    updateSelectedTimes() {
        this.selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked'))
            .map(cb => cb.value);
        
        if (this.selectedTimes.length === 0) {
            const firstCheckbox = document.querySelector('input[name="time"]');
            if (firstCheckbox) {
                firstCheckbox.checked = true;
                this.selectedTimes = [firstCheckbox.value];
            }
        }
        
        this.updateReviewButton();
    }
    
    updateSelectedPronouns() {
        this.selectedPronouns = Array.from(document.querySelectorAll('input[name="pronoun"]:checked'))
            .map(cb => cb.value);
        
        if (this.selectedPronouns.length === 0) {
            const firstCheckbox = document.querySelector('input[name="pronoun"]');
            if (firstCheckbox) {
                firstCheckbox.checked = true;
                this.selectedPronouns = [firstCheckbox.value];
            }
        }
        
        this.updateReviewButton();
    }
    
    handleGroupChange() {
        const allCheckbox = document.querySelector('input[name="group"][value="all"]');
        const groupCheckboxes = document.querySelectorAll('input[name="group"]:not([value="all"])');
        
        if (allCheckbox.checked) {
            // Если выбран "Все группы", снять все остальные
            groupCheckboxes.forEach(cb => cb.checked = false);
            this.selectedGroups = ['all'];
        } else {
            // Если выбран конкретный глагол, снять "Все группы"
            allCheckbox.checked = false;
            
            this.selectedGroups = Array.from(groupCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            // Если ничего не выбрано, выбрать "Все группы"
            if (this.selectedGroups.length === 0) {
                allCheckbox.checked = true;
                this.selectedGroups = ['all'];
            }
        }
        
        this.updateReviewButton();
    }
    
    updateSelectedGroups() {
        const allCheckbox = document.querySelector('input[name="group"][value="all"]');
        const groupCheckboxes = document.querySelectorAll('input[name="group"]:not([value="all"])');
        
        if (allCheckbox.checked) {
            this.selectedGroups = ['all'];
        } else {
            this.selectedGroups = Array.from(groupCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
        }
    }
    
    handleLevelChange() {
        const allCheckbox = document.querySelector('input[name="level"][value="all"]');
        const levelCheckboxes = document.querySelectorAll('input[name="level"]:not([value="all"])');
        
        if (allCheckbox.checked) {
            // Если выбран "Все уровни", снять все остальные
            levelCheckboxes.forEach(cb => cb.checked = false);
            this.selectedLevels = ['all'];
        } else {
            // Если выбран конкретный уровень, снять "Все уровни"
            allCheckbox.checked = false;
            
            this.selectedLevels = Array.from(levelCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            // Если ничего не выбрано, выбрать "Все уровни"
            if (this.selectedLevels.length === 0) {
                allCheckbox.checked = true;
                this.selectedLevels = ['all'];
            }
        }
        
        this.updateReviewButton();
    }
    
    updateSelectedLevels() {
        const allCheckbox = document.querySelector('input[name="level"][value="all"]');
        const levelCheckboxes = document.querySelectorAll('input[name="level"]:not([value="all"])');
        
        if (allCheckbox.checked) {
            this.selectedLevels = ['all'];
        } else {
            this.selectedLevels = Array.from(levelCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
        }
    }
    
    getFilteredVerbs() {
        let verbs = Object.keys(this.verbs);
        
        // Фильтрация по группам
        if (!this.selectedGroups.includes('all')) {
            verbs = verbs.filter(verb => {
                const verbGroup = this.verbs[verb].group;
                return this.selectedGroups.includes(verbGroup);
            });
        }
        
        // Фильтрация по уровням
        if (!this.selectedLevels.includes('all')) {
            verbs = verbs.filter(verb => {
                const verbLevel = this.verbs[verb].level.toString();
                return this.selectedLevels.includes(verbLevel);
            });
        }
        
        return verbs;
    }
    
    startTraining() {
        if (Object.keys(this.verbs).length === 0) {
            alert('Данные не загрузились. Проверьте файл verbs-data.js');
            return;
        }
        
        if (this.selectedTimes.length === 0 || this.selectedPronouns.length === 0) {
            alert('Выберите хотя бы одно время и одно местоимение!');
            return;
        }
        
        const filteredVerbs = this.getFilteredVerbs();
        if (filteredVerbs.length === 0) {
            alert('Нет глаголов по выбранным настройкам!');
            return;
        }
        
        this.isReviewMode = false;
        this.settingsSection.style.display = 'none';
        this.exerciseSection.style.display = 'flex';
        this.nextExercise();
    }
    
    startReview() {
        if (this.wrongAnswers.length === 0) {
            alert('Нет ошибок для повторения!');
            return;
        }
        
        const filteredWrong = this.getFilteredWrongAnswers();
        
        if (filteredWrong.length === 0) {
            alert('Нет ошибок по выбранным настройкам!');
            return;
        }
        
        this.isReviewMode = true;
        this.nextReviewExercise();
    }
    
    getFilteredWrongAnswers() {
        return this.wrongAnswers.filter(wrong => {
            const verb = wrong.verb;
            const verbData = this.verbs[verb];
            const verbGroup = verbData.group;
            const verbLevel = verbData.level.toString();
            
            const timeMatch = this.selectedTimes.includes(wrong.time);
            const pronounMatch = this.selectedPronouns.includes(wrong.pronoun);
            const groupMatch = this.selectedGroups.includes('all') || this.selectedGroups.includes(verbGroup);
            const levelMatch = this.selectedLevels.includes('all') || this.selectedLevels.includes(verbLevel);
            
            return timeMatch && pronounMatch && groupMatch && levelMatch;
        });
    }
    
    generateExercise() {
        const filteredVerbs = this.getFilteredVerbs();
        
        if (filteredVerbs.length === 0) {
            throw new Error('Нет глаголов по выбранным настройкам');
        }
        
        const verb = filteredVerbs[Math.floor(Math.random() * filteredVerbs.length)];
        const time = this.selectedTimes[Math.floor(Math.random() * this.selectedTimes.length)];
        const pronoun = this.selectedPronouns[Math.floor(Math.random() * this.selectedPronouns.length)];
        
        const correctAnswer = this.verbs[verb][time][pronoun];
        
        return {
            verb,
            time,
            pronoun,
            correctAnswer,
            id: `${verb}-${time}-${pronoun}`
        };
    }
    
    getExerciseFromWrong(wrongAnswer) {
        const { verb, time, pronoun } = wrongAnswer;
        const correctAnswer = this.verbs[verb][time][pronoun];
        
        return {
            verb,
            time,
            pronoun,
            correctAnswer,
            id: `${verb}-${time}-${pronoun}`
        };
    }
    
    nextExercise() {
        if (this.isReviewMode) {
            this.nextReviewExercise();
        } else {
            this.currentExercise = this.generateExercise();
            this.displayExercise();
        }
    }
    
    nextReviewExercise() {
        const filteredWrong = this.getFilteredWrongAnswers();
        
        if (filteredWrong.length === 0) {
            this.endReview();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredWrong.length);
        const wrongAnswer = filteredWrong[randomIndex];
        this.currentExercise = this.getExerciseFromWrong(wrongAnswer);
        
        this.displayExercise();
    }
    
    displayExercise() {
        const verb = this.currentExercise.verb;
        const translation = this.verbs[verb].translation;
        
        this.currentVerbElem.textContent = `${verb} (${translation})`;
        this.currentTimeElem.textContent = this.currentExercise.time;
        this.currentPronounElem.textContent = this.currentExercise.pronoun;
        this.answerInput.value = '';
        this.feedbackElem.className = 'feedback';
        this.feedbackElem.innerHTML = '';
        this.answerInput.focus();
        this.waitingForNext = false;
        
        document.getElementById('checkBtn').textContent = 'Проверить';
    }
    
    endReview() {
        this.isReviewMode = false;
        alert('Повторение ошибок завершено!');
        this.returnToSettings();
    }
    
    checkAnswer() {
        if (this.waitingForNext) {
            this.nextExercise();
            return;
        }
        
        const userAnswer = this.answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentExercise.correctAnswer.toLowerCase();
        
        if (!userAnswer) {
            return;
        }
        
        this.stats.total++;
        
        // Обработка альтернативных ответов, разделенных /
        const correctAnswers = correctAnswer.split('/').map(a => a.trim().toLowerCase());
        
        if (correctAnswers.some(answer => userAnswer === answer)) {
            this.feedbackElem.innerHTML = '';
            this.feedbackElem.className = 'feedback correct';
            this.stats.correct++;
            
            if (this.isReviewMode) {
                this.removeFromWrongAnswers(this.currentExercise);
            }
        } else {
            this.feedbackElem.innerHTML = `<strong>Правильно:</strong> ${this.currentExercise.correctAnswer}`;
            this.feedbackElem.className = 'feedback incorrect';
            this.stats.wrong++;
            
            this.addToWrongAnswers(this.currentExercise);
        }
        
        this.updateStats();
        this.saveStats();
        
        this.waitingForNext = true;
        document.getElementById('checkBtn').textContent = 'Далее';
        document.getElementById('checkBtn').focus();
    }
    
    addToWrongAnswers(exercise) {
        const wrongId = exercise.id;
        const exists = this.wrongAnswers.some(w => w.id === wrongId);
        
        if (!exists) {
            this.wrongAnswers.push({
                id: wrongId,
                verb: exercise.verb,
                time: exercise.time,
                pronoun: exercise.pronoun
            });
            
            this.updateReviewButton();
            this.saveWrongAnswers();
        }
    }
    
    removeFromWrongAnswers(exercise) {
        const wrongId = exercise.id;
        const index = this.wrongAnswers.findIndex(w => w.id === wrongId);
        
        if (index !== -1) {
            this.wrongAnswers.splice(index, 1);
            this.updateReviewButton();
            this.saveWrongAnswers();
        }
    }
    
    showAnswer() {
        this.feedbackElem.innerHTML = `<strong>Правильно:</strong> ${this.currentExercise.correctAnswer}`;
        this.feedbackElem.className = 'feedback incorrect';
        this.waitingForNext = true;
        document.getElementById('checkBtn').textContent = 'Далее';
        
        this.addToWrongAnswers(this.currentExercise);
    }
    
    updateStats() {
        this.correctCountElem.textContent = this.stats.correct;
        this.totalCountElem.textContent = this.stats.total;
        this.wrongCountElem.textContent = this.stats.wrong;
    }
    
    updateReviewButton() {
        const filteredWrong = this.getFilteredWrongAnswers();
        this.reviewCountElem.textContent = filteredWrong.length;
        
        if (filteredWrong.length > 0) {
            this.reviewBtn.style.display = 'flex';
        } else {
            this.reviewBtn.style.display = 'none';
        }
    }
    
    returnToSettings() {
        this.stats = { 
            correct: 0, 
            total: 0, 
            wrong: 0
        };
        this.updateStats();
        
        this.wrongAnswers = [];
        this.isReviewMode = false;
        
        this.settingsSection.style.display = 'block';
        this.exerciseSection.style.display = 'none';
        
        this.reviewBtn.style.display = 'none';
        this.reviewCountElem.textContent = '0';
        
        this.saveStats();
    }
    
    saveStats() {
        const data = {
            stats: this.stats,
            wrongAnswers: this.wrongAnswers,
            selectedTimes: this.selectedTimes,
            selectedPronouns: this.selectedPronouns,
            selectedGroups: this.selectedGroups,
            selectedLevels: this.selectedLevels
        };
        localStorage.setItem('verbTrainerData', JSON.stringify(data));
    }
    
    saveWrongAnswers() {
        localStorage.setItem('verbTrainerWrongAnswers', JSON.stringify(this.wrongAnswers));
    }
    
    loadStats() {
        const saved = localStorage.getItem('verbTrainerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Загрузка настроек
                this.selectedTimes = data.selectedTimes || this.selectedTimes;
                this.selectedPronouns = data.selectedPronouns || this.selectedPronouns;
                this.selectedGroups = data.selectedGroups || this.selectedGroups;
                this.selectedLevels = data.selectedLevels || this.selectedLevels;
                
                // Загрузка статистики
                this.stats = data.stats || this.stats;
                this.wrongAnswers = data.wrongAnswers || this.wrongAnswers;
                
                // Восстановление чекбоксов времён
                document.querySelectorAll('input[name="time"]').forEach(checkbox => {
                    checkbox.checked = this.selectedTimes.includes(checkbox.value);
                });
                
                // Восстановление чекбоксов местоимений
                document.querySelectorAll('input[name="pronoun"]').forEach(checkbox => {
                    checkbox.checked = this.selectedPronouns.includes(checkbox.value);
                });
                
                // Восстановление чекбоксов групп
                document.querySelectorAll('input[name="group"]').forEach(checkbox => {
                    if (checkbox.value === 'all') {
                        checkbox.checked = this.selectedGroups.includes('all');
                    } else {
                        checkbox.checked = this.selectedGroups.includes(checkbox.value);
                    }
                });
                
                // Восстановление чекбоксов уровней
                document.querySelectorAll('input[name="level"]').forEach(checkbox => {
                    if (checkbox.value === 'all') {
                        checkbox.checked = this.selectedLevels.includes('all');
                    } else {
                        checkbox.checked = this.selectedLevels.includes(checkbox.value);
                    }
                });
                
                // Обновление интерфейса
                this.updateStats();
                this.updateReviewButton();
                
            } catch (e) {
                console.error('Ошибка загрузки сохраненных данных:', e);
            }
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const trainer = new VerbTrainer();
});
