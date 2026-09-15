# Pulse AI

Pulse AI is an intelligent conversational AI assistant, code workspace, and multimodal collaboration platform powered by Google Gemini.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Required for Gemini AI Responses
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: For frontend client fallback
VITE_GEMINI_API_KEY="your_gemini_api_key_here"

# Optional Providers
GROQ_API_KEY=""
OPENROUTER_API_KEY=""
OPENAI_API_KEY=""
```

> **Where do I get an API Key?**
> Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Production Build & Deployment

### Build the Application
```bash
npm run build
```

### Start the Production Server
```bash
npm start
```

### Deploying to Cloud Providers (Render, Railway, Heroku, Docker)
- **Node Version**: Node.js 18+ or 20+
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: Add `GEMINI_API_KEY` in your platform's dashboard.

---

## 📱 Progressive Web App (PWA)
Pulse AI can be installed as a standalone application on mobile and desktop devices.
- Open the application in your browser and click **"Add to Home Screen"** or **"Install App"** in the top navigation bar or settings.
