// background/service-worker.js
// MV3 module service worker

import { AiManager } from "../lib/ai-manager.js";

console.log("[ServiceWorker] Nano Composer background script loaded");

const aiManager = new AiManager({ lang: "en" });

let warmupComplete = false;
const MAX_WARMUP_ATTEMPTS = 3;
let warmupAttempts = 0;

async function applyPreferredLanguage() {
    const { preferred_language } = await chrome.storage.sync.get({ preferred_language: "en" });
    aiManager.setLanguage(preferred_language || "en");
}

function timeoutSignal(ms) {
    if (AbortSignal && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(ms);
    }
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort("timeout"), ms);
    return ctrl.signal;
}

async function warmupModels() {
    if (warmupComplete) return true;
    if (warmupAttempts >= MAX_WARMUP_ATTEMPTS) {
        console.warn("[ServiceWorker] Max warmup attempts reached");
        return false;
    }
    warmupAttempts++;
    try {
        await applyPreferredLanguage();
        await aiManager.init();
        warmupComplete = true;

        await chrome.storage.session.set({ warmup_complete: true, warmup_time: Date.now() });

        const { debugMode = false } = await chrome.storage.sync.get({ debugMode: false });
        if (debugMode) {
            try {
                await aiManager.rewrite({ text: "test", mode: "grammar" }, timeoutSignal(20000));
                console.log("[ServiceWorker] Warmup smoke test passed");
            } catch (e) {
                console.warn("[ServiceWorker] Warmup smoke test failed:", e);
            }
        }
        return true;
    } catch (err) {
        console.error("[ServiceWorker] Warmup error:", err);
        warmupComplete = false;
        // Allow retries when model is still downloading or on timeouts
        const msg = String(err?.message || err);
        if (msg.includes("downloadable") || msg.includes("timeout")) {
            warmupAttempts = 0;
        }
        return false;
    }
}

chrome.runtime.onInstalled.addListener(async () => {
    await warmupModels();
    await chrome.storage.sync.set({
        enabled: true,
        show_icon: true,
        default_tone: "formal",
        preferred_language: "en",
        debugMode: false
    });
});

chrome.runtime.onStartup.addListener(async () => {
    warmupComplete = false;
    warmupAttempts = 0;
    await warmupModels();
});

// Unified async handler
self.handler = (request, sender, sendResponse) => {
    (async () => {
        try {
            if (!request || !request.action) {
                sendResponse({ success: false, error: "Invalid request: missing action" });
                return;
            }

            if (!warmupComplete) {
                const ok = await warmupModels();
                if (!ok) {
                    sendResponse({
                        success: false,
                        error:
                            "AI models unavailable. Ensure Chrome 128+ with Built-in AI enabled, Optimization Guide On Device Model installed, and try again."
                    });
                    return;
                }
            }

            // Keep availability fresh for each call
            await aiManager.refreshAvailability();

            const { action, data = {} } = request;
            const signal = timeoutSignal(60000);

            let result;

            switch (action) {
                case "rewrite": {
                    const { text } = data;
                    const tone = data.tone || data.mode || "formal";
                    if (!text) throw new Error("No text provided for rewrite");
                    result = await aiManager.rewrite({ text, mode: tone }, signal);
                    break;
                }
                case "shorten": {
                    const { text } = data;
                    if (!text) throw new Error("No text provided for shorten");
                    result = await aiManager.shorten(text, signal);
                    break;
                }
                case "expand": {
                    const { text } = data;
                    if (!text) throw new Error("No text provided for expand");
                    result = await aiManager.expand(text, signal);
                    break;
                }
                case "proofread": {
                    const { text } = data;
                    if (!text) throw new Error("No text provided for proofread");
                    result = await aiManager.proofread(text, signal);
                    break;
                }
                case "write": {
                    const { instruction, context = "" } = data;
                    if (!instruction) throw new Error("No instruction provided for write");
                    result = await aiManager.write({ instruction, context }, signal);
                    break;
                }
                case "explain": {
                    const { text } = data;
                    if (!text) throw new Error("Nothing to explain");
                    result = await aiManager.write({
                        instruction: "Explain the following clearly and objectively for a general audience. Avoid extra formatting.",
                        context: text
                    }, signal);
                    break;
                }
                case "availability": {
                    // Return the latest snapshot that refreshAvailability just fetched
                    result = aiManager.getAvailability();
                    break;
                }
                case "warmup": {
                    result = { ok: await warmupModels() };
                    break;
                }
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            sendResponse({ success: true, result });
        } catch (err) {
            console.error("[ServiceWorker] Handler error:", err);
            sendResponse({ success: false, error: String(err?.message || err) });
        }
    })();
    return true;
};

chrome.runtime.onMessage.addListener(self.handler);

// Keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (command === "trigger-rewrite") {
        chrome.tabs.sendMessage(tab.id, { action: "toggleMenu" });
        return;
    }

    if (command === "quick-formal" || command === "quick-casual" || command === "quick-grammar") {
        const tone = command === "quick-formal" ? "formal"
            : command === "quick-casual" ? "casual"
                : "grammar";
        chrome.tabs.sendMessage(tab.id, { action: "rewrite", tone });
    }
});

// Initial warmup on load
warmupModels().then(() => console.log("[ServiceWorker] Ready"));

// Optional console helper for quick smoke testing
self.testAllOps = async () => {
    const sendResponse = (resp) => console.log("Response:", resp);
    self.handler({ action: "availability" }, {}, sendResponse);
    self.handler({ action: "warmup" }, {}, sendResponse);
    self.handler({ action: "rewrite", data: { text: "fix this bad grammer plz", tone: "grammar" } }, {}, sendResponse);
    self.handler({ action: "shorten", data: { text: "This is a long sentence that needs shortening." } }, {}, sendResponse);
    self.handler({ action: "expand", data: { text: "AI is cool." } }, {}, sendResponse);
    self.handler({ action: "proofread", data: { text: "i has bad spellign." } }, {}, sendResponse);
    self.handler({ action: "write", data: { instruction: "Write a short thank you email.", context: "For the gift." } }, {}, sendResponse);
};
