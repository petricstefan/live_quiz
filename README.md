# 🎯 Live Quiz - Kahoot-Style Interactive Quiz

A real-time multiplayer quiz game that works like Kahoot! Host a quiz for up to 200+ participants with a live leaderboard.

## 🚀 Quick Start

### 1. Set up Firebase (Free - takes 2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** → give it any name → disable Google Analytics (optional) → Create
3. In the project dashboard, click the **Web icon** (`</>`) to add a web app
4. Give it a nickname (e.g., "quiz") → Register app
5. Copy the `firebaseConfig` object shown
6. Open `firebase-config.js` in this repo and replace the placeholder values with your config
7. In Firebase Console, go to **Firestore Database** → **Create database** → Choose **Start in test mode** → Select any region → Enable

### 2. Deploy to GitHub Pages

The quiz is already set up for GitHub Pages! Just:

1. Push this repo to GitHub (if not already done)
2. Go to your repo **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch, `/ (root)` folder → Save
5. Your quiz will be live at: `https://YOUR_USERNAME.github.io/kahoot-live-quiz/`

### 3. Host a Quiz

1. Open the quiz URL on your computer (the one you'll share on screen)
2. Click **"🎮 Host Quiz"**
3. Enter a room code (e.g., `QUIZ2026`)
4. Share the URL + room code with participants
5. Wait for everyone to join, then click **"🚀 Start Quiz!"**

### 4. Players Join

1. Open the quiz URL on their phone/laptop
2. Click **"📱 Join as Player"**
3. Enter the room code + their name
4. Answer questions as fast as possible for bonus points!

## 📝 Customize Questions

Edit **`questions.js`** to add your own questions:

```javascript
const QUIZ_CONFIG = {
  title: "My Custom Quiz! 🎉",
  questions: [
    {
      question: "Your question here?",
      answers: ["Answer A", "Answer B", "Answer C", "Answer D"],
      correct: 0,  // 0=A, 1=B, 2=C, 3=D
      time: 20     // seconds to answer
    },
    // Add more questions...
  ]
};
```

## 🎮 How Scoring Works

- **Correct answer**: 100 - 1000 points (faster = more points!)
- **Wrong answer**: 0 points
- **No answer (time runs out)**: 0 points

## 📱 Features

- ✅ Real-time multiplayer (200+ players)
- ✅ Live leaderboard
- ✅ Mobile-friendly responsive design
- ✅ Timed questions with visual countdown
- ✅ Instant feedback for players
- ✅ Points based on speed
- ✅ Podium reveal at the end
- ✅ Easy question customization
- ✅ No sign-up required for players

## 🔒 Security Note

The Firebase config in `firebase-config.js` is client-side (this is normal for Firebase web apps). The Firestore security rules in test mode allow open access. For production use, add proper [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started).

## 📄 License

MIT - Free to use and modify!
