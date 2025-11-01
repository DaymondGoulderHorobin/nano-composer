// lib/ai-manager.js
// Unified wrapper for Chrome Built-in AI Prompt API
// Exposes rewrite, shorten, expand, proofread, and write
// Uses the Prompt API as the primary path and handles the downloadable state

export class AiManager {
    constructor(opts = {}) {
        this.lang = opts.lang || "en";
        this.topK = opts.topK ?? 3;
        this.temperature = opts.temperature ?? 1.0;

        this._session = null;
        this._avail = {
            status: "unknown",
            languageModel: "unknown",
            writer: "unknown",
            rewriter: "unknown",
            raw: {}
        };
    }

    setLanguage(lang) {
        if (lang && typeof lang === "string") this.lang = lang;
    }

    // ---- Availability --------------------------------------------------------

    _normalizeStatus(s) {
        const v = String(s || "").toLowerCase();
        if (v === "available") return "available";
        if (v === "after-download" || v === "downloadable") return "downloadable";
        if (v === "unavailable" || v === "blocked") return "unavailable";
        return "unknown";
    }

    async refreshAvailability() {
        if (typeof LanguageModel === "undefined" || typeof LanguageModel.availability !== "function") {
            this._avail = {
                status: "unavailable",
                languageModel: "unavailable",
                writer: "unknown",
                rewriter: "unknown",
                raw: {}
            };
            return this._avail;
        }

        let lm = "unknown";
        try {
            lm = await LanguageModel.availability();
        } catch {
            lm = "unavailable";
        }

        const languageModel = this._normalizeStatus(lm);
        const status = languageModel;

        this._avail = {
            status,
            languageModel,
            writer: "unknown",
            rewriter: "unknown",
            raw: { lm }
        };
        return this._avail;
    }

    getAvailability() {
        return this._avail;
    }

    // ---- Session lifecycle ---------------------------------------------------

    async init(signal) {
        await this.refreshAvailability();

        if (this._avail.languageModel === "unavailable") {
            throw new Error("Language model is unavailable in this browser.");
        }
        if (this._avail.languageModel === "downloadable") {
            // Do not force a download here. Let the UI inform the user to try again.
            return false;
        }

        await this._ensureSession(signal);
        return true;
    }

    async _ensureSession(signal) {
        if (this._session) return this._session;

        if (typeof LanguageModel === "undefined" || typeof LanguageModel.create !== "function") {
            throw new Error("Prompt API not found. Ensure Chrome 128 or newer with Built-in AI enabled.");
        }

        // Respect device defaults if exposed
        try {
            if (typeof LanguageModel.params === "function") {
                const { defaultTopK, defaultTemperature } = await LanguageModel.params();
                if (this.topK == null && typeof defaultTopK === "number") this.topK = defaultTopK;
                if (this.temperature == null && typeof defaultTemperature === "number") this.temperature = defaultTemperature;
            }
        } catch {
            // Optional, ignore if not available
        }

        const systemPrompt =
            "You are Nano Composer. Keep outputs concise, faithful to the user text, " +
            "and free of extra commentary. Return only the final text.";

        this._session = await LanguageModel.create({
            initialPrompts: [{ role: "system", content: systemPrompt }],
            topK: this.topK,
            temperature: this.temperature,
            signal
        });

        return this._session;
    }

    async _prompt(text, signal, params = {}) {
        if (!text || !text.trim()) throw new Error("No text provided.");

        const sess = await this._ensureSession(signal);

        // Per-call decoding overrides if supported on the session
        if (typeof params.topK === "number") {
            try { sess.topK = params.topK; } catch { }
        }
        if (typeof params.temperature === "number") {
            try { sess.temperature = params.temperature; } catch { }
        }

        try {
            const out = await sess.prompt(text, { signal, language: this.lang });
            if (typeof out !== "string" || !out.trim()) {
                throw new Error("Empty response from the language model.");
            }
            return out.trim();
        } catch (err) {
            const msg = String(err?.message || err || "");
            if (msg.toLowerCase().includes("abort") || msg.toLowerCase().includes("timeout")) {
                throw new Error("Request timed out. Please try again.");
            }
            throw new Error(msg || "Prompt failed.");
        }
    }

    // ---- Task builders -------------------------------------------------------

    _rewritePrompt(mode, text) {
        const fenceStart = "<<<TEXT";
        const fenceEnd = ">>>";

        switch (String(mode || "").toLowerCase()) {
            case "formal":
                return [
                    "Rewrite the text in a professional and formal tone.",
                    "Preserve meaning, facts, and intent.",
                    "Return only the rewritten text.",
                    fenceStart, text, fenceEnd
                ].join("\n");
            case "casual":
                return [
                    "Rewrite the text in a relaxed, natural tone suitable for friendly conversation.",
                    "Preserve meaning, facts, and intent.",
                    "Return only the rewritten text.",
                    fenceStart, text, fenceEnd
                ].join("\n");
            case "grammar":
                return [
                    "Fix grammar, spelling, and clarity.",
                    "Do not change tone or meaning.",
                    "Return only the corrected text.",
                    fenceStart, text, fenceEnd
                ].join("\n");
            default:
                return [
                    "Rewrite the text to improve clarity and flow without changing its meaning.",
                    "Return only the rewritten text.",
                    fenceStart, text, fenceEnd
                ].join("\n");
        }
    }

    _shortenPrompt(text) {
        return [
            "Shorten the text conservatively while preserving all key meaning.",
            "Avoid bullet lists unless the original used them.",
            "Return only the shortened text.",
            "<<<TEXT", text, ">>>"
        ].join("\n");
    }

    _expandPrompt(text) {
        return [
            "Expand the text by roughly 20 to 40 percent while keeping the same meaning and tone.",
            "Avoid inventing new facts.",
            "Return only the expanded text.",
            "<<<TEXT", text, ">>>"
        ].join("\n");
    }

    _proofreadPrompt(text) {
        return [
            "Proofread and correct grammar, punctuation, and word choice.",
            "Preserve the original tone and structure as much as possible.",
            "Return only the corrected text.",
            "<<<TEXT", text, ">>>"
        ].join("\n");
    }

    _writePrompt(instruction, context) {
        const lines = [
            "Follow the instruction and draft a concise response.",
            "Use clear, direct language.",
            "Return only the draft."
        ];
        if (context && context.trim()) {
            lines.push("You may use the context to tailor wording without adding new facts.");
            lines.push("<<<CONTEXT");
            lines.push(context);
            lines.push(">>>");
        }
        lines.push("<<<INSTRUCTION");
        lines.push(instruction);
        lines.push(">>>");
        return lines.join("\n");
    }

    // ---- Public operations ---------------------------------------------------

    async rewrite({ text, mode = "formal" }, signal) {
        if (!text || !text.trim()) throw new Error("No text provided for rewrite.");
        if (this._avail.languageModel === "downloadable") {
            throw new Error("Local model is still downloading. Please try again shortly.");
        }
        await this.init(signal);
        const prompt = this._rewritePrompt(mode, text);
        return this._prompt(prompt, signal);
    }

    async shorten(text, signal) {
        if (!text || !text.trim()) throw new Error("No text provided for shorten.");
        if (this._avail.languageModel === "downloadable") {
            throw new Error("Local model is still downloading. Please try again shortly.");
        }
        await this.init(signal);
        return this._prompt(this._shortenPrompt(text), signal);
    }

    async expand(text, signal) {
        if (!text || !text.trim()) throw new Error("No text provided for expand.");
        if (this._avail.languageModel === "downloadable") {
            throw new Error("Local model is still downloading. Please try again shortly.");
        }
        await this.init(signal);
        return this._prompt(this._expandPrompt(text), signal);
    }

    async proofread(text, signal) {
        if (!text || !text.trim()) throw new Error("No text provided for proofread.");
        if (this._avail.languageModel === "downloadable") {
            throw new Error("Local model is still downloading. Please try again shortly.");
        }
        await this.init(signal);
        return this._prompt(this._proofreadPrompt(text), signal, { temperature: 0.3, topK: 3 });
    }

    async write({ instruction, context = "" }, signal) {
        if (!instruction || !instruction.trim()) throw new Error("No instruction provided for write.");
        if (this._avail.languageModel === "downloadable") {
            throw new Error("Local model is still downloading. Please try again shortly.");
        }
        await this.init(signal);
        return this._prompt(this._writePrompt(instruction, context), signal);
    }

    // ---- Cleanup -------------------------------------------------------------

    async destroy() {
        try {
            if (this._session?.destroy) await this._session.destroy();
        } catch {
            // Ignore
        } finally {
            this._session = null;
        }
    }
}
