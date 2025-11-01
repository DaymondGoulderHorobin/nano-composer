# Nano Composer 🎯

**AI-powered writing assistant that works directly in any text field**  
Write, rewrite, and refine text instantly—no tab switching, no copy-pasting, 100% private and free.

---

## 🚨 The Problem We're Solving

**Writing online is slow and expensive.**

Every day, millions of users face the same frustrating workflow:
1. Draft text in Gmail, LinkedIn, Twitter, or any website
2. Switch to ChatGPT/Gemini in another tab
3. Copy-paste their text
4. Wait for AI processing
5. Copy the result back
6. Repeat for every edit

This wastes **30+ seconds per edit** and breaks your concentration. Worse, heavy users hit free-tier limits on cloud AI services, forcing them to either pay or stop using AI assistance altogether.

**What if AI could work *where you're already typing*—instantly, privately, and without limits?**

---

## ✨ Our Solution

Nano Composer eliminates the context-switching tax by embedding AI directly into every text field on the web. One click, instant results, zero costs.

### Core Features

#### 🔄 **Instant Text Transformation**
- **Formal Rewrite**: Transform casual text into professional language
- **Casual Rewrite**: Make formal text friendly and conversational  
- **Grammar Fix**: Correct spelling, grammar, and punctuation errors
- **Shorten**: Condense text while preserving key meaning
- **Expand**: Add detail and depth to brief statements

#### 📝 **Smart Composition**
- **Write from Instruction**: Generate complete text from simple prompts (e.g., "polite follow-up email")
- **Proofread**: Deep grammar and clarity improvements beyond basic fixes

#### 💡 **Context-Aware Assistance**
- **Explain**: Get instant explanations of selected text in a dedicated preview panel
- Works in **any text field**: Gmail, LinkedIn, Twitter, support tickets, blog editors—everywhere

#### ⚡ **Speed Philosophy: "Snap, Snap, Snap"**
Instead of the traditional workflow (Draft → Switch Tab → Copy → Paste → Wait → Copy → Paste), Nano Composer delivers:
- **Draft → Click → Done** (under 2 seconds on modern hardware)
- No interruption to your writing flow
- No context switching, no copy-paste friction

---

## 🔧 APIs Used

Nano Composer leverages Chrome's **Built-in AI APIs** to deliver on-device, privacy-first AI:

### Primary APIs
- **Prompt API (LanguageModel)**: Core AI engine for all text generation, rewriting, expansion, and explanation tasks. Provides flexible, context-aware language understanding and generation.
- **Rewriter API**: Specialized tone and style transformations (formal/casual rewrites, shortening). *(Chrome Extension Origin Trial)*
- **Writer API**: Original text composition from user instructions. *(Chrome Extension Origin Trial)*

### Why Built-in AI?
- ✅ **100% Private**: Your text never leaves your device—no cloud uploads, no data collection
- ✅ **Zero Cost**: No API keys, no subscriptions, no free-tier limits
- ✅ **Instant Speed**: Sub-2-second responses with no network latency
- ✅ **Always Available**: Works offline, no internet required after model download

---

## 🎯 Target Users & Use Cases

### Who Benefits Most?
- **Email Power Users**: Draft and refine dozens of emails daily without switching tabs
- **Social Media Managers**: Quickly adjust tone for different platforms (LinkedIn formal → Twitter casual)
- **Customer Support Teams**: Fix grammar and professionalize responses in real-time
- **Non-Native English Speakers**: Instant grammar checking and tone adjustment for confident communication
- **Budget-Conscious Users**: Avoid paid AI subscriptions—Nano runs entirely on your hardware
- **Privacy-Conscious Professionals**: Keep sensitive company/personal communications on-device

### Real-World Scenarios
- Rewrite a rushed email to sound professional before sending
- Make a formal LinkedIn post more approachable for engagement
- Fix grammar in a support ticket without opening another tool
- Compose thank-you notes, follow-ups, or announcements from simple prompts
- Explain confusing text selections without leaving the page

---

## 🏆 Hackathon Category Alignment

**Target Category**: Most Helpful (Chrome Extension)

### Why This Extension is "Most Helpful"
1. **Addresses Significant Need**: Solves the universal pain point of slow, fragmented writing workflows
2. **Daily Utility**: Every user who writes online (emails, social media, forums) benefits repeatedly
3. **Practical Impact**: Saves 30+ seconds per text edit × dozens of edits per day = hours saved weekly
4. **Accessibility**: Makes professional writing quality accessible to non-native speakers and casual writers
5. **Scalability**: Works across all websites, all text fields, for all users—no platform lock-in

**Judging Criteria Coverage**:
- ✅ **Functionality**: Scalable to any website/text field; multi-audience (professionals, students, casual users)
- ✅ **Purpose**: Solves the "context-switching tax" compellingly; encourages repeat daily use
- ✅ **Content**: Clean, minimal UI that doesn't distract from writing; dark mode support
- ✅ **User Experience**: One-click actions; keyboard shortcuts; instant feedback; works seamlessly anywhere
- ✅ **Technical Execution**: Showcases Prompt API, Writer API, and Rewriter API; handles edge cases (long text, offline use)

---

## 🚀 Installation & Setup

### Requirements
- **Chrome Version**: 128+ (Chrome 141+ recommended for latest features)
- **Hardware**: 
  - 16GB+ RAM (recommended for smooth performance)
  - 4GB+ VRAM or 4+ CPU cores
- **Enable Built-in AI**: 
  1. Join the [Chrome Built-in AI Early Preview Program](https://developer.chrome.com/docs/ai/join-epp)
  2. Check `chrome://flags/#optimization-guide-on-device-model` is enabled
  3. Visit `chrome://components/` and update "Optimization Guide On Device Model"

### Install (Development Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `nano-composer/` folder
6. Done! The extension is now active

---

## 🎮 How to Use

### Method 1: Click the Icon
1. Type or select text in any text field (Gmail, LinkedIn, Twitter, etc.)
2. Look for the ✨ **Nano icon** that appears next to the field
3. Click it to open the action menu
4. Select your desired action (Formal, Casual, Grammar, Shorten, Expand, Explain)
5. Review the result and continue typing

### Method 2: Keyboard Shortcuts
- `Alt+N`: Open Nano menu
- `Alt+1`: Quick rewrite to formal tone
- `Alt+2`: Quick rewrite to casual tone
- `Alt+3`: Quick grammar fix

### Method 3: Compose Mode
1. Click the Nano icon in an empty text field
2. Type a simple instruction in the **Compose** section (e.g., "polite follow-up email thanking them for the meeting")
3. Click **Generate**
4. The AI writes complete text directly into your field

### Method 4: Explain Mode
1. Highlight any confusing text on a webpage
2. Click the Nano icon
3. Click **Explain**
4. Read the explanation in the preview panel below the menu

---

## 📁 Project Structure

```
nano-composer/
├── manifest.json              # Extension configuration with trial tokens
├── background/
│   └── service-worker.js      # Model warming, session management, message handling
├── content/
│   ├── overlay.js             # Main UI injection, event handling, action triggers
│   └── overlay.css            # Inline styles (Shadow DOM scoped)
├── lib/
│   ├── ai-manager.js          # Unified AI API wrapper (Prompt, Rewriter, Writer)
│   └── utils.js               # Shared utilities (debounce, storage helpers)
├── popup/
│   ├── popup.html             # Extension popup settings UI
│   ├── popup.js               # Popup logic (warmup, availability checks)
│   └── popup.css              # Popup styling
├── options/
│   ├── options.html           # Full options page
│   ├── options.js             # Options logic
│   └── options.css            # Options styling
└── icons/                     # Extension icons (16, 48, 128px)
```

---

## 🛠️ Technical Architecture

### Design Philosophy
- **User Always Has Final Say**: No automatic posting—AI assists, you approve
- **Privacy-First**: All processing happens on-device; no data leaves your browser
- **Speed-Optimized**: 
  - Model warmup on extension load
  - Cached sessions for sub-2-second responses
  - Shadow DOM for isolated, fast UI rendering
- **Graceful Degradation**: Handles model download states, low-memory scenarios, and timeouts

### Key Technical Decisions
1. **Shadow DOM**: Prevents CSS conflicts with host pages
2. **Inline CSS**: Eliminates external stylesheet loading delays
3. **Offscreen Initialization**: UI elements start hidden to prevent visual flicker
4. **AbortSignal Timeouts**: Prevents hung requests (60s default)
5. **Session Reuse**: One AI session per background worker lifetime for speed

### API Integration Patterns
```javascript
// Example: Rewriting text to formal tone
const session = await LanguageModel.create({
  systemPrompt: "You are Nano Composer. Keep outputs concise...",
  topK: 3,
  temperature: 1.0
});

const result = await session.prompt(
  "Rewrite the following in a formal tone:\n<<<TEXT\nthx for the help\n>>>",
  { signal: AbortSignal.timeout(60000) }
);
// Result: "Thank you for your assistance."
```

---

## 🔧 Development & Testing

### Local Testing
1. Make changes to any file
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the Nano Composer card
4. Test immediately—no build step required

### Debugging
- Open DevTools (`F12`) on any page to see console logs from `content/overlay.js`
- Check `chrome://on-device-internals/` for model status ("Foundational model state: Ready")
- View background worker logs at `chrome://extensions/` → "Inspect views: service worker"

### Common Issues
- **"AI models unavailable"**: Ensure Chrome 128+, Early Preview Program enrolled, and model downloaded at `chrome://components/`
- **Icon not appearing**: Check browser console for errors; verify content script is injected (DevTools → Sources → Content Scripts)
- **Slow first response**: Model download/loading on first run (normal); subsequent uses are fast

---

## 🚧 Roadmap & Future Enhancements

### Planned Features
- **Pre-Generated Prompts**: Contextual suggestions (e.g., "Reply to meeting invite," "Decline politely") to further reduce user effort
- **Style Memory**: Save preferred tones per website (always formal on LinkedIn, always casual on Twitter)
- **Multi-Language Support**: Expanded Translator API integration for seamless multilingual workflows
- **Hybrid Mode**: Optional cloud fallback for extremely long documents or complex tasks (using Firebase AI Logic)

### Development Philosophy
- **AI Assists, Humans Design**: All logic and UX decisions are human-designed; AI executes the implementation
- **User Agency First**: Never auto-post or replace text without explicit user approval
- **Iterative Refinement**: Frequent updates based on user feedback and API improvements

---

## 📊 Performance Benchmarks

*(Tested on: 16GB RAM, dedicated GPU, Chrome 141)*
- **Grammar Fix**: 0.8-1.5 seconds
- **Formal/Casual Rewrite**: 1.2-2.0 seconds
- **Shorten/Expand**: 1.5-2.5 seconds
- **Compose from Prompt**: 2.0-4.0 seconds (varies by complexity)
- **Explain Selection**: 1.8-3.0 seconds

**Comparison**: ChatGPT workflow (tab switch + copy-paste + wait) = 15-30 seconds per edit

---

## 🙏 Acknowledgments

- Built for the **Google Chrome Built-in AI Challenge 2025**
- Powered by **Gemini Nano** and Chrome's Built-in AI APIs
- Thanks to the Chrome team for making on-device AI accessible to developers
- Inspired by the need to make writing faster, cheaper, and more private for everyone

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is a hackathon project, but feedback and suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your use cases and experiences

---

**Made with ❤️ for writers who value speed, privacy, and convenience**

*Join us in giving the web a brain boost—one text field at a time.*