/**
 * ROVIX Guard - content.js
 * 
 * Script de contenido (Content Script) inyectado automáticamente en cada pestaña web abierta.
 * Escucha las interacciones del usuario en campos de texto, detecta patrones de escritura,
 * se comunica asíncronamente con el Service Worker (background.js) para analizar la toxicidad,
 * y dibuja un panel flotante dinámico con alertas de ciberacoso y alternativas asertivas.
 */

(function () {
  // Evita inyecciones duplicadas del mismo script en la misma página web
  if (window.__rovixGuardInjected) return;
  window.__rovixGuardInjected = true;

  // ============================================================================
  // ESTADO DE CONFIGURACIÓN Y MONITOREO LOCAL
  // ============================================================================
  const state = {
    activeField: null,      // Elemento del DOM (input, textarea, div contenteditable) enfocado actualmente
    typingTimer: null,      // Temporizador que se dispara cuando el usuario detiene la escritura (debounce)
    analyzeTimer: null,     // Temporizador para controlar el flujo de análisis
    currentPanel: null,     // Referencia al panel flotante de interfaz de usuario insertado en la página
    lastAnalyzedText: "",   // Almacena el último bloque de texto analizado con éxito para evitar llamadas repetidas
    isAnalyzing: false,     // Bandera para evitar llamadas concurrentes a la API local
    isTyping: false,        // Bandera que determina si el usuario se encuentra pulsando teclas activamente
    lastResult: null,       // Almacena el último reporte diagnóstico de ciberacoso recibido
    reformuladoText: "",    // Almacena la propuesta de texto reformulada
  };

  // Tiempo de espera (en milisegundos) tras dejar de escribir antes de iniciar el análisis automático
  const DEBOUNCE_TYPING_MS = 1200;
  // Cantidad mínima de caracteres que debe tener el texto para disparar el motor heurístico
  const MIN_CHARS = 10;

  // ============================================================================
  // SELECTORES EXTENSOS DE CAMPOS DE TEXTO (REDES SOCIALES Y CORREOS)
  // ============================================================================
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
    // Compose en Gmail
    "[g_editable='true']",
    ".Am.Al.editable",
    // Entrada de texto de WhatsApp Web
    "[data-tab='10']",
    "[data-testid='conversation-compose-box-input']",
    // Textarea en Twitter / X
    "[data-testid='tweetTextarea_0']",
    "[data-testid='tweetTextarea_0root']",
    // Editores enriquecidos genéricos
    ".ql-editor",
    ".DraftEditor-content",
    ".public-DraftEditor-content",
    ".ProseMirror",
    "[aria-multiline='true']",
    // Compose en Outlook Web
    "[aria-label*='mensaje']",
    "[aria-label*='message']",
    "[aria-label*='Message']",
    "[aria-label*='Compose']",
    "[aria-label*='Redactar']",
  ];

  // Inicia la escucha activa
  init();

  // ============================================================================
  // INICIALIZACIÓN Y DELEGACIÓN EFICIENTE DE EVENTOS
  // ============================================================================
  
  /**
   * Registra escuchas delegadas en el nodo principal (document).
   * Al usar delegación de eventos, se evitan inyecciones y monitoreos costosos (como MutationObservers),
   * garantizando compatibilidad dinámica con elementos creados bajo demanda por React, Angular o Vue.
   */
  function init() {
    document.addEventListener("focusin", handleDelegatedEvent, true);
    document.addEventListener("input", handleDelegatedEvent, true);
    document.addEventListener("keydown", handleDelegatedEvent, true);
  }

  /**
   * Concentra y delega los eventos interceptados. Valida si el elemento disparador
   * corresponde a un campo de texto interactivo antes de invocar la lógica específica.
   */
  function handleDelegatedEvent(e) {
    const target = e.target;
    if (!target || target.nodeType !== Node.ELEMENT_NODE) return;

    if (isTextField(target)) {
      if (e.type === "focusin") onFocus(target);
      else if (e.type === "keydown") onKeyDown(target);
      else if (e.type === "input") onTextInput(target);
    }
  }

  /**
   * Determina rigurosamente si un elemento del DOM es un campo de entrada de texto.
   * @param {HTMLElement} el - Elemento del DOM a evaluar.
   * @returns {boolean} True si es un editor de texto.
   */
  function isTextField(el) {
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const type = el.type;
      if (type === "text" || type === "search" || type === "email") return true;
    }
    // Detecta editores con formato enriquecido basados en contenteditable
    if (el.isContentEditable || el.getAttribute("contenteditable") !== null) return true;
    
    // Contramedida: Compara contra selectores específicos de plataformas populares
    try {
      for (const s of TEXT_SELECTORS) {
        if (el.matches(s)) return true;
      }
    } catch {}
    return false;
  }

  // ============================================================================
  // UTILIDADES DE ACCESO DIRECTO AL CONTENIDO DE EDITORES
  // ============================================================================

  /**
   * Extrae limpiamente el texto contenido en un campo, diferenciando elementos nativos de contenteditables.
   */
  function getFieldText(field) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      return (field.innerText || field.textContent || "").trim();
    }
    return (field.value || "").trim();
  }

  /**
   * Sobrescribe de forma robusta el texto de un editor, simulando eventos nativos para 
   * que las librerías de frontend (como React o Vue) sincronicen correctamente sus estados internos.
   */
  function setFieldText(field, text) {
    if (field.isContentEditable || field.getAttribute("contenteditable") !== null) {
      field.focus();
      // Borra la selección actual e inserta el texto asertivo
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
      if (!field.innerText || field.innerText.length === 0) {
        field.innerText = text;
      }
      field.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      // Intenta usar los descriptores de propiedades nativos de HTML para evadir envolturas de React
      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value") ||
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(field, text);
      } else {
        field.value = text;
      }
      // Dispara eventos para forzar la actualización de bindings del lado del sitio web
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ============================================================================
  // MANEJADORES DE CICLO DE VIDA DE ESCRITURA
  // ============================================================================

  function onFocus(field) {
    state.activeField = field;
  }

  function onKeyDown(field) {
    state.activeField = field;
  }

  /**
   * Captura cada tecla pulsada. Controla la visualización del indicador de análisis
   * y administra el debounce (retraso) para procesar el contenido una vez finalizada la escritura.
   */
  function onTextInput(field) {
    // Si el contexto de la extensión ha sido destruido o recargado, detiene la ejecución
    if (!isRuntimeValid()) return;

    state.activeField = field;
    const text = getFieldText(field);

    // Limpia los temporizadores acumulados para posponer el análisis
    clearTimeout(state.typingTimer);
    clearTimeout(state.analyzeTimer);

    // Si el texto es inferior al mínimo, borra los paneles flotantes activos
    if (text.length < MIN_CHARS) {
      hidePanel();
      state.isTyping = false;
      return;
    }

    // Si no está marcada la bandera de escritura activa, dibuja inmediatamente el indicador
    if (!state.isTyping) {
      state.isTyping = true;
      showTypingIndicator(field);
    } else {
      positionPanel(field);
    }

    // Configura el temporizador: analiza el texto tras un periodo de inactividad de escritura (debounce)
    state.typingTimer = setTimeout(() => {
      state.isTyping = false;
      if (text !== state.lastAnalyzedText && text.length >= MIN_CHARS) {
        analyzeField(field, text);
      }
    }, DEBOUNCE_TYPING_MS);
  }

  /**
   * Comprueba que la API del runtime de Chrome siga estando disponible y en estado activo.
   */
  function isRuntimeValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Envía asíncronamente el texto del campo al Service Worker de fondo para su evaluación léxica.
   */
  async function analyzeField(field, text) {
    if (state.isAnalyzing) return;

    if (!isRuntimeValid()) {
      hidePanel();
      return;
    }

    state.isAnalyzing = true;
    state.lastAnalyzedText = text;

    showLoadingPanel(field);

    try {
      // Envía solicitud asíncrona a background.js
      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_TEXT",
        text: text,
      });

      if (response && response.success) {
        state.lastResult = response.data;
        // Dibuja el panel con los resultados, alertas o felicitaciones correspondientes
        renderResultPanel(field, response.data, text);
      } else {
        handleError(field, response ? response.error : "Sin respuesta");
      }
    } catch (err) {
      // Limpieza silenciosa si el contexto de la extensión se invalidó por recarga del navegador
      if (
        err.message &&
        (err.message.includes("Extension context invalidated") ||
         err.message.includes("context invalidated") ||
         err.message.includes("Cannot read properties of undefined"))
      ) {
        hidePanel();
        return;
      }
      state.lastAnalyzedText = "";
      handleError(field, err.message);
    } finally {
      state.isAnalyzing = false;
    }
  }

  /**
   * Administra la visualización de mensajes de error de forma estética.
   */
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

  // ============================================================================
  // COMPONENTES Y RENDERIZADO VISUAL DEL PANEL FLOTANTE
  // ============================================================================

  /**
   * Obtiene o crea e inserta en el cuerpo del documento (body) el contenedor del panel flotante.
   */
  function getOrCreatePanel() {
    let panel = document.getElementById("rovix-guard-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "rovix-guard-panel";
      document.body.appendChild(panel);
    }
    return panel;
  }

  /**
   * Posiciona dinámicamente el panel flotante en la pantalla, ubicándolo arriba o abajo 
   * del elemento enfocado, esquivando desbordamientos fuera de los límites del navegador.
   * @param {HTMLElement} field - Elemento de entrada enfocado.
   */
  function positionPanel(field) {
    const panel = document.getElementById("rovix-guard-panel");
    if (!panel || !field) return;

    const rect = field.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    const panelWidth = 360;
    const estimatedPanelHeight = panel.classList.contains('rg-state-result') ? 380 : 100;
    
    let left = rect.left + scrollX;
    
    // Evita desbordamiento horizontal en el borde derecho
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }
    if (left < 10) left = 10;

    // Determina el espacio disponible arriba y abajo del input en el viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
      // Posiciona el panel ARRIBA del input si no cabe abajo y arriba hay mayor margen
      panel.classList.add('rg-position-top');
      top = rect.top + scrollY - 10;
    } else {
      // Posiciona el panel ABAJO por defecto
      panel.classList.remove('rg-position-top');
      top = rect.bottom + scrollY + 10;
    }

    panel.style.left = `${left}px`;
    
    if (panel.classList.contains('rg-position-top')) {
      panel.style.top = 'auto';
      panel.style.bottom = `${window.innerHeight - top + scrollY}px`;
    } else {
      panel.style.top = `${top}px`;
      panel.style.bottom = 'auto';
    }
  }

  /**
   * Renderiza el estado de carga inicial indicando monitoreo activo al presionar teclas.
   */
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

  /**
   * Renderiza el estado de carga activa al realizar la consulta asíncrona de ciberacoso.
   */
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

  /**
   * Construye el contenido del panel visualizando el dictamen de toxicidad (nocivo/seguro),
   * los fragmentos detonantes detectados, explicaciones y la propuesta asertiva alternativa.
   */
  function renderResultPanel(field, data, originalText) {
    const panel = getOrCreatePanel();
    state.currentPanel = panel;

    const isNocivo = data.es_nocivo;
    const riskClass = isNocivo ? "critical" : "none";
    const riskLabel = isNocivo ? "Contenido de riesgo detectado" : "Mensaje seguro y respetuoso";

    // Genera etiquetas HTML con las categorías hostiles encontradas
    const categoriasBadges = (data.categorias_detectadas || [])
      .map((c) => `<span class="rg-badge">${c.replace(/_/g, " ")}</span>`)
      .join("");

    // Genera la sección visual de fragmentos detonantes
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

    // Genera la sección explicativa
    const explicacionHTML =
      data.explicacion && isNocivo
        ? `<div class="rg-section">
            <div class="rg-section-title">Análisis</div>
            <div class="rg-explicacion">${escapeHtml(data.explicacion)}</div>
          </div>`
        : "";

    // Valida si debe ofrecerse el reemplazo dinámico por la versión constructiva
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

    // Dibuja la estructura interna del panel flotante
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

    // Registra eventos para botones interactivos del panel
    document.getElementById("rg-close-btn")?.addEventListener("click", hidePanel);
    document.getElementById("rg-apply-btn")?.addEventListener("click", () => {
      if (field && state.reformuladoText) {
        // Ejecuta el reemplazo asertivo e informa al usuario
        setFieldText(field, state.reformuladoText);
        hidePanel();
        showToast("Mensaje reemplazado con la versión alternativa");
      }
    });
  }

  /**
   * Dibuja un panel conteniendo un reporte de error técnico.
   */
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

  /**
   * Oculta el panel flotante y resetea las variables de temporización.
   */
  function hidePanel() {
    const panel = document.getElementById("rovix-guard-panel");
    if (panel) {
      panel.className = "rg-panel";
      // Espera a que termine la animación CSS para vaciar el contenido
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

  /**
   * Dibuja una alerta temporal (toast) en pantalla con confirmación de acciones.
   */
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

  // ============================================================================
  // MÉTODOS DE SOPORTE Y ESCUCHAS SECUNDARIAS
  // ============================================================================

  /**
   * Codifica caracteres de texto para impedir inyecciones de código HTML malicioso.
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Recalcula la posición del panel flotante en caso de scroll o redimensionamiento
  window.addEventListener("scroll", () => {
    if (state.activeField && state.currentPanel) positionPanel(state.activeField);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (state.activeField && state.currentPanel) positionPanel(state.activeField);
  });
})();
