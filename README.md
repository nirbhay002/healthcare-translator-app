# 🏥 AI Healthcare Translator

A web application that provides real-time, multilingual translation to bridge communication gaps between patients and healthcare providers. This tool uses the browser's Web Speech API for transcription and Google's Gemini API for high-quality, contextual translation.

![App Screenshot](placeholder.png)
*Replace `placeholder.png` with a screenshot of your app.*

---

## ✨ Features

- **Real-time Transcription**: Captures spoken words from the microphone and converts them to text.
- **AI-Powered Translation**: Uses the Google Gemini API for accurate, context-aware translations.
- **Multilingual Support**: Easily select patient and provider languages from a dropdown.
- **Audio Playback**: Listen to the translated text in a clear voice.
- **Conversation Log**: Keeps a running history of the translated conversation.
- **Mobile-Friendly**: The responsive design works seamlessly on both desktop and mobile devices.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **APIs**:
  - Web Speech API (for Speech-to-Text)
  - Google Gemini API (for Text-to-Text Translation)
- **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd your-repo-name
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your Gemini API key:
    ```
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.