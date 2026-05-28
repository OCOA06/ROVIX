// =====================================================
// ROVIX Guard - background.js (Service Worker)
// Maneja llamadas a Google Gemini API
// =====================================================

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `Eres ROVIX Guard, un sistema experto en detección de ciberacoso y comunicación dañina. 
Analiza el siguiente texto que un usuario está a punto de enviar y determina si contiene indicios de conductas nocivas.

Evalúa las siguientes categorías:
- AMENAZA: Expresiones que implican daño físico, emocional o material
- INSULTO: Palabras o frases degradantes, ofensivas o humillantes
- ACOSO: Patrones de hostigamiento, presión o persecución
- DISCRIMINACIÓN: Contenido basado en raza, género, religión, orientación sexual, etc.
- MANIPULACIÓN: Tácticas de control emocional, gaslighting, chantaje
- ACOSO_SEXUAL: Contenido de naturaleza sexual no solicitado o inapropiado
- HUMILLACIÓN: Exposición pública o vergüenza intencional
- DOXING: Compartir información personal de otros sin consentimiento

IMPORTANTE: 
- Si el texto está en blanco o tiene menos de 5 palabras, responde con nivel NINGUNO
- Sé preciso y no sobredimensiones mensajes neutros o de frustración leve
- Considera el contexto cultural latinoamericano

Responde EXCLUSIVAMENTE en formato JSON con esta estructura exacta:
{
  "nivel_riesgo": "NINGUNO" | "BAJO" | "MEDIO" | "ALTO" | "CRITICO",
  "puntuacion": 0-100,
  "categorias_detectadas": ["CATEGORIA1", "CATEGORIA2"],
  "explicacion": "Explicación clara y directa en español de qué se detectó y por qué es problemático",
  "fragmentos_problematicos": ["frase1", "frase2"],
  "mensaje_reformulado": "Versión mejorada del mensaje que exprese la misma idea pero de forma respetuosa y constructiva",
  "consejo": "Consejo breve sobre comunicación saludable"
}`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TEXT") {
    analyzeText(message.text)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Mantener canal abierto para respuesta async
  }
});

async function analyzeText(text) {
  const { apiKey, extensionEnabled } = await chrome.storage.sync.get(["apiKey", "extensionEnabled"]);

  if (!extensionEnabled) {
    throw new Error("EXTENSION_DISABLED");
  }

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("NO_API_KEY");
  }

  if (!text || text.trim().length < 5) {
    return {
      nivel_riesgo: "NINGUNO",
      puntuacion: 0,
      categorias_detectadas: [],
      explicacion: "El texto es muy corto para analizarlo.",
      fragmentos_problematicos: [],
      mensaje_reformulado: text,
      consejo: ""
    };
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nTEXTO A ANALIZAR:\n"${text}"`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `Error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Respuesta vacía de la IA");
  }

  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("No se pudo procesar la respuesta de la IA");
  }
}
