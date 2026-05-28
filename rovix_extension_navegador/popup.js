// =====================================================
// ROVIX Guard - popup.js
// Lógica del popup de configuración
// =====================================================

const elements = {
  toggle: document.getElementById("toggle-enabled"),
  statusDot: document.getElementById("status-dot"),
  statusText: document.getElementById("status-text"),
  apiInput: document.getElementById("api-key-input"),
  saveBtn: document.getElementById("save-btn"),
  toggleVisibility: document.getElementById("toggle-visibility"),
  toast: document.getElementById("popup-toast"),
};

// Cargar configuración guardada
chrome.storage.sync.get(["apiKey", "extensionEnabled"], (data) => {
  const enabled = data.extensionEnabled !== false; // true por defecto
  const apiKey = data.apiKey || "";

  elements.toggle.checked = enabled;
  elements.apiInput.value = apiKey;

  updateStatus(enabled, apiKey);
});

// Toggle ON/OFF
elements.toggle.addEventListener("change", () => {
  const enabled = elements.toggle.checked;
  chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
    chrome.storage.sync.get(["apiKey"], (data) => {
      updateStatus(enabled, data.apiKey || "");
    });
    showToast(enabled ? "✅ ROVIX Guard activado" : "⏸️ ROVIX Guard desactivado");
  });
});

// Guardar API Key
elements.saveBtn.addEventListener("click", () => {
  const key = elements.apiInput.value.trim();

  if (!key) {
    showToast("⚠️ Ingresa una API Key válida");
    elements.apiInput.style.borderColor = "rgba(239,68,68,0.5)";
    setTimeout(() => elements.apiInput.style.borderColor = "", 2000);
    return;
  }

  if (!key.startsWith("AIza")) {
    showToast("⚠️ La clave debe comenzar con 'AIza'");
    elements.apiInput.style.borderColor = "rgba(239,68,68,0.5)";
    setTimeout(() => elements.apiInput.style.borderColor = "", 2000);
    return;
  }

  elements.saveBtn.textContent = "Guardando...";
  elements.saveBtn.disabled = true;

  chrome.storage.sync.set({ apiKey: key }, () => {
    elements.saveBtn.textContent = "Guardar API Key";
    elements.saveBtn.disabled = false;
    const enabled = elements.toggle.checked;
    updateStatus(enabled, key);
    showToast("✅ API Key guardada correctamente");
  });
});

// Mostrar/ocultar API Key
elements.toggleVisibility.addEventListener("click", () => {
  const isPassword = elements.apiInput.type === "password";
  elements.apiInput.type = isPassword ? "text" : "password";
  elements.toggleVisibility.textContent = isPassword ? "🙈" : "👁";
});

// Validar al escribir
elements.apiInput.addEventListener("input", () => {
  elements.apiInput.style.borderColor = "";
});

function updateStatus(enabled, apiKey) {
  const dot = elements.statusDot;
  const text = elements.statusText;

  dot.className = "status-dot";

  if (!enabled) {
    dot.classList.add("inactive");
    text.textContent = "Extensión desactivada";
    return;
  }

  if (!apiKey || !apiKey.startsWith("AIza")) {
    dot.classList.add("warning");
    text.textContent = "Falta configurar API Key";
    return;
  }

  dot.classList.add("active");
  text.textContent = "Activo — monitoreando todos los sitios";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2500);
}

// Abrir link de API Key con target _blank seguro
document.getElementById("get-key-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://aistudio.google.com/apikey" });
});
