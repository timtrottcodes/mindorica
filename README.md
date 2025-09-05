# Mindorica - Your Mind, Mastered.

Mindorica is a personal learning companion designed to help you capture, organize, and master what matters most.

With a powerful topic-based system, intuitive flashcards, and a beautifully clean interface, Mindorica gives you the tools to build long-term memory, track your learning journey, and take back control of your knowledge — one idea at a time.

Welcome to Mindorica, a space where your thoughts take shape and your knowledge grows roots.

We believe that learning is more than just memorizing facts — it’s about curiosity, clarity, and building your own mental landscape. Whether you're learning a new language, diving into a personal project, or just trying to retain what you read, Mindorica helps you:

* Create and organize flashcards by topic, with support for text, images, and more.
* Structure your learning the way your mind works — naturally, hierarchically, and fluidly.
* Track your progress with star ratings for each topic, daily streaks, and weekly streaks.
* Stay focused with a clear, distraction-free interface and powerful tools to help you review at your pace.

Mindorica isn’t just a flashcard tool. It’s a mental habitat — a place to reflect, retain, and revisit what matters.

Join us as we shape the future of personal learning — thoughtfully, intentionally, and beautifully.

👉 [Try the Online Demo here](https://timtrottcodes.github.io/mindorica/) and start exploring now!

---

## ✨ Why Mindorica?

This project was born out of a personal need: I wanted to **learn Angular** and build something useful — a flashcard trainer to **help me learn Bulgarian**. Since I couldn’t find an app that did exactly what I needed, I decided to build one.

Mindorica now supports:

* Topic-based flashcards with optional images, audio, and notes
* Nested topics displayed in study mode
* Star ratings per topic to track progress
* Daily and weekly streak tracking
* Multiple-choice mode with smart distractors
* Import/export functionality for sharing or backing up your decks
* Demo data to get started quickly with **German vocabulary** and **General Knowledge quiz cards**

---

## 🧠 Features

* ✅ Create flashcards with **front**, **back**, **notes**, **images**, and **audio**
* ✅ Organize cards by **nested topics**
* ✅ Review cards using:

  * Spaced repetition
  * Flip-and-rate mode (good/okay/bad)
  * **Multiple-choice quiz mode**
* ✅ Track progress with **star ratings** for each topic
* ✅ Monitor your **daily streaks** and **weekly streaks** visually
* ✅ **Drag-and-drop interface** for adding wrong answer options
* ✅ Shuffle options only once per card to avoid confusion
* ✅ Visual feedback for correct/incorrect choices
* ✅ Keyboard shortcuts (flip, rate)
* ✅ Demo data loader (German basics + general knowledge)
* ✅ Import/export cards as JSON or ZIP (with embedded media)
* ✅ Works offline using **IndexedDB** for persistent storage
* ✅ Minimal, focused UI with dark mode

---

## 🛠️ Tech Stack

* **Angular 20** with Standalone Components
* **TypeScript**
* **Bootstrap 5** for styling
* **IndexedDB** for persistence instead of localStorage
* Optional image/audio support via base64 or file import

---

## 📦 Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/timtrottcodes/mindorica.git
cd mindorica

# 2. Install dependencies
npm install

# 3. Run the app locally
ng serve

# 4. Visit in your browser
http://localhost:4200
```

---

## 📋 How to Use

### 🧾 Creating Flashcards

1. Navigate to the **Manage Cards** or **Topics** section.
2. Click **New Card**.
3. Fill in:

   * Front (prompt)
   * Back (answer)
   * Optionally add **notes**, **image**, or **audio**.
4. Save to topic.

### ➕ Adding Multiple Choice Options

You can add incorrect options (distractors) by dragging cards from the list into the **Options** section of the current flashcard.

* The quiz engine will randomly select distractors when quizzing.
* Distractors are only shuffled once per question for consistency.

### 🔄 Import & Export

* Export your current flashcards (with media) to a **.json** or **.zip** file.
* Import supports:

  * JSON structure: cards + topics
  * ZIP with embedded images/audio

### 🧪 Demo Data

To explore the app, use the **Load Demo Data** button. This will import:

* 📘 Basic German Vocabulary (Greetings, Numbers, Days)
* ❓ General Knowledge Quiz (Capital cities, trivia)
* 🚀 Star Trek Quiz
* 🇧🇬 Sample Bulgarian flashcards from Alphabet, Numbers and Introductions
* Includes image and audio samples

---

## 🧑‍💻 Developer Notes

* Angular 20 using **Standalone Components** architecture
* All state handled in-memory or via **IndexedDB**
* Cards use the `FlashcardModel` interface with optional nested distractors
* Spaced repetition algorithm is a simple 1–3–5 step model (can be customized)
* Assets (images/audio) are stored as **base64** strings and included in export files
* Study page now shows **nested topics** with **star ratings** and **streak tracking**

---

## 🙌 Acknowledgments

Thanks to the OpenAI tools for helping brainstorm and co-develop this project. And to the language learning community for inspiring this tool!

---

## 📘 License

MIT License
