/**
 * ROVIX Guard - background.js
 * 
 * Script de segundo plano (Service Worker) para la extensión de navegador.
 * Implementa un motor local de detección heurística de ciberacoso y hostigamiento en línea
 * utilizando expresiones regulares y reglas de clasificación léxica. Al operar localmente,
 * garantiza total privacidad y alto rendimiento sin depender de APIs de terceros.
 */

// ============================================================================
// DICCIONARIO DE REGLAS DE DETECCIÓN Y RECOMENDACIONES POR CATEGORÍA
// ============================================================================

/**
 * Diccionario de categorías de riesgo. Cada categoría cuenta con:
 * - label: Descripción sencilla del peligro identificado.
 * - consejo: Pauta constructiva y de autocuidado emocional sugerida al usuario.
 * - patterns: Lista de expresiones regulares para identificar patrones complejos o de múltiples palabras.
 * - keywords: Colección de palabras clave e insultos comunes para coincidencia directa de palabras completas.
 */
const RULES = {
  // Categoría 1: Amenazas directas o implícitas de violencia física o emocional
  AMENAZA: {
    label: "Contiene amenazas directas o implícitas de daño",
    consejo: "Expresar enojo sin amenazar: 'Estoy muy molesto con lo que pasó y necesitamos hablarlo.'",
    patterns: [
      /\bte\s+voy\s+a\s+(matar|golpear|destruir|romper|partir|chingar|joder|lastimar|hacer\s+daño)\b/gi,
      /\b(te\s+)?(mato|mataré|te\s+mato)\b/gi,
      /\b(ojal[aá]\s+)?(que\s+)?(te\s+)?(mueras?|muere|se\s+muera|pudras)\b/gi,
      /\bvas\s+a\s+(sufrir|morir|pagar|arrepentir|llorar)\b/gi,
      /\bte\s+(voy\s+a\s+)?(encontrar|buscar|seguir|perseguir)\b/gi,
      /\bno\s+(te\s+)?(vas\s+a\s+)?(salvar|escapar|librar)\b/gi,
      /\b(cuídate|cuidate)\b.{0,30}\b(si|o\s+si)\b/gi,
      /\b(te\s+)?(arrepentirás|arrepentiras|te\s+arrepientes)\b/gi,
      /\bpagarás\s+(caro|esto|por\s+esto)\b/gi,
      /\b(haré|hare|voy\s+a\s+hacer).{0,20}(daño|mal|sufrir)\b/gi,
    ],
    keywords: [
      "te mato", "te voy a matar", "mueras", "vas a morir", "te destruyo",
      "te voy a destruir", "lastimarte", "hacerte daño", "te encontraré",
      "no te escaparás", "arrepentirás", "pagarás", "te perseguiré",
      "te rompo", "te parto", "te voy a golpear", "te voy a romper", "pudrete", "púdrete"
    ],
  },

  // Categoría 2: Insultos vulgares, adjetivos degradantes y lenguaje hostil
  INSULTO: {
    label: "Contiene insultos y lenguaje degradante",
    consejo: "Intenta describir el comportamiento que te molesta en lugar de atacar a la persona.",
    patterns: [
      /\b(idiota|estúpid[ao]|estupid[ao]|imbécil|imbecil|pendej[ao])\b/gi,
      /\b(perr[ao]|perra|perro|zorra|put[ao]|ramera)\b/gi,
      /\b(maldit[ao]s?|mierdas?)\b/gi,
      /\b(inútil|inutil|tarad[ao]|tont[ao]|burr[ao]|burra)\b/gi,
      /\b(hdp|h\.d\.p|hij[oa]\s+de\s+(puta|la\s+chingada|su\s+(madre|puta\s+madre)))\b/gi,
      /\b(cabrón|cabron|cabronazo|cabrona)\b/gi,
      /\b(subnormal|retrasad[ao]|mongoloid[ao]|imbéciles|idiotas)\b/gi,
      /\b(asqueros[oa]|asco|repugnante)\b/gi,
      /\b(basura|chatarra|desperdicio|escoria)\b.{0,15}\b(eres|es|tú|tu)\b/gi,
      /\b(eres|es)\b.{0,15}\b(basura|mierda|nada|nadie|inútil|escoria)\b/gi,
      /\b(cállate|callate|cierra\s+(la\s+)?boca|cierre\s+(la\s+)?boca|calla\s+la\s+boca)\b/gi,
      /\b(animal|bestia|salvaje)\b.{0,10}\b(eres|pareces)\b/gi,
    ],
    keywords: [
      "idiota", "estupido", "estúpido", "imbécil", "pendejo", "pendeja",
      "perra", "perro", "maldito", "maldita", "inútil", "tarado", "tarada",
      "tonto", "tonta", "burro", "burra", "hdp", "hijo de puta", "hija de puta",
      "cabrón", "cabron", "cabrona", "subnormal", "retrasado", "retrasada",
      "asqueroso", "asquerosa", "mierda", "puto", "puta", "zorra", "ramera", "escoria"
    ],
  },

  // Categoría 3: Humillación, descalificación sistemática y ataques al autoestima
  HUMILLACION: {
    label: "Contiene humillación o degradación intencional",
    consejo: "Recuerda que puedes expresar tu frustración sin atacar la dignidad de la otra persona.",
    patterns: [
      /\b(perdedor|loser|fracasad[ao]|mediocre)\b/gi,
      /\b(nadie\s+(te\s+)?(quiere|soporta|aguanta|aprecia|ama))\b/gi,
      /\b(todos\s+(te\s+)?(odian|detestan|ríen\s+de\s+ti|burlan))\b/gi,
      /\b(eres\s+(un\s+|una\s+)?(fracas[ao]|nada|nadie|cero|poca\s+cosa|chiste))\b/gi,
      /\b(no\s+vales\s+(nada|un\s+peso|ni\s+un\s+centavo))\b/gi,
      /\b(nunca\s+(vas\s+a\s+)?(ser\s+(nadie|nada|algo)|lograr\s+(nada|algo)))\b/gi,
      /\b(toda(s)?\s+la\s+(gente|escuela|clase)\s+sabe)\b/gi,
      /\b(ríete\s+(tú|tu)\b|me\s+da\s+lástima|das\s+pena|das\s+lástima)\b/gi,
      /\bqué\s+(patétic[ao]|ridícul[ao]|lamentable)\b/gi,
    ],
    keywords: [
      "perdedor", "fracasado", "fracasada", "nadie te quiere", "todos te odian",
      "no vales nada", "eres un fracaso", "eres una nada", "loser", "mediocre",
      "nadie te soporta", "me da lástima", "qué patético", "nunca serás nada", "das pena"
    ],
  },

  // Categoría 4: Expresiones discriminatorias, xenofobia, homofobia y racismo
  DISCRIMINACION: {
    label: "Contiene lenguaje discriminatorio por raza, género u orientación",
    consejo: "El lenguaje discriminatorio causa daño real. Intenta expresarte sin atacar características de las personas.",
    patterns: [
      /\b(pinch[ae]\s+(indio|india|prieto|prieta|narc[ao]|pobre|negro|negra))\b/gi,
      /\b(maric[oó]n|marica|joto|jota|lesbiana\s+de\s+mierda|fag|faggot)\b/gi,
      /\b(gay\s+de\s+mierda|gay\s+asqueroso|puto\s+gay)\b/gi,
      /\b(gordo|gorda|gordit[ao]|cerd[ao]|vaca).{0,20}\b(asco|fea|feo|horrible|asqueroso|asquerosa)\b/gi,
      /\b(por\s+ser\s+(mujer|hombre|gay|trans|indio|pobre|negro|negra))\b/gi,
      /\b(las\s+mujeres\s+(son|sirven|solo|siempre))\b/gi,
    ],
    keywords: [
      "maricón", "joto", "jota", "pinche indio", "pinche india",
      "gay de mierda", "lesbiana asquerosa", "gorda asquerosa", "cerdo asqueroso"
    ],
  },

  // Categoría 5: Acoso persistente, chantaje, sextorsión y persecución digital
  ACOSO: {
    label: "Contiene comportamiento de acoso o persecución",
    consejo: "Si tienes un conflicto con alguien, lo mejor es buscar mediación o alejarse de la situación.",
    patterns: [
      /\b(no\s+te\s+(voy\s+a\s+)?(dejar|soltar|dejar\s+en\s+paz))\b/gi,
      /\b(voy\s+a\s+(publicar|subir|mostrar|difundir|compartir|filtrar)).{0,30}(foto|video|imagen|info|pack)\b/gi,
      /\b(si\s+no\s+(haces|me\s+das|contestas|respondes)).{0,40}(publicar|mostrar|decir|contar|subir)\b/gi,
      /\b(todo\s+el\s+(mundo|colegio|escuela|trabajo)\s+va\s+a\s+saber)\b/gi,
      /\bte\s+(voy\s+a\s+)?(stalkear|acechar|vigilar|observar)\b/gi,
    ],
    keywords: [
      "no te voy a dejar", "voy a publicar tu foto", "voy a difundir", "filtrar tu pack",
      "si no me das", "todo el mundo va a saber", "te voy a stalkear"
    ],
  },

  // Categoría 6: Culpa coercitiva y manipulación emocional severa
  MANIPULACION: {
    label: "Contiene tácticas de manipulación emocional",
    consejo: "La comunicación sana no involucra culpa ni manipulación. Expresa tus necesidades de forma directa y honesta.",
    patterns: [
      /\b(por\s+tu\s+culpa\s+(me\s+)?(voy\s+a|voy|quiero)\s+(morir|hacer(me)?\s+daño|lastimar|suicidar))\b/gi,
      /\b(si\s+(me\s+)?dejas\s+(me\s+)?(mato|muero|hago\s+daño|suicido))\b/gi,
      /\b(después\s+no\s+(digas|te\s+quejes|llores)\s+que\s+no\s+te\s+avisé)\b/gi,
      /\b(nunca\s+nadie\s+te\s+va\s+a\s+(querer|amar|soportar)\s+(como\s+yo)?)\b/gi,
      /\b(eres\s+(un\s+)?(egoist[ao]|ingrat[ao]|malagradecid[ao]))\b/gi,
      /\b(después\s+(no\s+)?me\s+(vengas\s+a\s+)?(pedir|buscar|rogar|llorar))\b/gi,
    ],
    keywords: [
      "por tu culpa me voy a matar", "si me dejas me mato", "me voy a suicidar",
      "nadie te va a querer", "eres un ingrato", "eres una ingrata", "malagradecido",
      "después no me vengas a buscar"
    ],
  },
};

// ============================================================================
// INICIALIZACIÓN: COMPILACIÓN DINÁMICA DE REGLAS DE PALABRAS CLAVE (KEYWORDS)
// ============================================================================

// Se recorren las categorías del diccionario para convertir las cadenas de keywords
// en expresiones regulares precisas, rodeadas de delimitadores de palabra (\b) para
// evitar falsas coincidencias con subcadenas integradas en otras palabras.
for (const cat in RULES) {
  if (RULES[cat].keywords) {
    RULES[cat].keywordPatterns = RULES[cat].keywords.map((kw) => {
      // Escapa caracteres especiales regex por seguridad
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Compila la expresión con límites de palabra e insensible a mayúsculas
      return new RegExp(`\\b${escaped}\\b`, "gi");
    });
  } else {
    RULES[cat].keywordPatterns = [];
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE ANÁLISIS HEURÍSTICO LOCAL
// ============================================================================

/**
 * Analiza un bloque de texto en busca de patrones hostiles definidos en RULES.
 * @param {string} text - El texto a evaluar introducido por el usuario.
 * @returns {object} Un objeto detallado con el diagnóstico, banderas de riesgo y sugerencias.
 */
function analyzeLocally(text) {
  const trimmed = text.trim();

  // Si el texto es nulo o demasiado corto, se descarta el análisis para evitar ruido
  if (!trimmed || trimmed.length < 5) {
    return {
      es_nocivo: false,
      categorias_detectadas: [],
      explicacion: "El texto es muy corto para analizarlo.",
      fragmentos_problematicos: [],
      mensaje_reformulado: trimmed,
      consejo: "",
    };
  }

  const categorias = [];
  const fragmentos = new Set();
  const explicaciones = [];
  let consejoFinal = "";

  // Se evalúa de manera iterativa cada categoría configurada en el motor
  for (const [cat, rule] of Object.entries(RULES)) {
    let hits = 0;
    const catFragments = [];

    // 1. Evalúa expresiones regulares complejas (patterns)
    for (const pattern of rule.patterns) {
      pattern.lastIndex = 0;
      const matches = trimmed.match(pattern);
      if (matches) {
        hits += matches.length;
        // Almacena las coincidencias encontradas para reporte
        matches.slice(0, 2).forEach((m) => catFragments.push(m.trim()));
      }
    }

    // 2. Evalúa coincidencia de palabras clave exactas (keywords compiled regexes)
    for (const kwPattern of rule.keywordPatterns) {
      kwPattern.lastIndex = 0;
      const kwMatches = trimmed.match(kwPattern);
      if (kwMatches) {
        const matchStr = kwMatches[0].trim();
        // Evita duplicar fragmentos si ya fueron cubiertos por patrones más amplios
        const yaDetectado = catFragments.some((f) =>
          f.toLowerCase().includes(matchStr.toLowerCase())
        );
        if (!yaDetectado) {
          hits += kwMatches.length;
          catFragments.push(matchStr);
        }
      }
    }

    // Si se encontró al menos una coincidencia, se marca la categoría activa
    if (hits > 0) {
      categorias.push(cat);
      catFragments.slice(0, 3).forEach((f) => fragmentos.add(f));
      explicaciones.push(rule.label);
      // Se conserva el consejo de la categoría de mayor relevancia (primera detectada)
      if (!consejoFinal) consejoFinal = rule.consejo;
    }
  }

  const es_nocivo = categorias.length > 0;

  // Si es nocivo, se genera dinámicamente un mensaje asertivo y libre de toxicidad
  const mensaje_reformulado = es_nocivo
    ? generarReformulado(trimmed, categorias, Array.from(fragmentos))
    : trimmed;

  return {
    es_nocivo,
    categorias_detectadas: categorias,
    explicacion:
      explicaciones.length > 0
        ? explicaciones.join(". ") + "."
        : "Sin contenido nocivo detectado.",
    fragmentos_problematicos: [...fragmentos].slice(0, 5),
    mensaje_reformulado,
    consejo: consejoFinal,
  };
}

// ============================================================================
// MOTOR DE REFORMULACIÓN ASERTIVA Y CONSTRUCTIVA
// ============================================================================

/**
 * Reconstruye un mensaje agresivo reemplazando su contenido tóxico por una 
 * alternativa asertiva que comunique límites o intenciones de manera respetuosa.
 * @param {string} texto - Mensaje original del usuario.
 * @param {string[]} categorias - Categorías de acoso detectadas.
 * @param {string[]} fragmentos_problematicos - Palabras o frases tóxicas identificadas.
 * @returns {string} Mensaje reformulado.
 */
function generarReformulado(texto, categorias, fragmentos_problematicos) {
  // 1. Limpieza básica: Elimina los fragmentos altamente tóxicos directamente del texto
  let textoLimpio = texto;
  fragmentos_problematicos.forEach((f) => {
    const escapedF = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedF}\\b`, "gi");
    textoLimpio = textoLimpio.replace(regex, "");
  });

  const limpioLower = textoLimpio.toLowerCase();

  // 2. Mapeo semántico de intenciones: Reemplazos asertivos contextuales
  const intents = [
    {
      regex: /\b(no\s+me\s+importa|me\s+da\s+igual|qu[eé]\s+me\s+importa)\b/gi,
      respuesta: "Preferiría que dejáramos este tema por ahora; no me siento cómodo discutiéndolo en este momento."
    },
    {
      regex: /\b(por\s+qu[eé]|porque)\b/gi,
      respuesta: "Tengo dudas respecto a esto. ¿Podrías explicarme tu perspectiva de manera más detallada y tranquila?"
    },
    {
      regex: /\b(no\s+quiero|no\s+voy\s+a)\b/gi,
      respuesta: "No estoy de acuerdo con esto y prefiero no involucrarme."
    },
    {
      regex: /\b(dame|quiero\s+que)\b/gi,
      respuesta: "Me gustaría hacerte una solicitud importante. ¿Podemos hablarlo cuando tengas tiempo?"
    },
    {
      regex: /\b(tu\s+culpa|es\s+tu)\b/gi,
      respuesta: "Creo que ambos tenemos parte de responsabilidad en esto. Deberíamos analizar la situación objetivamente."
    },
    {
      regex: /\b(nunca|siempre)\b/gi,
      respuesta: "Siento que esta situación se repite y me genera frustración. Me gustaría que encontráramos una solución mutua."
    },
    {
      regex: /\b(vete|d[eé]jame)\b/gi,
      respuesta: "En este momento necesito espacio personal. Por favor, respeta mi decisión."
    }
  ];

  // Si el texto limpio coincide con alguna intención básica, se utiliza esa respuesta directa
  for (const intent of intents) {
    if (intent.regex.test(limpioLower) || intent.regex.test(texto.toLowerCase())) {
      return intent.respuesta;
    }
  }

  // 3. Fallbacks asertivos según la categoría predominante (versiones cortas)
  const cortas = {
    AMENAZA: "Estoy percibiendo mucha hostilidad. Necesito espacio antes de que continuemos esta conversación.",
    INSULTO: "Me siento frustrado por esta interacción. Prefiero que retomemos la conversación cuando ambos estemos más calmados.",
    HUMILLACION: "Considero que esta forma de trato no es constructiva para ninguno de los dos.",
    DISCRIMINACION: "Te pido que mantengamos el respeto mutuo durante nuestra conversación.",
    ACOSO: "Por favor, respeta mi espacio. No deseo continuar con esta interacción.",
    MANIPULACION: "Siento presión en esta situación. Prefiero que detengamos la charla aquí."
  };

  // 4. Fallbacks asertivos según la categoría predominante (versiones largas)
  const largas = {
    AMENAZA: "Percibo mucha molestia en tus mensajes, pero recurrir a agresiones no solucionará el problema. Hablemos de esto más adelante con calma.",
    INSULTO: "Entiendo que haya frustración, pero el uso de lenguaje ofensivo empeora la situación. Solicito que nos comuniquemos desde el respeto mutuo.",
    HUMILLACION: "No estoy de acuerdo con la forma en que te estás dirigiendo a mí. Todos merecemos ser tratados con dignidad; te sugiero replantear tu enfoque.",
    DISCRIMINACION: "Rechazo los comentarios que atacan la identidad o características de las personas. Necesitamos buscar otra forma de expresarnos si queremos dialogar.",
    ACOSO: "Esta insistencia me resulta incómoda. Te comunico de manera directa que necesito que respetes mis límites y detengas estos mensajes.",
    MANIPULACION: "Tus mensajes me hacen sentir que intentas invalidar mi postura. Reafirmo mis límites y te pido que los respetes sin recurrir a este tipo de comentarios."
  };

  const esLargo = texto.split(/\s+/).length > 8;
  const prioridad = ["AMENAZA", "ACOSO", "MANIPULACION", "HUMILLACION", "DISCRIMINACION", "INSULTO"];

  // Devuelve la respuesta preestablecida de la categoría más severa encontrada
  for (const cat of prioridad) {
    if (categorias.includes(cat)) {
      return esLargo ? largas[cat] : cortas[cat];
    }
  }

  return "Creo que podemos expresar nuestra postura de una manera más profesional y respetuosa para evitar malentendidos.";
}

// ============================================================================
// ESCUCHA Y COMUNICACIÓN DE EVENTOS DE CHROME EXTENSION
// ============================================================================

/**
 * Listener global para recibir mensajes del script de contenido (content.js).
 * Recibe peticiones de tipo 'ANALYZE_TEXT', valida si la extensión está habilitada,
 * ejecuta el análisis local y devuelve la respuesta al remitente.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TEXT") {
    // Consulta la configuración guardada del usuario
    chrome.storage.sync.get(["extensionEnabled"], (data) => {
      // Si la extensión ha sido explícitamente desactivada, cancela la ejecución
      if (data.extensionEnabled === false) {
        sendResponse({ success: false, error: "EXTENSION_DISABLED" });
        return;
      }

      try {
        // Ejecuta el análisis local en segundo plano
        const result = analyzeLocally(message.text);
        sendResponse({ success: true, data: result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Mantiene el canal de comunicación abierto para respuestas asíncronas
  }
});
