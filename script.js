// script.js - Основная логика приложения
class VerbTrainer {
    constructor() {
        // Берем глаголы из глобальной переменной, созданной в verbs-data.js
        this.verbs = window.verbsData || {};
        
        // Проверяем, что глаголы загрузились
        if (Object.keys(this.verbs).length === 0) {
            console.error('Глаголы не загружены! Проверьте файл verbs-data.js');
            alert('Ошибка: глаголы не загружены. Проверьте консоль браузера (F12).');
        } else {
            console.log(`Загружено ${Object.keys(this.verbs).length} глаголов`);
        }
        
        this.currentExercise = null;
        this.stats = { 
            correct: 0, 
            total: 0, 
            wrong: 0
        };
        this.selectedTimes = ['present'];
        this.selectedPronouns = ['я'];
        this.wrongAnswers = [];
        this.isReviewMode = false;
        this.reviewExercises = [];
        
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
    }
    
    updateSelectedTimes() {
        this.selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked'))
            .map(cb => cb.value);
        this.updateReviewButton();
    }
    
    updateSelectedPronouns() {
        this.selectedPronouns = Array.from(document.querySelectorAll('input[name="pronoun"]:checked'))
            .map(cb => cb.value);
        this.updateReviewButton();
    }
    
    updateReviewButton() {
        if (this.wrongAnswers.length > 0) {
            const filteredWrong = this.wrongAnswers.filter(wrong => 
                this.selectedTimes.includes(wrong.time) && 
                this.selectedPronouns.includes(wrong.pronoun)
            );
            this.reviewCountElem.textContent = filteredWrong.length;
            
            if (filteredWrong.length > 0) {
                this.reviewBtn.style.display = 'flex';
            } else {
                this.reviewBtn.style.display = 'none';
            }
        } else {
            this.reviewBtn.style.display = 'none';
        }
    }
    
    startTraining() {
        // Проверяем, что глаголы загружены
        if (Object.keys(this.verbs).length === 0) {
            alert('Глаголы не загружены. Проверьте файл verbs-data.js');
            return;
        }
        
        if (this.selectedTimes.length === 0 || this.selectedPronouns.length === 0) {
            alert('Выберите хотя бы одно время и одно лицо!');
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
        this.reviewExercises = [...filteredWrong];
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
        if (this.reviewExercises.length === 0) {
            this.endReview();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.reviewExercises.length);
        const wrongAnswer = this.reviewExercises[randomIndex];
        this.currentExercise = this.getExerciseFromWrong(wrongAnswer);
        
        this.reviewExercises.splice(randomIndex, 1);
        this.updateReviewButton();
        
        this.displayExercise();
    }
    
    displayExercise() {
        this.currentVerbElem.textContent = this.currentExercise.verb;
        this.currentTimeElem.textContent = this.getTimeName(this.currentExercise.time);
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
    
    getTimeName(timeKey) {
        const names = {
            'present': 'настоящее',
            'past': 'прошедшее',
            'future': 'будущее'
        };
        return names[timeKey];
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
        
        const correctAnswers = correctAnswer.split('/').map(a => a.trim());
        
        if (correctAnswers.some(answer => userAnswer === answer.toLowerCase())) {
            this.feedbackElem.innerHTML = '';
            this.feedbackElem.className = 'feedback correct';
            this.stats.correct++;
            
            // Удаляем из wrongAnswers только в режиме повторения
            if (this.isReviewMode) {
                this.removeFromWrongAnswers(this.currentExercise);
            }
            // В обычном режиме НЕ удаляем даже при правильном ответе
        } else {
            this.feedbackElem.innerHTML = correctAnswer;
            this.feedbackElem.className = 'feedback incorrect';
            this.stats.wrong++;
            
            // Добавляем в wrongAnswers при ошибке (в обоих режимах)
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
        
        // При показе ответа всегда добавляем в wrongAnswers
        this.addToWrongAnswers(this.currentExercise);
    }
    
    updateStats() {
        this.correctCountElem.textContent = this.stats.correct;
        this.totalCountElem.textContent = this.stats.total;
        this.wrongCountElem.textContent = this.stats.wrong;
    }
    
    returnToSettings() {
        // ОЧИСТКА wrongAnswers при возврате в настройки
        this.wrongAnswers = [];
        this.reviewExercises = [];
        this.isReviewMode = false;
        
        this.settingsSection.style.display = 'block';
        this.exerciseSection.style.display = 'none';
        
        this.reviewBtn.style.display = 'none';
        this.reviewCountElem.textContent = '0';
        
        this.saveWrongAnswers();
    }
    
    saveStats() {
        const data = {
            stats: this.stats,
            wrongAnswers: this.wrongAnswers,
            selectedTimes: this.selectedTimes,
            selectedPronouns: this.selectedPronouns
        };
        localStorage.setItem('verbTrainerData', JSON.stringify(data));
    }
    
    loadStats() {
        const saved = localStorage.getItem('verbTrainerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stats = data.stats || this.stats;
                this.wrongAnswers = data.wrongAnswers || [];
                this.selectedTimes = data.selectedTimes || this.selectedTimes;
                this.selectedPronouns = data.selectedPronouns || this.selectedPronouns;
                
                document.querySelectorAll('input[name="time"]').forEach(checkbox => {
                    checkbox.checked = this.selectedTimes.includes(checkbox.value);
                });
                
                document.querySelectorAll('input[name="pronoun"]').forEach(checkbox => {
                    checkbox.checked = this.selectedPronouns.includes(checkbox.value);
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const trainer = new VerbTrainer();
});
