// =====================================================
// ROVIX Guard - popup.js
// Sin API Key — análisis 100% local
// =====================================================

const elements = {
  toggle: document.getElementById("toggle-enabled"),
  statusDot: document.getElementById("status-dot"),
  statusText: document.getElementById("status-text"),
  toast: document.getElementById("popup-toast"),
};

// Cargar configuración guardada
chrome.storage.sync.get(["extensionEnabled"], (data) => {
  const enabled = data.extensionEnabled !== false; // true por defecto
  elements.toggle.checked = enabled;
  updateStatus(enabled);
});

// Toggle ON/OFF
elements.toggle.addEventListener("change", () => {
  const enabled = elements.toggle.checked;
  chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
    updateStatus(enabled);
    showToast(enabled ? "ROVIX Guard activado" : "ROVIX Guard desactivado");
  });
});

function updateStatus(enabled) {
  const dot = elements.statusDot;
  const text = elements.statusText;

  dot.className = "status-dot";

  if (!enabled) {
    dot.classList.add("inactive");
    text.textContent = "Extensión desactivada";
    return;
  }

  dot.classList.add("active");
  text.textContent = "Activo — protegiendo en tiempo real";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2500);
}
