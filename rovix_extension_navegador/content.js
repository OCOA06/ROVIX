// =====================================================
// ROVIX Guard - content.js
// Detecta campos de texto y muestra panel de análisis
// =====================================================

(function () {
  if (window.__rovixGuardInjected) return;
  window.__rovixGuardInjected = true;

  const state = {
    activeField: null,
    typingTimer: null,      // Timer que detecta cuando SE DEJA de escribir
    analyzeTimer: null,     // Timer para el análisis tras parar de escribir
    currentPanel: null,
    lastAnalyzedText: "",
    isAnalyzing: false,
    isTyping: false,
    lastResult: null,
    reformuladoText: "",
  };

  // Debounce: tiempo de espera tras dejar de escribir antes de analizar (ms)
  const DEBOUNCE_TYPING_MS = 1200;
  // Mínimo de caracteres para disparar análisis
  const MIN_CHARS = 10;

  // Selectores ampliados para Gmail, Outlook, WhatsApp Web, Discord, Twitter/X, etc.
  const TEXT_SELECTORS = [
    "textarea",
    'input[type="text"]',
    'input[type="search"]',
    'input[type="email"]',
    "[contenteditable='true']",
    "[contenteditable='']",
    "[contenteditable]",
    "[role='textbox']",
    "[role='combobox']",
    // Gmail compose
    "[g_editable='true']",
    ".Am.Al.editable",
    // WhatsApp Web
    "[data-tab='10']",
    "[data-testid='conversation-compose-box-input']",
    // Twitter/X
    "[data-testid='tweetTextarea_0']",
    "[data-testid='tweetTextarea_0root']",
    // Generic editors
    ".ql-editor",
    ".DraftEditor-content",
    ".public-DraftEditor-content",
    ".ProseMirror",
    "[aria-multiline='true']",
    // Outlook Web
    "[aria-label*='mensaje']",
    "[aria-label*='message']",
    "[aria-label*='Message']",
    "[aria-label*='Compose']",
    "[aria-label*='Redactar']",
  ];

  init();

  function init() {
    // Usar delegación de eventos a nivel de document para mejorar rendimiento
    // y eliminar la necesidad de un costoso MutationObserver
    document.addEventListener("focusin", handleDelegatedEvent, true);
    document.addEventListener("input", handleDelegatedEvent, true);
    document.addEventListener("keydown", handleDelegatedEvent, true);
  }

  function handleDelegatedEvent(e) {
    const target = e.target;
    if (!target || target.nodeType !== Node.ELEMENT_NODE) return;

    if (isTextField(target)) {
      if (e.type === "focusin") onFocus(target);
      else if (e.type === "keydown") onKeyDown(target);
      else if (e.type === "input") onTextInput(target);
    }
  }

  function isTextField(el) {
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const type = el.type;
      if (type === "text" || type === "search" || type === "email") return true;
    }
    if (el.isContentEditable || el.getAttribute("contenteditable") !== null) return true;
    
    try {
      for (const s of TEXT_SELECTORS) {
        if (el.matches(s)) return true;
      }
    } catch {}
    return false;
  }

  function getFieldText(field) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      return (field.innerText || field.textContent || "").trim();
    }
    return (field.value || "").trim();
  }

  function setFieldText(field, text) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      field.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
      if (!field.innerText || field.innerText.length === 0) {
        field.innerText = text;
      }
      field.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value") ||
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(field, text);
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

  function onKeyDown(field) {
    // Detectar inicio de escritura para mostrar indicador inmediatamente
    state.activeField = field;
  }

  function onTextInput(field) {
    // Verificar que el runtime siga válido antes de hacer cualquier cosa
    if (!isRuntimeValid()) return;

    state.activeField = field;

    const text = getFieldText(field);

    // Limpiar timers previos
    clearTimeout(state.typingTimer);
    clearTimeout(state.analyzeTimer);

    if (text.length < MIN_CHARS) {
      hidePanel();
      state.isTyping = false;
      return;
    }

    // Mostrar indicador de escritura activa inmediatamente
    if (!state.isTyping) {
      state.isTyping = true;
      showTypingIndicator(field);
    } else {
      positionPanel(field);
    }

    // Cuando el usuario DEJA de escribir → analizar
    state.typingTimer = setTimeout(() => {
      state.isTyping = false;
      if (text !== state.lastAnalyzedText && text.length >= MIN_CHARS) {
        analyzeField(field, text);
      }
    }, DEBOUNCE_TYPING_MS);
  }

  function isRuntimeValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  async function analyzeField(field, text) {
    if (state.isAnalyzing) return;

    // Si el contexto de la extensión ya no es válido (fue recargada), limpiar y salir
    if (!isRuntimeValid()) {
      hidePanel();
      return;
    }

    state.isAnalyzing = true;
    state.lastAnalyzedText = text;

    showLoadingPanel(field);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_TEXT",
        text: text,
      });

      if (response && response.success) {
        state.lastResult = response.data;
        renderResultPanel(field, response.data, text);
      } else {
        handleError(field, response ? response.error : "Sin respuesta");
      }
    } catch (err) {
      // Contexto invalidado: la extensión fue recargada, silenciosamente ocultar panel
      if (
        err.message &&
        (err.message.includes("Extension context invalidated") ||
         err.message.includes("context invalidated") ||
         err.message.includes("Cannot read properties of undefined"))
      ) {
        hidePanel();
        return;
      }
      // Resetear el texto analizado para que el próximo intento no sea bloqueado
      state.lastAnalyzedText = "";
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
      showErrorPanel(field, "Configura tu API Key de Gemini en el ícono de ROVIX Guard.");
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
      document.body.appendChild(panel);
    }
    return panel;
  }

  function positionPanel(field) {
    const panel = document.getElementById("rovix-guard-panel");
    if (!panel || !field) return;

    const rect = field.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    const panelWidth = 360;
    // Estimate panel height based on its classes, or use a default max
    // Since it's absolutely positioned and might not be fully rendered yet, we use a safe estimate
    const estimatedPanelHeight = panel.classList.contains('rg-state-result') ? 380 : 100;
    
    let left = rect.left + scrollX;
    
    // Evitar salirse por la derecha
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }
    if (left < 10) left = 10;

    // Decidir si va arriba o abajo basado en el espacio disponible en el viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
      // Mostrar arriba si hay poco espacio abajo y más espacio arriba
      // Calculamos el top real cuando el panel ya tiene altura,
      // pero por ahora aplicamos una clase que lo ancla al bottom relativo al top calculado
      panel.classList.add('rg-position-top');
      // Necesitamos renderizar el panel primero para saber su altura real y ajustarlo,
      // por lo que usamos el bottom de la caja para anclar si usamos la clase
      top = rect.top + scrollY - 10; // Usaremos esto como punto de anclaje base en CSS
    } else {
      // Mostrar abajo
      panel.classList.remove('rg-position-top');
      top = rect.bottom + scrollY + 10;
    }

    panel.style.left = `${left}px`;
    
    if (panel.classList.contains('rg-position-top')) {
      panel.style.top = 'auto';
      panel.style.bottom = `${window.innerHeight - top + scrollY}px`; // Distancia desde el fondo del documento
    } else {
      panel.style.top = `${top}px`;
      panel.style.bottom = 'auto';
    }
  }

  // Panel: usuario está escribiendo (pulsando teclas)
  function showTypingIndicator(field) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    panel.innerHTML = `
      <div class="rg-header">
        <div class="rg-logo">
          <span class="rg-title">ROVIX Guard</span>
        </div>
        <button class="rg-close" id="rg-close-btn">✕</button>
      </div>
      <div class="rg-typing">
        <div class="rg-typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="rg-typing-label">Monitoreando tu mensaje…</span>
      </div>
    `;

    panel.className = "rg-panel rg-visible rg-state-typing";
    positionPanel(field);
    document.getElementById("rg-close-btn")?.addEventListener("click", hidePanel);
  }

  function showLoadingPanel(field) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    panel.innerHTML = `
      <div class="rg-header">
        <div class="rg-logo">
          <span class="rg-title">ROVIX Guard</span>
        </div>
        <button class="rg-close" id="rg-close-btn">✕</button>
      </div>
      <div class="rg-loading">
        <div class="rg-spinner"></div>
        <span>Analizando mensaje con IA…</span>
      </div>
    `;

    panel.className = "rg-panel rg-visible rg-state-loading";
    positionPanel(field);
    document.getElementById("rg-close-btn")?.addEventListener("click", hidePanel);
  }

  function renderResultPanel(field, data, originalText) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    const isNocivo = data.es_nocivo;
    const riskClass = isNocivo ? "critical" : "none";
    const riskLabel = isNocivo ? "Contenido de riesgo detectado" : "Mensaje seguro y respetuoso";

    const categoriasBadges = (data.categorias_detectadas || [])
      .map((c) => `<span class="rg-badge">${c.replace(/_/g, " ")}</span>`)
      .join("");

    const fragmentosHTML =
      (data.fragmentos_problematicos || []).length > 0
        ? `<div class="rg-section">
            <div class="rg-section-title">Frases detectadas</div>
            <div class="rg-fragments">
              ${data.fragmentos_problematicos
                .map((f) => `<div class="rg-fragment">"${escapeHtml(f)}"</div>`)
                .join("")}
            </div>
          </div>`
        : "";

    const explicacionHTML =
      data.explicacion && isNocivo
        ? `<div class="rg-section">
            <div class="rg-section-title">Análisis</div>
            <div class="rg-explicacion">${escapeHtml(data.explicacion)}</div>
          </div>`
        : "";

    const showReformular =
      isNocivo &&
      data.mensaje_reformulado &&
      data.mensaje_reformulado !== originalText;

    state.reformuladoText = showReformular ? data.mensaje_reformulado : "";

    const reformularHTML = showReformular
      ? `<div class="rg-section rg-section-reformular">
          <div class="rg-section-title">Versión alternativa sugerida</div>
          <div class="rg-reformulado">${escapeHtml(data.mensaje_reformulado)}</div>
          <button class="rg-btn-apply" id="rg-apply-btn">Reemplazar mensaje con esta versión</button>
        </div>`
      : "";

    const consejoHTML = data.consejo
      ? `<div class="rg-consejo">${escapeHtml(data.consejo)}</div>`
      : "";

    panel.innerHTML = `
      <div class="rg-header">
        <div class="rg-logo">
          <span class="rg-title">ROVIX Guard</span>
        </div>
        <button class="rg-close" id="rg-close-btn">✕</button>
      </div>

      <div class="rg-risk rg-risk-${riskClass}">
        <div class="rg-risk-top">
          <span class="rg-risk-label">${riskLabel}</span>
        </div>
        ${isNocivo ? `<div class="rg-risk-bar-wrap">
          <div class="rg-risk-bar" style="width:100%"></div>
        </div>` : ''}
      </div>

      ${categoriasBadges ? `<div class="rg-badges">${categoriasBadges}</div>` : ""}
      ${explicacionHTML}
      ${fragmentosHTML}
      ${reformularHTML}
      ${consejoHTML}
    `;

    panel.className = `rg-panel rg-visible rg-state-result rg-level-${riskClass}`;
    positionPanel(field);

    document.getElementById("rg-close-btn")?.addEventListener("click", hidePanel);
    document.getElementById("rg-apply-btn")?.addEventListener("click", () => {
      if (field && state.reformuladoText) {
        setFieldText(field, state.reformuladoText);
        hidePanel();
        showToast("Mensaje reemplazado con la versión alternativa");
      }
    });
  }

  function showErrorPanel(field, message) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    panel.innerHTML = `
      <div class="rg-header">
        <div class="rg-logo">
          <span class="rg-title">ROVIX Guard</span>
        </div>
        <button class="rg-close" id="rg-close-btn">✕</button>
      </div>
      <div class="rg-error">${escapeHtml(message)}</div>
    `;

    panel.className = "rg-panel rg-visible rg-state-error";
    positionPanel(field);
    document.getElementById("rg-close-btn")?.addEventListener("click", hidePanel);
  }

  function hidePanel() {
    const panel = document.getElementById("rovix-guard-panel");
    if (panel) {
      panel.className = "rg-panel";
      setTimeout(() => {
        if (!panel.classList.contains("rg-visible")) {
          panel.innerHTML = "";
        }
      }, 350);
    }
    state.currentPanel = null;
    state.isTyping = false;
    clearTimeout(state.typingTimer);
    clearTimeout(state.analyzeTimer);
  }

  function showToast(message) {
    let toast = document.getElementById("rg-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rg-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("rg-toast-show");
    setTimeout(() => toast.classList.remove("rg-toast-show"), 3000);
  }

  // =================== HELPERS ====================

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  window.addEventListener("scroll", () => {
    if (state.activeField && state.currentPanel) positionPanel(state.activeField);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (state.activeField && state.currentPanel) positionPanel(state.activeField);
  });
})();
