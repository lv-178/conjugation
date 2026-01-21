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
        this.wrongAnswers = [];
        this.isReviewMode = false;
	this.selectedGroups = ['all'];
        this.availableGroups = ['irregular', 'ar', 'er', 'ir'];
        
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

	document.querySelectorAll('input[name="group"]').forEach(checkbox => {
            if (checkbox.checked && checkbox.value !== 'all') {
                this.selectedGroups.push(checkbox.value);
            }
        });
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
        
        document.querySelectorAll('input[name="time"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedTimes());
            if (checkbox.checked) {
                this.selectedTimes.push(checkbox.value);
            }
        });
        
        document.querySelectorAll('input[name="pronoun"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedPronouns());
            if (checkbox.checked) {
                this.selectedPronouns.push(checkbox.value);
            }
        });
        
        document.querySelectorAll('input[name="time"], input[name="pronoun"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateReviewButton());
        });

	document.querySelectorAll('input[name="group"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleGroupChange(e));
        });
    }
    
     handleGroupChange(event) {
        const checkbox = event.target;
        const value = checkbox.value;
        
        if (value === 'all') {
            if (checkbox.checked) {
                // Выбрать "Все" - снять все остальные
                document.querySelectorAll('input[name="group"]').forEach(cb => {
                    if (cb.value !== 'all') {
                        cb.checked = false;
                    }
                });
                this.selectedGroups = ['all'];
            }
        } else {
            // Снять "Все" если выбран конкретный глагол
            const allCheckbox = document.querySelector('input[name="group"][value="all"]');
            allCheckbox.checked = false;
            
            if (checkbox.checked) {
                this.selectedGroups.push(value);
                // Удалить 'all' из выбранных
                const index = this.selectedGroups.indexOf('all');
                if (index !== -1) {
                    this.selectedGroups.splice(index, 1);
                }
            } else {
                const index = this.selectedGroups.indexOf(value);
                if (index !== -1) {
                    this.selectedGroups.splice(index, 1);
                }
                
                // Если ничего не выбрано, выбрать "Все"
                if (this.selectedGroups.length === 0) {
                    allCheckbox.checked = true;
                    this.selectedGroups = ['all'];
                }
            }
        }
        
        this.updateReviewButton();
    }
    
    updateSelectedGroups() {
        this.selectedGroups = [];
        const allCheckbox = document.querySelector('input[name="group"][value="all"]');
        
        if (allCheckbox.checked) {
            this.selectedGroups = ['all'];
        } else {
            this.selectedGroups = Array.from(document.querySelectorAll('input[name="group"]:checked'))
                .map(cb => cb.value)
                .filter(value => value !== 'all');
        }
        
        this.updateReviewButton();
    }
    
    getFilteredVerbs() {
        if (this.selectedGroups.includes('all')) {
            return Object.keys(this.verbs);
        }
        
        return Object.keys(this.verbs).filter(verb => {
            const verbGroup = this.verbs[verb].group;
            return this.selectedGroups.includes(verbGroup);
        });
    }
    
    generateExercise() {
        const filteredVerbs = this.getFilteredVerbs();
        
        if (filteredVerbs.length === 0) {
            throw new Error('Нет глаголов по выбранным настройкам групп');
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
            alert('Выберите хотя бы одну группу глаголов!');
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
        
        const filteredWrong = this.wrongAnswers.filter(wrong => 
            this.selectedTimes.includes(wrong.time) && 
            this.selectedPronouns.includes(wrong.pronoun)
        );
        
        if (filteredWrong.length === 0) {
            alert('Нет ошибок по выбранным настройкам!');
            return;
        }
        
        this.isReviewMode = true;
        this.nextReviewExercise();
    }
    
    generateExercise() {
        const verbs = Object.keys(this.verbs);
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
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
        const filteredWrong = this.wrongAnswers.filter(wrong => 
            this.selectedTimes.includes(wrong.time) && 
            this.selectedPronouns.includes(wrong.pronoun)
        );
        
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
        this.currentVerbElem.textContent = this.currentExercise.verb;
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
            this.feedbackElem.innerHTML = correctAnswer;
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
        this.feedbackElem.innerHTML = this.currentExercise.correctAnswer;
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
            selectedGroups: this.selectedGroups
        };
        localStorage.setItem('verbTrainerData', JSON.stringify(data));
    }
    
    loadStats() {
        const saved = localStorage.getItem('verbTrainerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.selectedTimes = data.selectedTimes || this.selectedTimes;
                this.selectedPronouns = data.selectedPronouns || this.selectedPronouns;
		this.selectedGroups = data.selectedGroups || this.selectedGroups;
                
                document.querySelectorAll('input[name="time"]').forEach(checkbox => {
                    checkbox.checked = this.selectedTimes.includes(checkbox.value);
                });
                
                document.querySelectorAll('input[name="pronoun"]').forEach(checkbox => {
                    checkbox.checked = this.selectedPronouns.includes(checkbox.value);
                });

		document.querySelectorAll('input[name="group"]').forEach(checkbox => {
                    if (checkbox.value === 'all') {
                        checkbox.checked = this.selectedGroups.includes('all');
                    } else {
                        checkbox.checked = this.selectedGroups.includes(checkbox.value);
                    }
                });
                
                this.updateStats();
                this.updateReviewButton();
            } catch (e) {
                console.error('Ошибка загрузки сохраненных данных:', e);
            }
        }
    }
    
    saveWrongAnswers() {
        localStorage.setItem('verbTrainerWrongAnswers', JSON.stringify(this.wrongAnswers));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const trainer = new VerbTrainer();
});
