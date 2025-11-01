// content/overlay.js
// MV3 content script for the Nano Composer overlay
(() => {
    // -----------------------------
    // Config
    // -----------------------------
    const STORAGE_DEFAULTS = {
        show_icon: true,
        default_tone: "formal",
        preferred_language: "en"
    };
    const BTN_OFFSET = { x: 8, y: 6 };
    const MIN_FIELD_SIZE = { w: 60, h: 22 };

    // INLINE CSS: Synced with your full overlay.css + new .nano-explanation styles
    const INLINE_CSS = `
/* Nano overlay styles (Shadow DOM scoped) */
:host {
    all: initial;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica, Arial, sans-serif;
    color-scheme: light dark;
}
.nano-hidden {
    display: none !important;
}
/* Floating root is injected by content script and hosts this shadow tree */
#nano-root {
    all: initial;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483646;
    font-family: inherit;
}
/* -------------------------------------------------------------------------- */
/* Floating button */
/* -------------------------------------------------------------------------- */
.nano-btn {
    pointer-events: auto;
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,.12);
    background: rgba(255,255,255,.96);
    box-shadow: 0 2px 8px rgba(0,0,0,.15);
    cursor: pointer;
    user-select: none;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}
    .nano-btn svg {
        width: 18px;
        height: 18px;
        display: block;
    }
    .nano-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,.2);
        border-color: rgba(0,0,0,.18);
    }
    .nano-btn:active {
        transform: translateY(0);
    }
    .nano-btn:focus-visible {
        outline: 2px solid #2563eb; /* accessible focus ring */
        outline-offset: 2px;
    }
/* -------------------------------------------------------------------------- */
/* Menu container */
/* -------------------------------------------------------------------------- */
.nano-menu {
    pointer-events: auto;
    position: absolute;
    min-width: 240px;
    max-width: min(90vw, 420px);
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.12);
    background: rgba(255,255,255,.98);
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    padding: 8px;
    font-size: 14px;
}
    .nano-menu[aria-hidden="true"] {
        display: none;
    }
/* Header (matches overlay.js: <div class="nano-menu-header">) */
.nano-menu-header {
    font-weight: 600;
    font-size: 13px;
    color: #111;
    padding: 4px 8px 8px 8px;
}
/* -------------------------------------------------------------------------- */
/* Quick actions */
/* -------------------------------------------------------------------------- */
.nano-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 0 4px 8px 4px;
}
.nano-act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    border: 1px solid rgba(0,0,0,.14);
    background: #fff;
    color: #111;
    transition: background-color .12s ease, border-color .12s ease, transform .12s ease;
    font-size: 14px;
}
    .nano-act:hover,
    .nano-act:focus-visible {
        outline: none;
        border-color: rgba(0,0,0,.2);
        background: rgba(0,0,0,.04);
    }
    .nano-act:active {
        transform: translateY(0);
    }
    .nano-act[disabled] {
        opacity: .6;
        cursor: not-allowed;
    }
/* -------------------------------------------------------------------------- */
/* Compose block */
/* -------------------------------------------------------------------------- */
.nano-compose {
    border-top: 1px solid rgba(0,0,0,.08);
    margin-top: 6px;
    padding-top: 8px;
}
    .nano-compose .nano-compose-label {
        font-size: 12px;
        color: #333;
        padding: 0 4px 6px 4px;
    }
    .nano-compose .nano-compose-input {
        display: block;
        width: 100%;
        min-height: 72px;
        max-height: 200px;
        resize: vertical;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(0,0,0,.14);
        background: #fff;
        color: #111;
        font: 13px/1.35 inherit;
        box-sizing: border-box;
    }
        .nano-compose .nano-compose-input:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }
    .nano-compose .nano-compose-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
        padding-top: 8px;
    }
.nano-btn-generate,
.nano-btn-back {
    appearance: none;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    transition: background-color .12s ease, border-color .12s ease, transform .12s ease;
}
.nano-btn-generate {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: #fff;
}
    .nano-btn-generate:hover {
        filter: brightness(1.05);
    }
    .nano-btn-generate:focus-visible {
        outline: 2px solid #1d4ed8;
        outline-offset: 2px;
    }
.nano-btn-back {
    border: 1px solid rgba(0,0,0,.14);
    background: #fff;
    color: #111;
}
    .nano-btn-back:hover {
        background: rgba(0,0,0,.04);
        border-color: rgba(0,0,0,.2);
    }
    .nano-btn-back:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
    }
/* -------------------------------------------------------------------------- */
/* Explanation panel (NEW: Read-only preview for Explain action) */
/* -------------------------------------------------------------------------- */
.nano-explanation {
    margin-top: 8px;
    padding: 10px;
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 8px;
    background: rgba(0,0,0,.02);
    max-height: 150px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.4;
    color: #444;
    white-space: pre-wrap;
}
    .nano-explanation:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
    }
/* Dark mode for explanation */
@media (prefers-color-scheme: dark) {
    .nano-explanation {
        background: rgba(255,255,255,.04);
        border-color: rgba(255,255,255,.12);
        color: #ccc;
    }
}
/* -------------------------------------------------------------------------- */
/* Status line and busy indicator */
/* -------------------------------------------------------------------------- */
[data-status] {
    margin-top: 6px;
    padding: 4px 6px;
    font-size: 12px;
    color: #333;
    min-height: 18px;
    display: flex;
    align-items: center;
    gap: 6px;
}
    [data-status][data-busy="1"]::before {
        content: "";
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-right-color: transparent;
        animation: nano-spin 0.9s linear infinite;
        opacity: .9;
    }
@keyframes nano-spin {
    to {
        transform: rotate(360deg);
    }
}
/* -------------------------------------------------------------------------- */
/* Keyboard badge (if used in footer) */
/* -------------------------------------------------------------------------- */
.nano-kbd {
    font: 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    padding: 1px 4px;
    border: 1px solid rgba(0,0,0,.2);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: #fff;
    color: #111;
}
/* -------------------------------------------------------------------------- */
/* Dark mode */
/* -------------------------------------------------------------------------- */
@media (prefers-color-scheme: dark) {
    .nano-btn {
        background: rgba(24,24,27,.96);
        border-color: rgba(255,255,255,.12);
        box-shadow: 0 2px 8px rgba(0,0,0,.6);
    }
        .nano-btn svg {
            filter: invert(1) brightness(1.2);
        }
    .nano-menu {
        background: rgba(24,24,27,.98);
        border-color: rgba(255,255,255,.14);
        box-shadow: 0 8px 24px rgba(0,0,0,.7);
    }
    .nano-menu-header {
        color: #e5e7eb;
    }
    .nano-act {
        background: #18181b;
        color: #e5e7eb;
        border-color: rgba(255,255,255,.14);
    }
        .nano-act:hover,
        .nano-act:focus-visible {
            background: rgba(255,255,255,.06);
            border-color: rgba(255,255,255,.22);
        }
    .nano-compose .nano-compose-label {
        color: #d1d5db;
    }
    .nano-compose .nano-compose-input {
        background: #18181b;
        color: #e5e7eb;
        border-color: rgba(255,255,255,.14);
    }
    .nano-btn-back {
        background: #18181b;
        color: #e5e7eb;
        border-color: rgba(255,255,255,.14);
    }
        .nano-btn-back:hover {
            background: rgba(255,255,255,.06);
            border-color: rgba(255,255,255,.22);
        }
    [data-status] {
        color: #d1d5db;
    }
}
/* -------------------------------------------------------------------------- */
/* High contrast */
/* -------------------------------------------------------------------------- */
@media (forced-colors: active) {
    .nano-btn,
    .nano-menu,
    .nano-act,
    .nano-compose .nano-compose-input,
    .nano-btn-generate,
    .nano-btn-back {
        border: 1px solid CanvasText;
    }
    .nano-btn-generate {
        background: Highlight;
        color: HighlightText;
    }
}
/* -------------------------------------------------------------------------- */
/* Reduced motion */
/* -------------------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
    .nano-btn,
    .nano-act,
    .nano-btn-generate,
    .nano-btn-back {
        transition: none;
    }
    [data-status][data-busy="1"]::before {
        animation: none;
    }
}
/* Active selection state for action buttons */
.nano-act[aria-pressed="true"],
.nano-act[data-selected="1"] {
    border-color: #2563eb;
    background: rgba(37,99,235,.08);
    box-shadow: 0 0 0 2px rgba(37,99,235,.14) inset;
    font-weight: 600;
}
/* Dark mode tuning for the active state */
@media (prefers-color-scheme: dark) {
    .nano-act[aria-pressed="true"],
    .nano-act[data-selected="1"] {
        border-color: rgba(99,156,255,.9);
        background: rgba(99,156,255,.14);
        box-shadow: 0 0 0 2px rgba(99,156,255,.22) inset;
    }
}
    `; // End of INLINE_CSS

    // -----------------------------
    // State
    // -----------------------------
    let showIcon = true;
    let focusedEl = null;
    let menuOpen = false;
    let rewriteInFlight = false;
    // Shadow DOM nodes
    let host, root, btn, menu, statusEl, composeInput, explanationEl;  // NEW: explanationEl

    // -----------------------------
    // Type and DOM helpers
    // -----------------------------
    function isElement(el) { return el && el.nodeType === 1; }
    function isTextField(el) {
        if (!isElement(el)) return false;
        if (el.isContentEditable) return true;
        if (el.tagName === "TEXTAREA") return true;
        if (el.tagName === "INPUT") {
            const t = (el.type || "text").toLowerCase();
            return ["text", "search", "email", "url", "tel", "number", "password"].includes(t) || !t;
        }
        return false;
    }
    function getFieldRect(el) {
        if (!isElement(el)) return null;
        try {
            const rect = el.getBoundingClientRect?.();
            if (!rect) return null;
            if (rect.width < MIN_FIELD_SIZE.w || rect.height < MIN_FIELD_SIZE.h) return null;
            return rect;
        } catch { return null; }
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function selectionForField(el) {
        try {
            if (el.isContentEditable) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                    const text = String(sel.toString() || "");
                    return { text, whole: !text.trim() };
                }
                return { text: el.innerText || "", whole: true };
            }
            if (typeof el.selectionStart === "number") {
                const s = el.selectionStart, e = el.selectionEnd;
                if (s !== e) return { text: el.value.slice(s, e), whole: false };
                return { text: el.value || "", whole: true };
            }
            return { text: "", whole: true };
        } catch {
            return { text: el.isContentEditable ? (el.innerText || "") : (el.value || ""), whole: true };
        }
    }
    function replaceSelection(el, newText, replaceWhole) {
        try {
            if (el.isContentEditable) {
                if (replaceWhole) { el.innerText = newText; return; }
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                    const r = sel.getRangeAt(0);
                    r.deleteContents();
                    r.insertNode(document.createTextNode(newText));
                    sel.collapseToEnd();
                } else {
                    el.innerText = newText;
                }
                return;
            }
            if (replaceWhole) { el.value = newText; return; }
            const s = el.selectionStart ?? 0;
            const e = el.selectionEnd ?? s;
            const before = el.value.slice(0, s);
            const after = el.value.slice(e);
            const next = before + newText + after;
            const pos = before.length + newText.length;
            el.value = next;
            el.setSelectionRange(pos, pos);
        } catch {
            if (el.isContentEditable) el.innerText = newText;
            else if (typeof el.value === "string") el.value = newText;
        }
    }
    function runtimeSend(payload) {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage(payload, (resp) => {
                    const err = chrome.runtime.lastError;
                    if (err) return reject(err.message || String(err));
                    if (!resp || resp.success === false) return reject(resp?.error || "Unknown error");
                    resolve(resp.result);
                });
            } catch (e) { reject(String(e)); }
        });
    }
    function withStatus(msg, busy = false) {
        if (!statusEl) return;
        statusEl.textContent = msg || "";
        statusEl.setAttribute("data-busy", busy ? "1" : "0");
    }

    // -----------------------------
    // Menu open and close
    // Keep these as function declarations so they are always defined.
    // -----------------------------
    function positionButton() {
        if (!btn) return;
        if (!showIcon || !focusedEl) return hideButton();
        const rect = getFieldRect(focusedEl);
        if (!rect) return hideButton();
        const x = clamp(rect.right + BTN_OFFSET.x, 0, window.innerWidth - 40);
        const y = clamp(rect.bottom - rect.height / 2, 0, window.innerHeight - 40);
        btn.style.left = `${x}px`;
        btn.style.top = `${y}px`;
        btn.classList.remove("nano-hidden");
        btn.style.visibility = 'visible'; // NEW: Reveal only after positioning
    }
    function hideButton() {
        if (btn) {
            btn.classList.add("nano-hidden");
            btn.style.visibility = 'hidden'; // NEW: Extra hide layer
        }
    }
    function openMenu() {
        if (!menu || !btn || !focusedEl) return;
        const rect = getFieldRect(focusedEl);
        if (!rect) return;
        const mx = clamp(rect.right - 4, 8, window.innerWidth - 8);
        const my = clamp(rect.bottom + 8, 8, window.innerHeight - 8);
        menu.style.left = `${mx}px`;
        menu.style.top = `${my}px`;
        menu.setAttribute("aria-hidden", "false");
        menu.style.visibility = 'visible'; // NEW: Reveal after positioning
        menuOpen = true;
        withStatus("");
        if (composeInput) composeInput.value = "";
        if (explanationEl) {  // NEW: Hide explanation on open
            explanationEl.classList.add("nano-hidden");
            explanationEl.textContent = "";
        }
    }
    function closeMenu() {
        if (!menu) return;
        menu.setAttribute("aria-hidden", "true");
        menu.style.visibility = 'hidden'; // NEW: Extra hide
        menuOpen = false;
        // clear selection highlight
        const btns = menu.querySelectorAll(".nano-act[aria-pressed='true']");
        btns.forEach(b => { b.setAttribute("aria-pressed", "false"); b.removeAttribute("data-selected"); });
        // NEW: Clear explanation on close
        if (explanationEl) {
            explanationEl.classList.add("nano-hidden");
            explanationEl.textContent = "";
        }
    }
    function toggleMenu() {
        if (menuOpen) closeMenu();
        else openMenu();
    }

    // -----------------------------
    // Shadow DOM setup (UPDATED: Inline CSS, append to <html>, offscreen hidden init + NEW explanationEl)
    // -----------------------------
    function ensureShadowUi() {
        if (root) return;

        // NEW: Append to <html> (document.documentElement) – safe at document_start
        host = document.createElement("div");
        host.id = "nano-root";
        host.style.all = "initial";
        host.style.position = "fixed";
        host.style.inset = "0";
        host.style.pointerEvents = "none";
        host.style.zIndex = "2147483646";

        // NEW: Append to documentElement (always exists), fallback to body
        (document.documentElement || document.body).appendChild(host);

        root = host.attachShadow({ mode: "open" });

        // NEW: Inline <style> instead of <link> for instant styling
        const style = document.createElement("style");
        style.textContent = INLINE_CSS;
        root.appendChild(style);

        // Floating button (NEW: Offscreen + hidden initially)
        btn = document.createElement("button");
        btn.setAttribute("aria-label", "Open Nano Composer");
        btn.className = "nano-btn nano-hidden";
        btn.style.pointerEvents = "auto";
        btn.style.position = "absolute";
        btn.style.left = "-9999px"; // NEW: Offscreen to prevent top-left flash
        btn.style.top = "-9999px";
        btn.style.visibility = "hidden"; // NEW: Hidden until positioned
        btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12a8 8 0 1 1 16 0v1h1a1 1 0 1 1 0 2h-1.35A4.5 4.5 0 0 1 15.5 20h-7A4.5 4.5 0 0 1 4 15.5V12z"></path>
      </svg>`;
        btn.addEventListener("click", (e) => { e.preventDefault(); toggleMenu(); });
        root.appendChild(btn);

        // Menu (NEW: Offscreen + hidden initially + NEW explanation div)
        menu = document.createElement("div");
        menu.className = "nano-menu";
        menu.setAttribute("role", "dialog");
        menu.setAttribute("aria-hidden", "true");
        menu.style.pointerEvents = "auto";
        menu.style.position = "absolute";
        menu.style.left = "-9999px"; // NEW: Offscreen
        menu.style.top = "-9999px";
        menu.style.visibility = "hidden"; // NEW: Hidden until opened
        menu.innerHTML = `
      <div class="nano-menu-header">Nano Composer</div>
      <div class="nano-actions">
        <button class="nano-act" data-op="formal" aria-pressed="false">Formal</button>
        <button class="nano-act" data-op="casual" aria-pressed="false">Casual</button>
        <button class="nano-act" data-op="grammar" aria-pressed="false">Grammar</button>
        <button class="nano-act" data-op="shorten" aria-pressed="false">Shorten</button>
        <button class="nano-act" data-op="expand" aria-pressed="false">Expand</button>
        <button class="nano-act" data-op="explain" aria-pressed="false">Explain</button>
      </div>
      <div class="nano-compose">
        <div class="nano-compose-label">Compose</div>
        <textarea class="nano-compose-input" placeholder="Instruction, e.g., Write a polite follow up"></textarea>
        <div class="nano-compose-buttons">
          <button class="nano-btn-generate" data-op="write">Generate</button>
          <button class="nano-btn-back" data-op="close">Close</button>
        </div>
      </div>
      <div class="nano-explanation nano-hidden" tabindex="-1" aria-label="Explanation preview"></div>  <!-- NEW -->
      <div class="nano-error" data-status></div>
    `;
        root.appendChild(menu);

        statusEl = menu.querySelector("[data-status]");
        composeInput = menu.querySelector(".nano-compose-input");
        explanationEl = menu.querySelector(".nano-explanation");  // NEW
        menu.addEventListener("click", onMenuClick);
        root.addEventListener("mousedown", onShadowMouseDown, true);

        // NEW: Log for debugging (remove in production if desired)
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: "debug", msg: "Shadow UI injected successfully" });
        }
    }

    // -----------------------------
    // Menu interactions
    // -----------------------------
    function setSelected(opOrNull) {
        const btns = Array.from(menu.querySelectorAll(".nano-act"));
        for (const b of btns) {
            const on = opOrNull && b.getAttribute("data-op") === opOrNull;
            b.setAttribute("aria-pressed", on ? "true" : "false");
            if (on) b.setAttribute("data-selected", "1");
            else b.removeAttribute("data-selected");
        }
    }
    function actionLabel(op) {
        const m = {
            formal: "Formal rewrite",
            casual: "Casual rewrite",
            grammar: "Grammar fix",
            shorten: "Shorten",
            expand: "Expand",
            write: "Compose",
            explain: "Explain selection"  // Updated label for clarity
        };
        return m[op] || "Working";
    }
    function onShadowMouseDown(e) {
        const path = e.composedPath();
        if (!path.includes(menu) && !path.includes(btn)) closeMenu();
    }
    function onMenuClick(e) {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const op = t.getAttribute("data-op");
        if (!op || rewriteInFlight) return;
        if (op === "close") { closeMenu(); return; }
        if (op !== "explain") setSelected(op);
        triggerAction(op);
    }

    // -----------------------------
    // Actions (UPDATED: Enhanced Explain with selection check + dedicated panel)
    // -----------------------------
    async function ensureModelReady() {
        try {
            const avail = await runtimeSend({ action: "availability" });
            const s = typeof avail === "string" ? avail : (avail?.status || avail?.languageModel || avail?.prompt || "");
            if (String(s).includes("downloadable")) {
                withStatus("Local AI is still installing. Please try again shortly.", false);
                return false;
            }
            return true;
        } catch {
            return true;
        }
    }
    async function triggerAction(op) {
        if (!focusedEl) return;
        const { text, whole } = selectionForField(focusedEl);
        const payload =
            text && text.trim()
                ? text
                : focusedEl.isContentEditable
                    ? (focusedEl.innerText || "")
                    : (focusedEl.value || "");
        if (!payload && op !== "write" && op !== "explain") return;
        if (!(await ensureModelReady())) return;
        rewriteInFlight = true;
        withStatus(`${actionLabel(op)}.`, true);
        try {
            let result;
            if (op === "explain") {
                // NEW: Guard - only on highlighted text
                if (!text || !text.trim()) {
                    withStatus("Select text to explain.", false);
                    setTimeout(() => withStatus(""), 1500);
                    return;
                }
                // Do not modify the field. Show explanation in dedicated panel.
                result = await runtimeSend({
                    action: "explain",
                    data: { text: payload }
                });
                if (explanationEl) {
                    explanationEl.textContent = String(result || "No explanation generated.");
                    explanationEl.classList.remove("nano-hidden");
                    explanationEl.focus();  // Accessibility: Focus for screen readers
                }
                withStatus("Explanation ready");
                setTimeout(() => withStatus(""), 1200);
                return;
            }
            if (op === "formal" || op === "casual" || op === "grammar") {
                result = await runtimeSend({ action: "rewrite", data: { text: payload, mode: op } });
                replaceSelection(focusedEl, String(result || ""), whole || !text);
            } else if (op === "shorten") {
                result = await runtimeSend({ action: "shorten", data: { text: payload } });
                replaceSelection(focusedEl, String(result || ""), whole || !text);
            } else if (op === "expand") {
                result = await runtimeSend({ action: "expand", data: { text: payload } });
                replaceSelection(focusedEl, String(result || ""), whole || !text);
            } else if (op === "write") {
                const instruction = (composeInput.value || "").trim();
                if (!instruction) {
                    withStatus("Enter an instruction for Compose.");
                } else {
                    result = await runtimeSend({ action: "write", data: { instruction, context: payload || "" } });
                    replaceSelection(focusedEl, String(result || ""), true);
                }
            }
            withStatus("Done");
            setTimeout(() => withStatus(""), 1200);
        } catch (err) {
            withStatus(String(err || "Error"));
        } finally {
            rewriteInFlight = false;
        }
    }

    // -----------------------------
    // Focus detection and layout
    // -----------------------------
    function onFocusIn(e) {
        const el = e.target;
        if (!isTextField(el)) return;
        focusedEl = el;
        positionButton();
    }
    document.addEventListener("mousedown", (e) => {
        const el = e.target;
        if (isTextField(el)) focusedEl = el;
    }, true);
    function onScrollOrResize() {
        if (!menuOpen) positionButton();
    }
    function findBestTextField() {
        const active = document.activeElement;
        if (isTextField(active) && getFieldRect(active)) return active;
        const candidates = Array.from(document.querySelectorAll(
            'textarea, input[type="text"], input[type="search"], input:not([type]), [contenteditable="true"], [contenteditable=""]'
        ));
        for (const el of candidates) {
            if (isTextField(el) && getFieldRect(el)) return el;
        }
        return null;
    }

    // -----------------------------
    // Messages from background
    // -----------------------------
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.action === "toggleMenu") {
            if (!focusedEl || !isTextField(focusedEl)) {
                const el = findBestTextField();
                if (el) {
                    try { el.focus({ preventScroll: true }); } catch { }
                    focusedEl = el;
                }
            }
            if (!focusedEl) return;
            toggleMenu();
        }
        if (msg && msg.action === "rewrite" && msg.tone) {
            const el = isTextField(document.activeElement) ? document.activeElement : findBestTextField();
            if (el) focusedEl = el;
            if (!focusedEl) return;
            setSelected(String(msg.tone));
            triggerAction(String(msg.tone));
        }
    });

    // -----------------------------
    // Settings
    // -----------------------------
    function applySettingsSync() {
        chrome.storage.sync.get(STORAGE_DEFAULTS, (cfg) => {
            showIcon = !!cfg.show_icon;
            if (!showIcon) hideButton();
            else positionButton();
        });
    }
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return;
        if (changes.show_icon && changes.show_icon.newValue !== undefined) {
            showIcon = !!changes.show_icon.newValue;
            if (!showIcon) hideButton();
            else positionButton();
        }
    });

    // -----------------------------
    // Init (UPDATED: Wait for DOM if needed, but safe at document_start)
    // -----------------------------
    function init() {
        try {
            ensureShadowUi();
            applySettingsSync();
            document.addEventListener("focusin", onFocusIn, true);
            window.addEventListener("scroll", onScrollOrResize, true);
            window.addEventListener("resize", onScrollOrResize);
            const active = document.activeElement;
            if (isTextField(active)) {
                focusedEl = active;
                positionButton();
            }
        } catch (e) {
            // NEW: Better error logging
            console.error("[Nano Composer] Init error:", e);
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: "debug", msg: "Init failed: " + String(e) });
            }
        }
    }

    // NEW: If DOM is still loading, wait for it (rare at document_start, but safe)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();