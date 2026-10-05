# ⚡ 9Router AI Studio (React + Tailwind CSS)

A minimalist, high-performance web interface designed to manage multiple 9Router API keys and virtual combos, providing uninterrupted access to dozens of AI models (Gemini, Ollama, OpenRouter, DeepSeek, Claude, GPT, etc.) through a single client.

---

## 🌟 Key Features

1. **Multi-Key & Combo Management:**
   - Add, label, and test unlimited 9Router API keys.
   - **Bulk Import:** Paste multiple keys at once to import in seconds.
   - **Live Model Discovery (Sync Models):** Automatically queries your 9Router gateway (`/v1/models`) to discover and sync all active models and virtual combos.

2. **Uninterrupted Chat & Smart Failover:**
   - **Auto-Failover (Recommended):** If a primary key hits a rate limit (HTTP 429) or runs out of quota, the client automatically and seamlessly falls back to the next available key in the background without interrupting your generation.
   - **Auto-Recovery on Unsupported Sub-Models:** If a combo model contains an unsupported sub-model (HTTP 400), the client automatically recovers by falling back to the most stable active model (e.g., `gemini/gemini-3.8-flash`).
   - **Round-Robin:** Evenly distributes prompts across all active keys to maximize throughput.
   - **Manual Mode:** Lock generation to a specific key of your choice.

3. **Real-Time Streaming (SSE) & Reasoning:**
   - Word-by-word real-time Server-Sent Events (SSE) streaming.
   - Expandable and clean **Reasoning Process** foldout for chain-of-thought models (e.g. DeepSeek-R1, OpenAI o-series).

4. **Noble & Minimalist Dark Interface:**
   - Obsidian zinc theme inspired by Linear and Claude.ai.
   - Code blocks with automatic language detection and a one-click **Copy** button.
   - Markdown rendering with clean table, quote, and list formatting.

5. **Local Chat & Session Storage:**
   - All conversation history and API keys stay 100% private in your browser's `localStorage`—no third-party data tracking.
   - Search, rename, and delete conversation threads.
   - **Export as Markdown (`.md`):** Save conversations as formatted markdown files.
   - Full JSON backup export and import.

6. **Inference Parameters & System Prompts:**
   - Sliders for Temperature, Max Tokens, and Streaming toggle.
   - Custom System Prompt configuration to control AI assistant behavior.

---

## 🚀 Quick Start

### 1. Launch the Application
Double-click `start.bat` in the project root or run:

```bash
npm run dev
```

Then open **`http://localhost:5173`** in your browser.

### 2. Connect to 9Router
- By default, 9Router runs locally on `http://localhost:20128/v1`.
- Click on the key indicator in the bottom sidebar or inside the chat input bar.
- If your 9Router instance is running on a different port or remote host, adjust the **9Router Base URL**.
- Add your API keys and click **"Sync Models"** to discover all available models.

---

## 🛠️ Directory Structure

```
Free-models/
├── src/
│   ├── components/
│   │   ├── ChatInput.jsx          # Input capsule, model dropdown trigger, send action
│   │   ├── ChatMessage.jsx        # Markdown rendering, code copy, reasoning foldout
│   │   ├── KeyManagerModal.jsx    # 9Router multi-key management and routing policies
│   │   ├── ModelSelectorModal.jsx # Model search, provider filtering, and combo selection
│   │   ├── SettingsModal.jsx      # Temperature, Max Tokens, and JSON backup controls
│   │   └── Sidebar.jsx            # Conversation history list and search
│   ├── services/
│   │   └── api.js                 # 9Router client, SSE reader, failover & recovery engine
│   ├── utils/
│   │   └── storage.js             # LocalStorage persistence and default parameters
│   ├── App.jsx                    # Root application state & chat orchestration
│   ├── index.css                  # Minimalist styles and markdown typography
│   └── main.jsx                   # React entry point
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── start.bat
```
