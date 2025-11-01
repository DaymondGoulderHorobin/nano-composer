const DEFAULTS = { default_tone: "formal", target_language: "en", show_icon_on_focus: true };

const $ = (id) => document.getElementById(id);
function setStatus(s) {
  let out = document.getElementById("status");
  if (!out) {
    out = document.createElement("output");
    out.id = "status";
    document.querySelector(".wrap").appendChild(out);
  }
  out.textContent = s || "";
}

function load() {
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    $("default_tone").value = cfg.default_tone || "formal";
    $("target_language").value = cfg.target_language || "en";
    $("show_icon_on_focus").checked = !!cfg.show_icon_on_focus;
  });
}

function save() {
  const cfg = {
    default_tone: $("default_tone").value,
    target_language: $("target_language").value || "en",
    show_icon_on_focus: $("show_icon_on_focus").checked,
  };
  chrome.storage.sync.set(cfg, () => setStatus("Saved"));
}

function resetAll() {
  chrome.storage.sync.set(DEFAULTS, () => {
    load(); setStatus("Reset to defaults");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  $("save").addEventListener("click", save);
  $("reset").addEventListener("click", resetAll);
});
