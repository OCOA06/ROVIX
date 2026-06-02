/**
 * ROVIX Guard - popup.js
 * 
 * Controlador de la interfaz gráfica del menú emergente (popup) de la extensión.
 * Administra el estado de activación global de la protección local (ON/OFF),
 * persistiendo la configuración del usuario a través del almacenamiento sincronizado
 * de Chrome y actualizando dinámicamente los estilos visuales.
 */

// ============================================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ============================================================================
const elements = {
  toggle: document.getElementById("toggle-enabled"),   // Interruptor (checkbox) para activar/desactivar la protección
  statusDot: document.getElementById("status-dot"),     // Indicador visual luminoso de estado (verde/gris)
  statusText: document.getElementById("status-text"),   // Texto descriptivo del estado operacional
  toast: document.getElementById("popup-toast"),        // Notificación emergente temporal en el popup
};

// ============================================================================
// CARGA INICIAL DE LA CONFIGURACIÓN PERSISTIDA
// ============================================================================
// Consulta el estado de activación en el almacenamiento sincronizado de Chrome.
// Si no se encuentra un valor guardado anteriormente, se asume activo (true) por defecto.
chrome.storage.sync.get(["extensionEnabled"], (data) => {
  const enabled = data.extensionEnabled !== false; // Activo por defecto
  elements.toggle.checked = enabled;
  updateStatus(enabled);
});

// ============================================================================
// CONTROLADOR DE EVENTO: INTERRUPTOR ON/OFF
// ============================================================================
// Escucha cambios en el estado del checkbox para actualizar y persistir la configuración.
elements.toggle.addEventListener("change", () => {
  const enabled = elements.toggle.checked;
  // Guarda el nuevo estado en el storage de Chrome
  chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
    updateStatus(enabled);
    showToast(enabled ? "ROVIX Guard activado" : "ROVIX Guard desactivado");
  });
});

// ============================================================================
// ACTUALIZACIÓN DINÁMICA DE LA INTERFAZ DE ESTADO
// ============================================================================
/**
 * Modifica las clases de estilo y leyendas del panel para reflejar el estado actual.
 * @param {boolean} enabled - Indica si la protección está activa o no.
 */
function updateStatus(enabled) {
  const dot = elements.statusDot;
  const text = elements.statusText;

  dot.className = "status-dot";

  if (!enabled) {
    dot.classList.add("inactive");
    text.textContent = "Inactivo - Protección pausada";
    return;
  }

  dot.classList.add("active");
  text.textContent = "Activo - Protegiendo en tiempo real";
}

// ============================================================================
// UTILERÍA: MENSAJES TEMPORALES (TOAST)
// ============================================================================
/**
 * Muestra una pequeña notificación visual efímera en la parte inferior del popup.
 * @param {string} message - Mensaje a mostrar.
 */
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  // Oculta gradualmente la notificación tras 2.5 segundos
  setTimeout(() => elements.toast.classList.remove("show"), 2500);
}
