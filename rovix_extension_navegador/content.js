// =====================================================
// ROVIX Guard - content.js
// Detecta campos de texto y muestra panel de análisis
// =====================================================

(function () {
  if (window.__rovixGuardInjected) return;
  window.__rovixGuardInjected = true;

  // Estado global del content script
  const state = {
    activeField: null,
    debounceTimer: null,
    currentPanel: null,
    lastAnalyzedText: "",
    isAnalyzing: false,
    lastResult: null,
  };

  // Selectores de campos de texto a monitorear
  const TEXT_SELECTORS = [
    "textarea",
    'input[type="text"]',
    'input[type="search"]',
    'input[type="email"]',
    "[contenteditable='true']",
    "[contenteditable='']",
    "[role='textbox']",
    "[data-testid='tweetTextarea_0']",
    ".ql-editor",
    ".DraftEditor-content",
    ".public-DraftEditor-content",
  ];

  // Inicialización
  init();

  function init() {
    attachListeners(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            attachListeners(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function attachListeners(root) {
    const fields = getTextFields(root);
    fields.forEach((field) => {
      if (field.__rovixAttached) return;
      field.__rovixAttached = true;

      field.addEventListener("input", () => onTextInput(field));
      field.addEventListener("focus", () => onFocus(field));
      field.addEventListener("blur", () => onBlur());
    });
  }

  function getTextFields(root) {
    const results = [];
    try {
      if (root.matches && TEXT_SELECTORS.some((s) => root.matches(s))) {
        results.push(root);
      }
      TEXT_SELECTORS.forEach((selector) => {
        root.querySelectorAll && root.querySelectorAll(selector).forEach((el) => {
          if (!results.includes(el)) results.push(el);
        });
      });
    } catch {}
    return results;
  }

  function getFieldText(field) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      return field.innerText || field.textContent || "";
    }
    return field.value || "";
  }

  function setFieldText(field, text) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      field.innerText = text;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ) || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");

      if (nativeInputValueSetter && nativeInputValueSetter.set) {
        nativeInputValueSetter.set.call(field, text);
      } else {
        field.value = text;
      }
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function onFocus(field) {
    state.activeField = field;
  }

  function onBlur() {
    setTimeout(() => {
      if (!document.activeElement || !isTextField(document.activeElement)) {
        // No ocultar si el usuario clickeó el panel
        if (state.currentPanel && !state.currentPanel.contains(document.activeElement)) {
          // Mantener panel visible un momento antes de ocultarlo
        }
      }
    }, 300);
  }

  function isTextField(el) {
    return TEXT_SELECTORS.some((s) => {
      try { return el.matches(s); } catch { return false; }
    });
  }

  function onTextInput(field) {
    state.activeField = field;
    clearTimeout(state.debounceTimer);

    const text = getFieldText(field).trim();
    if (text.length < 5) {
      hidePanel();
      return;
    }

    state.debounceTimer = setTimeout(() => {
      if (text !== state.lastAnalyzedText) {
        analyzeField(field, text);
      }
    }, 1500);
  }

  async function analyzeField(field, text) {
    if (state.isAnalyzing) return;
    state.isAnalyzing = true;
    state.lastAnalyzedText = text;

    showLoadingPanel(field);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_TEXT",
        text: text,
      });

      if (response.success) {
        state.lastResult = response.data;
        renderResultPanel(field, response.data, text);
      } else {
        handleError(field, response.error);
      }
    } catch (err) {
      handleError(field, err.message);
    } finally {
      state.isAnalyzing = false;
    }
  }

  function handleError(field, errorMsg) {
    if (errorMsg === "EXTENSION_DISABLED") {
      hidePanel();
      return;
    }
    if (errorMsg === "NO_API_KEY") {
      showErrorPanel(field, "⚠️ Configura tu API Key de Gemini en el ícono de ROVIX Guard.");
      return;
    }
    showErrorPanel(field, `Error al analizar: ${errorMsg}`);
  }

  // =================== PANEL UI ====================

  function getOrCreatePanel() {
    let panel = document.getElementById("rovix-guard-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "rovix-guard-panel";
      panel.className = "rovix-panel";
      document.body.appendChild(panel);
    }
    return panel;
  }

  function positionPanel(field) {
    const panel = document.getElementById("rovix-guard-panel");
    if (!panel) return;

    const rect = field.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;

    const panelWidth = 360;
    if (left + panelWidth > window.innerWidth - 20) {
      left = window.innerWidth - panelWidth - 20;
    }
    if (left < 10) left = 10;

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.width = `${Math.min(panelWidth, rect.width || panelWidth)}px`;
  }

  function showLoadingPanel(field) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    panel.innerHTML = `
      <div class="rovix-header">
        <span class="rovix-logo">🛡️ ROVIX Guard</span>
        <button class="rovix-close" id="rovix-close-btn">✕</button>
      </div>
      <div class="rovix-loading">
        <div class="rovix-spinner"></div>
        <span>Analizando mensaje...</span>
      </div>
    `;
    panel.className = "rovix-panel rovix-visible";
    positionPanel(field);

    document.getElementById("rovix-close-btn")?.addEventListener("click", hidePanel);
  }

  function renderResultPanel(field, data, originalText) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    const riskClass = getRiskClass(data.nivel_riesgo);
    const riskIcon = getRiskIcon(data.nivel_riesgo);
    const riskLabel = getRiskLabel(data.nivel_riesgo);

    const categoriasBadges = (data.categorias_detectadas || [])
      .map(c => `<span class="rovix-badge">${c.replace(/_/g, " ")}</span>`)
      .join("");

    const fragmentosHTML = (data.fragmentos_problematicos || []).length > 0
      ? `<div class="rovix-section">
          <div class="rovix-section-title">🔍 Frases problemáticas</div>
          ${data.fragmentos_problematicos.map(f => `<div class="rovix-fragment">"${f}"</div>`).join("")}
        </div>`
      : "";

    const consejoHTML = data.consejo
      ? `<div class="rovix-consejo">💡 ${data.consejo}</div>`
      : "";

    const reformularHTML = data.nivel_riesgo !== "NINGUNO" && data.mensaje_reformulado && data.mensaje_reformulado !== originalText
      ? `<div class="rovix-section">
          <div class="rovix-section-title">✨ Alternativa sugerida</div>
          <div class="rovix-reformulado">${escapeHtml(data.mensaje_reformulado)}</div>
          <button class="rovix-btn-reformular" id="rovix-apply-btn">Aplicar esta versión</button>
        </div>`
      : "";

    panel.innerHTML = `
      <div class="rovix-header">
        <span class="rovix-logo">🛡️ ROVIX Guard</span>
        <button class="rovix-close" id="rovix-close-btn">✕</button>
      </div>

      <div class="rovix-risk ${riskClass}">
        <span class="rovix-risk-icon">${riskIcon}</span>
        <div class="rovix-risk-info">
          <div class="rovix-risk-label">${riskLabel}</div>
          <div class="rovix-risk-bar-wrap">
            <div class="rovix-risk-bar" style="width: ${data.puntuacion}%"></div>
          </div>
        </div>
        <span class="rovix-risk-score">${data.puntuacion}/100</span>
      </div>

      ${categoriasBadges ? `<div class="rovix-badges">${categoriasBadges}</div>` : ""}

      ${data.explicacion && data.nivel_riesgo !== "NINGUNO" ? `
        <div class="rovix-section">
          <div class="rovix-section-title">📋 Análisis</div>
          <div class="rovix-explicacion">${escapeHtml(data.explicacion)}</div>
        </div>` : ""}

      ${fragmentosHTML}
      ${reformularHTML}
      ${consejoHTML}
    `;

    panel.className = `rovix-panel rovix-visible rovix-panel-${riskClass}`;
    positionPanel(field);

    document.getElementById("rovix-close-btn")?.addEventListener("click", hidePanel);
    document.getElementById("rovix-apply-btn")?.addEventListener("click", () => {
      if (field && data.mensaje_reformulado) {
        setFieldText(field, data.mensaje_reformulado);
        hidePanel();
        showToast("✅ Mensaje actualizado con la versión mejorada");
      }
    });
  }

  function showErrorPanel(field, message) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    panel.innerHTML = `
      <div class="rovix-header">
        <span class="rovix-logo">🛡️ ROVIX Guard</span>
        <button class="rovix-close" id="rovix-close-btn">✕</button>
      </div>
      <div class="rovix-error">${message}</div>
    `;
    panel.className = "rovix-panel rovix-visible";
    positionPanel(field);
    document.getElementById("rovix-close-btn")?.addEventListener("click", hidePanel);
  }

  function hidePanel() {
    const panel = document.getElementById("rovix-guard-panel");
    if (panel) {
      panel.className = "rovix-panel";
      setTimeout(() => {
        if (!panel.classList.contains("rovix-visible")) {
          panel.innerHTML = "";
        }
      }, 400);
    }
    state.currentPanel = null;
  }

  function showToast(message) {
    let toast = document.getElementById("rovix-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rovix-toast";
      toast.className = "rovix-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("rovix-toast-show");
    setTimeout(() => toast.classList.remove("rovix-toast-show"), 3000);
  }

  // =================== HELPERS ====================

  function getRiskClass(nivel) {
    return { NINGUNO: "none", BAJO: "low", MEDIO: "medium", ALTO: "high", CRITICO: "critical" }[nivel] || "none";
  }

  function getRiskIcon(nivel) {
    return { NINGUNO: "✅", BAJO: "🟡", MEDIO: "🟠", ALTO: "🔴", CRITICO: "🚨" }[nivel] || "✅";
  }

  function getRiskLabel(nivel) {
    return { NINGUNO: "Sin riesgo detectado", BAJO: "Riesgo bajo", MEDIO: "Riesgo moderado", ALTO: "Alto riesgo", CRITICO: "⚠️ Contenido crítico" }[nivel] || "Sin riesgo";
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Reposicionar panel al hacer scroll
  window.addEventListener("scroll", () => {
    if (state.activeField && state.currentPanel) {
      positionPanel(state.activeField);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (state.activeField && state.currentPanel) {
      positionPanel(state.activeField);
    }
  });
})();
