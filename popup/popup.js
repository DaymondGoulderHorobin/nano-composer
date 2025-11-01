const DEFAULTS = { default_tone: "formal", target_language: "en", show_icon_on_focus: true };

const $ = (id) => document.getElementById(id);
function setStatus(s) { $("status").textContent = s || ""; }

async function load() {
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    $("default_tone").value = cfg.default_tone || "formal";
    $("target_language").value = cfg.target_language || "en";
    $("show_icon_on_focus").checked = !!cfg.show_icon_on_focus;
  });
}
async function save() {
  const cfg = {
    default_tone: $("default_tone").value,
    target_language: $("target_language").value || "en",
    show_icon_on_focus: $("show_icon_on_focus").checked,
  };
  chrome.storage.sync.set(cfg, () => setStatus("Saved"));
}

async function warmup() {
  setStatus("Warming up...");
  chrome.runtime.sendMessage({ action: "warmup" }, (res) => {
    const err = chrome.runtime.lastError;
    if (err) return setStatus(err.message || "Error");
    if (!res || !res.success) return setStatus((res && res.error) || "Warmup failed");
    setStatus("Warmup requested");
  });
}

async function check() {
  setStatus("Checking...");
  chrome.runtime.sendMessage({ action: "availability" }, (res) => {
    const err = chrome.runtime.lastError;
    if (err) return setStatus(err.message || "Error");
    if (!res || !res.success) return setStatus((res && res.error) || "Check failed");
    const a = res.availability || res.result || {};
    setStatus(`Writer: ${a.writer || "unknown"} | Rewriter: ${a.rewriter || "unknown"}`);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  $("save").addEventListener("click", save);
  $("warmup").addEventListener("click", warmup);
  $("check").addEventListener("click", check);
});
