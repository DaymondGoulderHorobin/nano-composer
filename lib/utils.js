/**
 * Utility functions for Nano Composer
 * Shared helpers used across content scripts and background
 */

/**
 * Debounce function - limits how often a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
// Debounce function
//
// Limits how often a function can fire by waiting the provided
// interval after the last call before invoking the underlying
// function. Useful for reducing noise from high‑frequency events like
// keystrokes or scrolls.
//
// @param {Function} func - Function to debounce
// @param {number} wait - Milliseconds to wait
// @returns {Function} - Debounced function
export function debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function - ensures function runs at most once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds between calls
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 300) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}


/**
 * Send message to background service worker
 * @param {string} action - Action to perform
 * @param {object} data - Data to send
 * @returns {Promise} - Response from background
 */
export async function sendToBackground(action, data = {}) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action, data },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!response) {
                    reject(new Error("No response from background worker"));
                } else if (response.success === false) {
                    reject(new Error(response.error || "Unknown error"));
                } else {
                    resolve(response);
                }
            }
        );
    });
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
    return `nano-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - DOM element
 * @returns {boolean} - True if visible
 */
export function isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.width > 0 &&
        rect.height > 0
    );
}

/**
 * Get element's position relative to viewport
 * @param {Element} element - DOM element
 * @returns {object} - {top, left, width, height}
 */
export function getElementPosition(element) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX
    };
}

/**
 * Check if element is a text input field
 * @param {Element} element - DOM element
 * @returns {boolean} - True if text input
 */
export function isTextInput(element) {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();

    // Check for textarea
    if (tagName === 'textarea') return true;

    // Check for text input
    if (tagName === 'input') {
        const type = element.type?.toLowerCase();
        const textTypes = ['text', 'email', 'search', 'url', 'tel'];
        return !type || textTypes.includes(type);
    }

    // Check for contenteditable
    if (element.contentEditable === 'true') return true;

    // Check for role=textbox
    if (element.getAttribute('role') === 'textbox') return true;

    return false;
}

/**
 * Get text from various types of input fields
 * @param {Element} element - Input element
 * @returns {string} - Text content
 */
export function getTextFromField(element) {
    if (!element) return '';

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
        return element.value || '';
    }

    if (element.contentEditable === 'true') {
        return element.innerText || element.textContent || '';
    }

    return '';
}

/**
 * Set text in various types of input fields
 * @param {Element} element - Input element
 * @param {string} text - Text to set
 */
export function setTextInField(element, text) {
    if (!element) return;

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
        element.value = text;

        // Trigger input events for frameworks
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    else if (element.contentEditable === 'true') {
        element.innerText = text;

        // Trigger input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

/**
 * Check if field has enough text to be worth showing icon
 * @param {Element} element - Input element
 * @returns {boolean} - True if field is large enough
 */
export function isFieldLargeEnough(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();

    // Minimum size requirements (in pixels)
    const minWidth = 100;
    const minHeight = 40;

    return rect.width >= minWidth && rect.height >= minHeight;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
}

/**
 * Check if two rectangles overlap
 * @param {object} rect1 - First rectangle
 * @param {object} rect2 - Second rectangle
 * @returns {boolean} - True if overlapping
 */
export function rectanglesOverlap(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Resolves after delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if element is inside iframe
 * @param {Element} element - DOM element
 * @returns {boolean} - True if in iframe
 */
export function isInIframe(element) {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * Get settings from storage
 * @returns {Promise<object>} - Settings object
 */
export async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            {
                enabled: true,
                show_icon: true,
                default_tone: 'formal',
                hotkey_enabled: true,
                preferred_language: 'en'
            },
            (settings) => {
                resolve(settings);
            }
        );
    });
}

/**
 * Save settings to storage
 * @param {object} settings - Settings to save
 * @returns {Promise} - Resolves when saved
 */
export async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

/**
 * Log with timestamp (for debugging)
 * @param {string} message - Message to log
 * @param {any} data - Optional data to log
 */
export function log(message, data = null) {
    const timestamp = new Date().toISOString().substr(11, 12);
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

/**
 * Check if Chrome Built-in AI is available
 * @returns {Promise<object>} - Availability status for each API
 */
export async function checkAIAvailability() {
    const availability = {
        hasAny: false,
        LanguageModel: false,
        Rewriter: false,
        Writer: false,
        Proofreader: false,
    };

    try {
        // Check Rewriter
        if (typeof Rewriter !== "undefined") {
            try {
                const a = await Rewriter.availability({
                    expectedInputLanguages: ["en"],
                    outputLanguage: "en",
                });
                availability.Rewriter = (a === "available");
                if (availability.Rewriter) availability.hasAny = true;
            } catch { }
        }

        // Check Writer
        if (typeof Writer !== "undefined") {
            try {
                const a = await Writer.availability({
                    expectedInputLanguages: ["en"],
                    outputLanguage: "en",
                });
                availability.Writer = (a === "available");
                if (availability.Writer) availability.hasAny = true;
            } catch { }
        }

        // Check Proofreader
        if (typeof Proofreader !== "undefined") {
            try {
                const a = await Proofreader.availability({
                    expectedInputLanguages: ["en"],
                    outputLanguage: "en",
                });
                availability.Proofreader = (a === "available");
                if (availability.Proofreader) availability.hasAny = true;
            } catch { }
        }

        // Check LanguageModel
        if (typeof LanguageModel !== "undefined") {
            try {
                const a = await LanguageModel.availability({
                    expectedInputs: [{ type: "text", languages: ["en"] }],
                    expectedOutputs: [{ type: "text", languages: ["en"] }],
                });
                availability.LanguageModel = (a === "available" || a === "downloadable");
                if (availability.LanguageModel) availability.hasAny = true;
            } catch { }
        }

        return availability;
    } catch (error) {
        console.error("Error checking AI availability:", error);
        return availability;
    }
}

/**
 * Create an AbortSignal with timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {AbortSignal} - Signal that aborts after timeout
 */
export function timeoutSignal(ms) {
    if (AbortSignal && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(ms);
    }
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort("timeout"), ms);
    return ctrl.signal;
}

/**
 * Retry a promise function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms (will be multiplied exponentially)
 * @returns {Promise} - Result of function or throws last error
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on certain errors
            if (error.message?.includes("unavailable") ||
                error.message?.includes("not present")) {
                throw error;
            }

            // Don't sleep on last retry
            if (i < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, i);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

export default {
    debounce,
    throttle,
    sendToBackground,
    generateId,
    isElementVisible,
    getElementPosition,
    isTextInput,
    getTextFromField,
    setTextInField,
    isFieldLargeEnough,
    escapeHtml,
    truncateText,
    rectanglesOverlap,
    sleep,
    isInIframe,
    getSettings,
    saveSettings,
    log,
    timeoutSignal,
    checkAIAvailability,
    retryWithBackoff
};