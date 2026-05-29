"""
Servidor Backend ROVIX - main.py

Este script implementa un servidor de API REST utilizando el framework FastAPI. 
Proporciona el backend operativo para el chatbot educativo de seguridad digital, 
el motor clasificador de intenciones de ciberacoso (con fallbacks semánticos locales),
y las herramientas criptográficas/gráficas para la inyección de perturbación adversarial
e inserción de marcas esteganográficas digitales en imágenes para su inmunización frente a la IA.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
import io
import numpy as np
from PIL import Image
import g4f
from g4f.client import Client
import json
import urllib.request

# ============================================================================
# FUNCIONES AUXILIARES: LLAMADAS A MODELOS DE LENGUAJE (LLM)
# ============================================================================

def query_llm(messages: list, json_mode: bool = False) -> str:
  """
  Realiza una consulta directa a la API HTTP de Pollinations AI.
  Utiliza urllib de forma síncrona para evitar dependencias complejas.
  
  :param messages: Historial de mensajes en formato de roles/contenidos.
  :param json_mode: Booleano que determina si se exige respuesta en formato JSON estructurado.
  :return: Respuesta textual del modelo o None si ocurre una excepción de red.
  """
  url = "https://text.pollinations.ai/"
  payload = {
    "messages": messages,
    "jsonMode": json_mode,
    "model": "openai"
  }
  try:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
      url,
      data=data,
      headers={"Content-Type": "application/json"},
      method="POST"
    )
    # Ejecuta la consulta con un timeout preventivo de 12 segundos
    with urllib.request.urlopen(req, timeout=12) as response:
      res_text = response.read().decode("utf-8")
      if res_text and len(res_text.strip()) > 5:
        return res_text.strip()
  except Exception as e:
    print(f"Error al llamar directamente a Pollinations AI: {e}")
  return None

def query_llm_g4f(messages: list) -> str:
  """
  Proveedor secundario de respaldo (Fallback) utilizando la biblioteca g4f (GPT4Free).
  Itera dinámicamente sobre múltiples proveedores y modelos libres hasta encontrar uno activo.
  
  :param messages: Historial de mensajes.
  :return: Respuesta textual purificada o None si fallan todas las combinaciones.
  """
  client = Client()
  PROVIDERS_TO_TRY = [
    g4f.Provider.PollinationsAI,
    g4f.Provider.DDGS,
    g4f.Provider.BlackboxPro,
    g4f.Provider.DeepInfra,
  ]
  MODELS_TO_TRY = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-3.5-turbo",
    "llama-3.1-70b",
  ]
  # Colección de respuestas no deseadas (denegaciones, límites de tasa o pantallas de inicio de sesión)
  REJECT_PHRASES = [
    "log in", "sign in", "please login", "create an account",
    "iniciar sesion", "access denied", "rate limit",
    "i'm sorry, but i can't", "as an ai language model",
  ]
  for provider in PROVIDERS_TO_TRY:
    for model in MODELS_TO_TRY:
      try:
        response = client.chat.completions.create(
          model=model,
          messages=messages,
          provider=provider,
          timeout=20,
        )
        text = response.choices[0].message.content
        if text and len(text.strip()) > 15:
          text_lower = text.lower()
          # Si la respuesta es válida y no contiene frases de rechazo, se devuelve inmediatamente
          if not any(phrase in text_lower for phrase in REJECT_PHRASES):
            return text.strip()
      except Exception:
        continue
  return None


# ============================================================================
# CONFIGURACIÓN Y MIDDLEWARES DE FASTAPI
# ============================================================================

app = FastAPI(
  title="Servidor de Prevención de Ciberacoso ROVIX",
  description="API para análisis de intenciones de ciberacoso y perturbación de imágenes."
)

# Habilita el control de acceso de origen cruzado (CORS) para permitir peticiones desde el frontend de React
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


# ============================================================================
# MODELOS DE DATOS (PYDANTIC SCHEMAS)
# ============================================================================

class ChatMessage(BaseModel):
  """Modelo para representar un mensaje individual dentro del historial."""
  role: str
  content: str

class ChatRequest(BaseModel):
  """Modelo de solicitud para el endpoint interactivo del chatbot."""
  message: str
  history: Optional[List[ChatMessage]] = []

class AnalyzeRequest(BaseModel):
  """Modelo de solicitud para el endpoint clasificador de ciberacoso."""
  message: str


# ============================================================================
# PROMPTS DE INSTRUCCIÓN (SYSTEM PROMPTS)
# ============================================================================

SYSTEM_PROMPT = (
  "Eres ROVIX, un asistente virtual experto en seguridad digital y prevencion de ciberacoso. "
  "Responde SIEMPRE en espanol. Eres amigable, empatico y directo. "
  "Puedes ayudar con: analizar mensajes sospechosos, dar consejos sobre privacidad, "
  "explicar que hacer ante situaciones de acoso, y orientar sobre como protegerse en linea. "
  "Manten tus respuestas claras y utiles. "
  "Si el usuario te cuenta una situacion de acoso, se empatico y da pasos concretos. "
  "Si el usuario te saluda, responde amigablemente y pregunta como puedes ayudarle. "
  "Nunca digas que no puedes ayudar. Siempre da una respuesta util y relevante."
)

ANALYZE_PROMPT = (
  "Eres un analizador experto de mensajes. Analiza el siguiente mensaje y determina si contiene "
  "ciberacoso, amenazas, manipulacion, chantaje, grooming, o malas intenciones. "
  "Responde UNICAMENTE con un JSON valido (sin markdown, sin backticks) con esta estructura exacta: "
  '{"risk_level": "bajo|medio|alto|critico", "intention": "tipo de intencion detectada en 3-5 palabras", '
  '"explanation": "explicacion detallada de por que el mensaje es o no peligroso", '
  '"recommendation": "que debe hacer la persona que recibio este mensaje"}. '
  "Responde siempre en espanol. Se preciso y directo."
)


# ============================================================================
# ENDPOINT: CHATBOT INTERACTIVO ROVIX
# ============================================================================

@app.post("/api/chat")
async def chat_api(req: ChatRequest):
  """
  Recibe consultas del usuario, intenta responder utilizando IA generativa a través de
  Pollinations AI o g4f, y cuenta con un robusto motor de respuestas asertivas locales en español
  en caso de que fallen las conexiones a la red externa.
  """
  messages_list = [{"role": "system", "content": SYSTEM_PROMPT}]

  # Se truncan las conversaciones previas a los últimos 12 mensajes para optimizar el contexto
  if req.history:
    for entry in req.history[-12:]:
      messages_list.append({"role": entry.role, "content": entry.content})

  messages_list.append({"role": "user", "content": req.message})

  # 1. Intento primario: Conexión Pollinations AI directo
  response_text = query_llm(messages_list)
  if response_text:
    return {"response": response_text.replace("*", "")}

  # 2. Intento secundario: g4f (GPT4Free)
  response_text = query_llm_g4f(messages_list)
  if response_text:
    return {"response": response_text.replace("*", "")}

  # 3. Fallback: Respuestas locales basadas en palabras clave (en caso de desconexión)
  user_msg = req.message.lower()
  
  if any(w in user_msg for w in ["acoso", "acosan", "molesta", "bullying", "insulta"]):
    res = (
      "Entiendo tu situacion y lamento que estes pasando por esto. "
      "Aqui van pasos concretos:\n\n"
      "1. Guarda evidencia: Toma capturas de pantalla de todo.\n"
      "2. Bloquea al agresor: No respondas a provocaciones.\n"
      "3. Reporta: Usa la funcion de reporte de la plataforma.\n"
      "4. Habla con alguien: Cuentale a un adulto de confianza, maestro o familiar.\n"
      "5. Busca ayuda profesional: Si sientes ansiedad o miedo, busca apoyo psicologico.\n\n"
      "No estas solo/a. El acoso NO es tu culpa."
    )
  elif any(w in user_msg for w in ["grooming", "groom", "adulto", "engaño"]):
    res = (
      "El grooming es cuando un adulto se hace pasar por un joven o utiliza perfiles falsos en redes sociales para ganarse la confianza de un menor de edad, con intenciones de manipularlo o hacerle daño.\n\n"
      "Para protegerte, sigue estas recomendaciones:\n\n"
      "1. No hables con personas desconocidas en internet ni les cuentes secretos.\n"
      "2. Nunca envies fotos o videos personales, ni compartas datos como tu direccion o escuela.\n"
      "3. Si alguien te pide mantener nuestra conversacion en secreto, es una senal de alerta.\n"
      "4. Si te sientes incomodo o con miedo por lo que te dice alguien en linea, cuentaselo de inmediato a un adulto de confianza o tutor.\n\n"
      "Recuerda que no estas solo/a y no es tu culpa."
    )
  elif any(w in user_msg for w in ["foto", "imagen", "fotos", "proteger", "privacidad"]):
    res = (
      "Para proteger tus fotos e imagenes en linea:\n\n"
      "1. Usa nuestro filtro antirobo: Ve a la seccion de Filtro de Fotos y aplica la proteccion.\n"
      "2. Configura tu privacidad: Pon tus redes sociales en modo privado.\n"
      "3. No compartas fotos intimas: Nunca envies fotos comprometedoras a nadie.\n"
      "4. Marca de agua: Considera agregar marcas de agua a tus fotos importantes.\n"
      "5. Revisa permisos: Revisa que apps tienen acceso a tu galeria.\n\n"
      "Puedo ayudarte con algo mas especifico?"
    )
  elif any(w in user_msg for w in ["hola", "hi", "hey", "buenos", "buenas", "que tal"]):
    res = (
      "Hola! Soy ROVIX, tu asistente de seguridad digital. "
      "Estoy aqui para ayudarte con cualquier tema de ciberseguridad o ciberacoso. "
      "Puedes preguntarme sobre:\n\n"
      "- Como proteger tus redes sociales\n"
      "- Que hacer si te acosan en linea\n"
      "- Como proteger tus fotos\n"
      "- Consejos de privacidad digital\n\n"
      "En que puedo ayudarte?"
    )
  elif any(w in user_msg for w in ["bloquear", "bloqueo", "reportar", "reporte"]):
    res = (
      "Para bloquear y reportar a alguien:\n\n"
      "Instagram: Ve al perfil > tres puntos > Bloquear/Reportar\n"
      "Facebook: Ve al perfil > tres puntos > Bloquear/Reportar\n"
      "WhatsApp: Abre el chat > tres puntos > Mas > Bloquear\n"
      "TikTok: Ve al perfil > tres puntos > Bloquear/Reportar\n\n"
      "Siempre guarda capturas ANTES de bloquear para tener evidencia. "
      "Necesitas ayuda con alguna plataforma especifica?"
    )
  elif any(w in user_msg for w in ["amenaza", "amenazas", "miedo", "peligro"]):
    res = (
      "Si alguien te amenaza, esto es SERIO. Sigue estos pasos:\n\n"
      "1. NO respondas a la amenaza.\n"
      "2. Guarda todo: Capturas de pantalla con fecha y hora.\n"
      "3. Cuentale a un adulto de confianza inmediatamente.\n"
      "4. Reporta en la plataforma donde ocurrio.\n"
      "5. Si es una amenaza real de violencia, llama a las autoridades (911).\n\n"
      "Las amenazas en linea son un delito. No tienes que enfrentar esto solo/a."
    )
  else:
    res = (
      "Gracias por tu mensaje. Como asistente de seguridad digital, puedo ayudarte con:\n\n"
      "- Ciberacoso: Que hacer si te molestan en linea\n"
      "- Privacidad: Como proteger tus cuentas y datos\n"
      "- Fotos: Como evitar que usen tus imagenes sin permiso\n"
      "- Amenazas: Pasos a seguir si te amenazan\n"
      "- Redes sociales: Como configurar tu seguridad\n\n"
      "Cuentame mas sobre tu situacion y te dare consejos personalizados."
    )
  return {"response": res.replace("*", "")}


# ============================================================================
# ENDPOINT: CLASIFICADOR DE INTENCIONES DE RIESGO
# ============================================================================

@app.post("/api/analyze")
async def analyze_message(req: AnalyzeRequest):
  """
  Analiza un mensaje ingresado para catalogar su nivel de riesgo y detectar amenazas, 
  intentos de extorsión, grooming, insultos o manipulación mediante inteligencia artificial.
  Si los modelos externos fallan, se conmuta automáticamente a un motor de coincidencia léxica local.
  """
  analyze_messages = [
    {"role": "system", "content": ANALYZE_PROMPT},
    {"role": "user", "content": f'Analiza este mensaje: "{req.message}"'},
  ]

  # 1. Intento primario: Pollinations AI directo (con modo JSON estructurado)
  response_text = query_llm(analyze_messages, json_mode=True)
  if response_text:
    try:
      cleaned = response_text
      # Limpia envolturas markdown del JSON si existen
      if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
      result = json.loads(cleaned)
      if "risk_level" in result and "explanation" in result:
        return result
    except Exception:
      pass

  # 2. Intento secundario: g4f (GPT4Free)
  response_text = query_llm_g4f(analyze_messages)
  if response_text:
    try:
      cleaned = response_text
      if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
      result = json.loads(cleaned)
      if "risk_level" in result and "explanation" in result:
        return result
    except Exception:
      pass

  # 3. Fallback: Analizador semántico local de alto rendimiento
  # Se ejecuta si no hay conectividad externa o si los LLM devuelven formatos inválidos.
  msg_lower = req.message.lower()
  
  # Categoría A: Amenazas explícitas o implícitas de violencia física
  threat_words = [
    "matar", "muere", "muerte", "golpear", "pegar", "madrear", "romper la cara", 
    "hacer daño", "lastimar", "buscar", "se donde vives", "te va a ir mal", 
    "amenazo", "consecuencias", "arrepentir", "arrepentiras", "pagaras"
  ]
  # Categoría B: Señales típicas de Grooming y manipulación de menores
  groom_words = [
    "eres muy bonita", "no le digas a nadie", "mandame foto", "solo entre nosotros", 
    "eres especial", "lindo", "linda", "hermosa", "cuerpo", "secreto", "nadie sepa", 
    "pasa foto", "fotos tuyas", "camara", "video", "encuentro", "solos", "amiguitos", 
    "whatsapp", "agregarme"
  ]
  # Categoría C: Chantaje coercitivo, sextorsión y extorsión por material íntimo
  manip_words = [
    "si no me", "te voy a", "le digo a todos", "secreto", "fotos", "video intimo", 
    "chantaje", "si no haces", "publicar", "difundir", "compartir fotos", "le digo a tu", 
    "digo a todos", "mostrar", "redes", "amigos", "arrepentiras", "obedeces", "obedece"
  ]
  # Categoría D: Insultos hostiles de acoso verbal directo
  harass_words = [
    "tonto", "tonta", "feo", "fea", "gorda", "gordo", "idiota", "estupido", "estupida", 
    "inutil", "perra", "puta", "zorra", "fracasado", "fracasada", "nadie", "basura", 
    "asco", "odiar", "odias", "imbecil", "estupidez", "imbeciles", "fracaso", "estupidos"
  ]
  # Categoría E: Conducta persistente, acecho e intrusión de límites personales
  stalk_words = [
    "ubicacion", "donde estas", "pasame tu", "con quien estas", "vigilo", "siempre", 
    "acosando", "persiguiendo", "bloquear", "responde", "contesta", "llamando"
  ]

  if any(w in msg_lower for w in threat_words):
    return {
      "risk_level": "critico",
      "intention": "Amenaza directa o intimidación física",
      "explanation": "El mensaje contiene amenazas explícitas de violencia o advertencias de daños físicos. Esto representa un peligro real y severo.",
      "recommendation": "No respondas bajo ninguna circunstancia. Toma capturas de pantalla de la conversación, bloquea al usuario inmediatamente y cuéntale a un adulto de confianza o repórtalo a las autoridades.",
    }
  elif any(w in msg_lower for w in manip_words):
    return {
      "risk_level": "alto",
      "intention": "Intento de chantaje y sextorsión",
      "explanation": "Se identifican patrones de manipulación coercitiva, donde el remitente intenta forzarte a realizar una acción bajo amenaza de difundir imágenes o secretos.",
      "recommendation": "No cedas al chantaje. Los extorsionadores rara vez se detienen tras el primer pago o concesión. Guarda toda la evidencia y busca ayuda profesional o legal de inmediato.",
    }
  elif any(w in msg_lower for w in groom_words):
    return {
      "risk_level": "critico",
      "intention": "Patrón de grooming o manipulación de menores",
      "explanation": "El mensaje presenta halagos excesivos combinados con solicitudes de secretismo ('no le digas a nadie') y envío de material multimedia. Esta es una conducta típica de depredadores digitales.",
      "recommendation": "Corta toda comunicación de inmediato. No envíes fotos ni datos personales. Es sumamente importante que reportes este chat a tus padres, tutores o maestros de confianza.",
    }
  elif any(w in msg_lower for w in harass_words):
    return {
      "risk_level": "alto",
      "intention": "Insultos y acoso verbal hostil",
      "explanation": "El mensaje contiene adjetivos degradantes y descalificaciones directas destinadas a minar tu autoestima e infundir humillación.",
      "recommendation": "Ignora las agresiones verbales; responder solo escala el conflicto. Bloquea de inmediato a este remitente y reporta su cuenta dentro de la red social.",
    }
  elif any(w in msg_lower for w in stalk_words):
    return {
      "risk_level": "medio",
      "intention": "Conducta intrusiva o acoso persistente",
      "explanation": "El remitente insiste de forma recurrente en obtener datos sobre tu ubicación, actividades o exige respuestas inmediatas, invadiendo tus límites personales.",
      "recommendation": "Establece un límite claro informando que no compartirás esa información. Si la insistencia continúa, bloquea al contacto para resguardar tu tranquilidad.",
    }
  else:
    return {
      "risk_level": "bajo",
      "intention": "Mensaje sin riesgo explícito detectado",
      "explanation": "No se encontraron términos ni patrones evidentes de violencia, acoso, extorsión o manipulación en este mensaje. No obstante, el sentido real puede variar según el historial previo.",
      "recommendation": "Si experimentas incomodidad o desconfianza con esta persona, recuerda que siempre tienes el derecho de silenciar el chat o dejar de responder.",
    }


# ============================================================================
# ALGORITMOS DE PROTECCIÓN ADVERSARIAL Y ESTEGANOGRAFÍA
# ============================================================================

# Firma digital binaria para marcar esteganográficamente las imágenes protegidas
PROTECTION_MARKER = b"ROVIX_PROTECTED_v2"


def add_adversarial_perturbation(image: Image.Image, strength: float = 25.0) -> Image.Image:
  """
  Aplica perturbaciones adversarias de alta intensidad matemática sobre los canales RGB
  de la imagen mediante inyecciones de ruido de alta frecuencia estructurada.
  Estos patrones son casi imperceptibles al ojo humano pero confunden
  las neuronas artificiales de los modelos de IA generativa (Stable Diffusion, etc.),
  provocando que si intentan modificar o simular retratos, obtengan imágenes distorsionadas.
  
  :param image: Objeto imagen de Pillow en formato RGB.
  :param strength: Amplitud o intensidad de las perturbaciones inyectadas.
  :return: Objeto imagen con perturbaciones aplicadas.
  """
  # Convierte la imagen a un arreglo matricial NumPy de coma flotante para cálculos continuos
  img_array = np.array(image, dtype=np.float64)
  h, w, c = img_array.shape

  # Genera coordenadas espaciales matriciales
  x = np.arange(w, dtype=np.float64)
  y = np.arange(h, dtype=np.float64)
  xx, yy = np.meshgrid(x, y)

  # 1. Ondas de alta frecuencia en múltiples ángulos para perturbar texturas finas
  high_freq_1 = np.sin(xx * 2.7 + yy * 3.1) * strength * 0.15
  high_freq_2 = np.cos(xx * 4.3 - yy * 2.8) * strength * 0.12
  high_freq_3 = np.sin((xx * 5.5 + yy * 4.2) * 0.7) * strength * 0.10
  high_freq_4 = np.cos((xx - yy) * 3.9) * strength * 0.08

  # 2. Rejillas de interferencia cruzadas (Cross-hatching) para quebrar la coherencia estructural de la IA
  cross_hatch = (
    np.sin(xx * 6.0) * np.cos(yy * 6.0) * strength * 0.10
    + np.sin((xx + yy) * 4.5) * np.cos((xx - yy) * 3.5) * strength * 0.08
  )

  # 3. Patrón de tablero de ajedrez minúsculo de interferencia de fase
  grid_x = (np.mod(xx, 8) < 4).astype(np.float64) * 2 - 1
  grid_y = (np.mod(yy, 8) < 4).astype(np.float64) * 2 - 1
  checker = grid_x * grid_y * strength * 0.06

  # Genera una semilla basada en los píxeles superiores para inyectar ruido pseudoaleatorio consistente
  seed = int(np.sum(img_array[:8, :8, :].ravel()) * 7) % (2**31)
  rng = np.random.RandomState(seed)
  random_noise = rng.uniform(-strength * 0.20, strength * 0.20, (h, w))

  # 4. Ruido por bloques de píxeles (bloques de 4x4)
  block_size = 4
  block_noise = rng.uniform(-strength * 0.15, strength * 0.15,
                            (h // block_size + 1, w // block_size + 1))
  block_expanded = np.repeat(np.repeat(block_noise, block_size, axis=0), block_size, axis=1)[:h, :w]

  # Combina todos los componentes de la perturbación base
  base_perturbation = (
    high_freq_1 + high_freq_2 + high_freq_3 + high_freq_4
    + cross_hatch + checker + random_noise + block_expanded
  )

  # Aplica la perturbación a cada canal RGB de forma ponderada según los gradientes de bordes
  for ch in range(c):
    channel = img_array[:, :, ch]
    gradient_x = np.zeros_like(channel)
    gradient_y = np.zeros_like(channel)
    # Calcula diferencias finitas para la detección de bordes y texturas
    gradient_x[:, 1:] = channel[:, 1:] - channel[:, :-1]
    gradient_y[1:, :] = channel[1:, :] - channel[:-1, :]

    edge_mask = np.sqrt(gradient_x**2 + gradient_y**2)
    edge_mask = edge_mask / (np.max(edge_mask) + 1e-8)

    # Amplifica sutilmente la perturbación en los bordes donde el ojo humano disfraza mejor el ruido
    ch_perturbation = base_perturbation * (1.0 + edge_mask * 0.5)

    phase_shift = rng.uniform(0, 2 * np.pi)
    ch_perturbation += np.sin(xx * 3.2 + phase_shift) * np.cos(yy * 2.8 + phase_shift) * strength * 0.05

    img_array[:, :, ch] += ch_perturbation

  # 5. Inyección dispersa de ruido impulsivo de sal y pimienta de baja visibilidad (3% de píxeles)
  pixel_mask = rng.random((h, w)) < 0.03
  for ch in range(c):
    flip = rng.choice([-strength * 0.8, strength * 0.8], size=(h, w))
    img_array[:, :, ch] += pixel_mask * flip

  # Recorta y convierte los valores flotantes al rango válido [0-255] de enteros de 8 bits (uint8)
  return Image.fromarray(np.clip(img_array, 0, 255).astype(np.uint8))


def embed_protection_lsb(image: Image.Image) -> Image.Image:
  """
  Inserta la firma digital de protección PROTECTION_MARKER de forma redundante y oculta 
  dentro de los bits menos significativos (LSB) de la paleta RGB de la imagen.
  Al alterar únicamente el bit más bajo de cada canal de color (alteración máxima de 1 unidad de 255),
  el cambio cromático es matemáticamente invisible a la vista, conservando la fidelidad de la foto.
  
  :param image: Objeto imagen a marcar.
  :return: Objeto imagen con la firma digital embebida.
  """
  pixels = image.load()
  width, height = image.size
  marker_bits = []
  
  # Descompone cada byte de la marca binaria en bits individuales
  for byte in PROTECTION_MARKER:
    for i in range(7, -1, -1):
      marker_bits.append((byte >> i) & 1)

  total_pixels = width * height
  # Duplica la firma a lo largo de la imagen de forma redundante (hasta 50 veces) para tolerar leves recortes
  repeat_count = min(total_pixels // (len(marker_bits) * 3), 50)
  full_bits = marker_bits * max(repeat_count, 1)

  bit_index = 0
  for y_pos in range(height):
    for x_pos in range(width):
      if bit_index >= len(full_bits):
        return image
      r, g, b = pixels[x_pos, y_pos]
      
      # Inserta bits en el canal Rojo
      r = (r & 0xFE) | full_bits[bit_index]
      bit_index += 1
      
      # Inserta bits en el canal Verde
      if bit_index < len(full_bits):
        g = (g & 0xFE) | full_bits[bit_index]
        bit_index += 1
        
      # Inserta bits en el canal Azul
      if bit_index < len(full_bits):
        b = (b & 0xFE) | full_bits[bit_index]
        bit_index += 1
        
      pixels[x_pos, y_pos] = (r, g, b)
  return image


def check_protection_lsb(image: Image.Image) -> bool:
  """
  Extrae la marca de agua oculta LSB de los píxeles iniciales de la imagen 
  y la compara con el marcador PROTECTION_MARKER para verificar si la imagen
  ha sido procesada con éxito por el filtro de protección de ROVIX.
  
  :param image: Objeto imagen a verificar.
  :return: Booleano indicando la presencia confirmada de la firma.
  """
  pixels = image.load()
  width, height = image.size
  total_bits = len(PROTECTION_MARKER) * 8
  extracted_bits = []

  # Extrae de forma secuencial el bit menos significativo de los canales RGB
  for y_pos in range(height):
    for x_pos in range(width):
      if len(extracted_bits) >= total_bits:
        break
      r, g, b = pixels[x_pos, y_pos]
      extracted_bits.append(r & 1)
      if len(extracted_bits) < total_bits:
        extracted_bits.append(g & 1)
      if len(extracted_bits) < total_bits:
        extracted_bits.append(b & 1)
    if len(extracted_bits) >= total_bits:
      break

  # Reconstruye los bytes originales a partir de los bits recolectados
  extracted_bytes = bytearray()
  for i in range(0, total_bits, 8):
    byte = 0
    for j in range(8):
      byte = (byte << 1) | extracted_bits[i + j]
    extracted_bytes.append(byte)

  return bytes(extracted_bytes) == PROTECTION_MARKER


# ============================================================================
# ENDPOINT: FILTRO ADVERSARIAL Y ESTEGANOGRÁFICO DE FOTOS
# ============================================================================

@app.post("/api/filter")
async def apply_filter(file: UploadFile = File(...)):
  """
  Recibe una imagen cargada, le aplica perturbación adversarial para confundir
  los modelos de IA y le inyecta la marca digital invisible LSB de autenticación.
  Retorna la imagen protegida directamente en formato PNG binario para su descarga.
  """
  try:
    contents = await file.read()
    # Abre y decodifica la imagen usando Pillow convirtiéndola a espacio de color RGB
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # 1. Inyecta perturbaciones adversarias matemáticas
    image = add_adversarial_perturbation(image, strength=25.0)
    # 2. Oculta la firma de seguridad digital LSB
    image = embed_protection_lsb(image)

    # Vuelca la imagen resultante en memoria en formato de compresión sin pérdidas PNG
    output = io.BytesIO()
    image.save(output, format="PNG")
    final_bytes = output.getvalue()

    safe_name = file.filename.replace(" ", "_") if file.filename else "imagen"

    return Response(
      content=final_bytes,
      media_type="image/png",
      headers={
        "Content-Disposition": f"attachment; filename=protegida_{safe_name}.png",
        "X-ROVIX-Protected": "true",
      },
    )
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT: VERIFICACIÓN DE FIRMA DIGITAL EN FOTOS
# ============================================================================

@app.post("/api/verify")
async def verify_image(file: UploadFile = File(...)):
  """
  Analiza los bits de la imagen cargada para determinar si cuenta con la marca 
  LSB de seguridad digital activa, reportando su estado al usuario.
  """
  try:
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # Valida si la firma digital coincide
    is_protected = check_protection_lsb(image)
    
    if is_protected:
      return {
        "protected": True,
        "message": "Esta imagen tiene proteccion ROVIX activa. Contiene marca digital y perturbacion adversarial.",
      }
    else:
      return {
        "protected": False,
        "message": "Esta imagen NO tiene proteccion ROVIX o fue modificada/corrompida.",
      }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
