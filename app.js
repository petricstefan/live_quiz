// ===== GLOBAL STATE =====
let isHost = false;
let roomCode = '';
let playerName = '';
let currentQuestion = 0;
let timerInterval = null;
let timeLeft = 0;
let playerScore = 0;
let unsubscribers = [];

// ===== SCREEN NAVIGATION =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showLanding() { showScreen('landing'); }
function showHostSetup() { showScreen('host-setup'); }
function showPlayerJoin() { showScreen('player-join'); }

// ===== FIREBASE CHECK =====
function checkFirebase() {
    if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
        document.getElementById('firebase-modal').classList.add('active');
        return false;
    }
    return true;
}

function closeModal() {
    document.getElementById('firebase-modal').classList.remove('active');
    location.reload();
}

// ===== HOST FUNCTIONS =====
async function createRoom() {
    if (!checkFirebase()) return;
    
    roomCode = document.getElementById('host-room-code').value.trim().toUpperCase();
    if (!roomCode) {
        alert('Please enter a room code!');
        return;
    }
    
    isHost = true;
    
    // Create room in Firestore
    await db.collection('rooms').doc(roomCode).set({
        status: 'waiting',
        currentQuestion: -1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        questionCount: QUIZ_CONFIG.questions.length
    });
    
    document.getElementById('display-room-code').textContent = roomCode;
    showScreen('host-lobby');
    
    // Listen for players joining
    const unsub = db.collection('rooms').doc(roomCode).collection('players')
        .onSnapshot(snapshot => {
            const players = [];
            snapshot.forEach(doc => players.push(doc.data()));
            document.getElementById('player-count').textContent = players.length;
            document.getElementById('player-list').innerHTML = players
                .map(p => `<span class="player-chip">👤 ${p.name}</span>`)
                .join('');
        });
    unsubscribers.push(unsub);
}

async function startQuiz() {
    currentQuestion = 0;
    await db.collection('rooms').doc(roomCode).update({
        status: 'playing',
        currentQuestion: 0
    });
    showHostQuestion();
}

function showHostQuestion() {
    const q = QUIZ_CONFIG.questions[currentQuestion];
    document.getElementById('host-q-number').textContent = `Q${currentQuestion + 1}/${QUIZ_CONFIG.questions.length}`;
    document.getElementById('host-question-text').textContent = q.question;
    
    const answersDiv = document.getElementById('host-answers');
    answersDiv.innerHTML = q.answers.map((a, i) => 
        `<div class="answer-display">${['▲', '◆', '●', '■'][i]} ${a}</div>`
    ).join('');
    
    document.getElementById('host-answer-stats').style.display = 'none';
    showScreen('host-question');
    
    // Push question to Firestore
    db.collection('rooms').doc(roomCode).update({
        currentQuestion: currentQuestion,
        questionStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'question'
    });
    
    // Clear previous answers
    db.collection('rooms').doc(roomCode).collection('answers')
        .where('question', '==', currentQuestion)
        .get().then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete());
        });
    
    // Start timer
    startHostTimer(q.time);
}

function startHostTimer(seconds) {
    timeLeft = seconds;
    document.getElementById('host-timer').textContent = timeLeft;
    document.getElementById('host-timer-bar').style.width = '100%';
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('host-timer').textContent = timeLeft;
        const pct = (timeLeft / seconds) * 100;
        document.getElementById('host-timer-bar').style.width = pct + '%';
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showHostResults();
        }
    }, 1000);
}

async function showHostResults() {
    clearInterval(timerInterval);
    const q = QUIZ_CONFIG.questions[currentQuestion];
    
    // Update status
    await db.collection('rooms').doc(roomCode).update({ status: 'results' });
    
    // Get answers
    const answersSnap = await db.collection('rooms').doc(roomCode)
        .collection('answers')
        .where('question', '==', currentQuestion)
        .get();
    
    let correct = 0, wrong = 0;
    answersSnap.forEach(doc => {
        if (doc.data().answer === q.correct) correct++;
        else wrong++;
    });
    
    document.getElementById('correct-answer-reveal').innerHTML = 
        `✅ Correct Answer: <strong>${q.answers[q.correct]}</strong>`;
    
    document.getElementById('stats-row').innerHTML = `
        <div class="stat-box stat-correct">
            <span class="stat-num">${correct}</span>
            <span class="stat-label">Correct</span>
        </div>
        <div class="stat-box stat-wrong">
            <span class="stat-num">${wrong}</span>
            <span class="stat-label">Wrong</span>
        </div>
    `;
    
    // Update button text
    const isLast = currentQuestion >= QUIZ_CONFIG.questions.length - 1;
    const nextBtn = document.querySelector('#host-results .btn-next');
    nextBtn.textContent = isLast ? '🏆 Show Final Results' : 'Next Question →';
    
    showScreen('host-results');
}

async function nextQuestion() {
    currentQuestion++;
    if (currentQuestion >= QUIZ_CONFIG.questions.length) {
        await showFinalLeaderboard();
    } else {
        showHostQuestion();
    }
}

async function showFinalLeaderboard() {
    await db.collection('rooms').doc(roomCode).update({ status: 'finished' });
    
    // Get all players and their scores
    const playersSnap = await db.collection('rooms').doc(roomCode)
        .collection('players').orderBy('score', 'desc').get();
    
    let html = '';
    let rank = 1;
    playersSnap.forEach(doc => {
        const p = doc.data();
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank-1] : rank;
        html += `
            <div class="leaderboard-item">
                <span class="lb-rank">${medal}</span>
                <span class="lb-name">${p.name}</span>
                <span class="lb-score">${p.score || 0} pts</span>
            </div>
        `;
        rank++;
    });
    
    document.getElementById('final-leaderboard').innerHTML = html;
    showScreen('host-final');
}

function resetGame() {
    currentQuestion = 0;
    showScreen('host-lobby');
}

// ===== PLAYER FUNCTIONS =====
async function joinRoom() {
    if (!checkFirebase()) return;
    
    roomCode = document.getElementById('player-room-code').value.trim().toUpperCase();
    playerName = document.getElementById('player-name').value.trim();
    
    if (!roomCode || !playerName) {
        alert('Please enter both room code and your name!');
        return;
    }
    
    // Check if room exists
    const roomDoc = await db.collection('rooms').doc(roomCode).get();
    if (!roomDoc.exists) {
        alert('Room not found! Check the code.');
        return;
    }
    
    // Join room
    await db.collection('rooms').doc(roomCode).collection('players').doc(playerName).set({
        name: playerName,
        score: 0,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    document.getElementById('player-name-display').textContent = `Welcome, ${playerName}! 🎉`;
    showScreen('player-waiting');
    
    // Listen for game state changes
    const unsub = db.collection('rooms').doc(roomCode)
        .onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            
            if (data.status === 'question') {
                showPlayerQuestion(data.currentQuestion);
            } else if (data.status === 'results') {
                showPlayerResult();
            } else if (data.status === 'finished') {
                showPlayerFinal();
            }
        });
    unsubscribers.push(unsub);
}

function showPlayerQuestion(qIndex) {
    currentQuestion = qIndex;
    const q = QUIZ_CONFIG.questions[qIndex];
    
    document.getElementById('player-q-number').textContent = `Q${qIndex + 1}/${QUIZ_CONFIG.questions.length}`;
    document.getElementById('player-question-text').textContent = q.question;
    
    const answersDiv = document.getElementById('player-answers');
    answersDiv.innerHTML = q.answers.map((a, i) => 
        `<button class="answer-btn" onclick="submitAnswer(${i})">${['▲', '◆', '●', '■'][i]} ${a}</button>`
    ).join('');
    
    showScreen('player-answer');
    
    // Start timer
    timeLeft = q.time;
    document.getElementById('player-timer').textContent = timeLeft;
    document.getElementById('player-timer-bar').style.width = '100%';
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('player-timer').textContent = Math.max(0, timeLeft);
        const pct = (timeLeft / q.time) * 100;
        document.getElementById('player-timer-bar').style.width = Math.max(0, pct) + '%';
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Auto-submit no answer
            disableAnswerButtons();
        }
    }, 1000);
}

async function submitAnswer(answerIndex) {
    clearInterval(timerInterval);
    const q = QUIZ_CONFIG.questions[currentQuestion];
    const isCorrect = answerIndex === q.correct;
    
    // Calculate score (faster = more points)
    const maxPoints = 1000;
    const timeBonus = Math.round((timeLeft / q.time) * maxPoints);
    const points = isCorrect ? Math.max(100, timeBonus) : 0;
    
    if (isCorrect) {
        playerScore += points;
    }
    
    // Highlight selected answer
    const buttons = document.querySelectorAll('#player-answers .answer-btn');
    buttons.forEach((btn, i) => {
        if (i === answerIndex) btn.classList.add('selected');
        btn.classList.add('disabled');
    });
    
    // Save answer to Firestore
    await db.collection('rooms').doc(roomCode).collection('answers').add({
        player: playerName,
        question: currentQuestion,
        answer: answerIndex,
        correct: isCorrect,
        points: points,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update player score
    await db.collection('rooms').doc(roomCode).collection('players').doc(playerName).update({
        score: playerScore
    });
    
    // Show waiting state
    document.getElementById('player-waiting-text').textContent = 
        isCorrect ? `✅ Correct! +${points} points` : '❌ Wrong answer!';
    showScreen('player-waiting');
}

function disableAnswerButtons() {
    document.querySelectorAll('#player-answers .answer-btn').forEach(btn => {
        btn.classList.add('disabled');
    });
}

function showPlayerResult() {
    // This is triggered when host reveals results - player already sees feedback
    // Just keep them on waiting screen with their result
}

async function showPlayerFinal() {
    clearInterval(timerInterval);
    
    // Get player's rank
    const playersSnap = await db.collection('rooms').doc(roomCode)
        .collection('players').orderBy('score', 'desc').get();
    
    let rank = 1;
    let total = 0;
    playersSnap.forEach(doc => {
        total++;
        if (doc.id === playerName) {
            document.getElementById('player-final-rank').innerHTML = 
                rank <= 3 ? ['🥇 1st Place!', '🥈 2nd Place!', '🥉 3rd Place!'][rank-1] 
                : `#${rank} out of ${total}`;
        } else {
            rank++;
        }
    });
    
    document.getElementById('player-final-score').textContent = `Final Score: ${playerScore} points`;
    showScreen('player-final');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('quiz-title').textContent = QUIZ_CONFIG.title;
});
