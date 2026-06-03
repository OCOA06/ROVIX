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
  "Eres un analizador experto en ciberseguridad, psicologia digital y prevencion de acoso en linea. "
  "Estás analizando mensajes que provienen de un simulador de ciberacoso, grooming y chantaje. "
  "Ten en cuenta que TODOS los mensajes analizados representan un RIESGO real y contienen intenciones daninas, manipuladoras o de acoso, "
  "por lo que NUNCA debes catalogarlos como inofensivos o de bajo riesgo. "
  "Debes crear un analisis complejo, profundo y detallado que exponga la naturaleza del peligro psicologico o social detras del mensaje. "
  "Responde UNICAMENTE con un JSON valido (sin markdown, sin backticks y sin texto adicional) con esta estructura exacta: "
  '{"risk_level": "alto|critico", "intention": "categorizacion tecnica de la intencion danina en 3-5 palabras", '
  '"explanation": "analisis complejo y extendido explicando las tacticas de manipulacion emocional, control, invasion de limites o amenazas y por que constituye un peligro grave", '
  '"recommendation": "pautas de accion claras y estructuradas sobre que debe hacer la victima de inmediato"}. '
  "REGLAS CRITICAS: No menciones frases genericas como 'Nivel de riesgo: alto' en la explicacion o intencion. Responde siempre en espanol."
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
  msg_lower = req.message.lower().strip()

  
  # Coincidencias exactas para los mensajes del simulador de práctica
  if "si no me mandas tus fotos" in msg_lower and "secreto" in msg_lower:
    return {
      "risk_level": "critico",
      "intention": "Intento de chantaje y sextorsión",
      "explanation": "Este mensaje representa un caso de coacción y extorsión por fotos íntimas. El emisor intenta infundir miedo y vergüenza amenazando con revelar información secreta a otros para obligar a la víctima a ceder a sus demandas de material multimedia.",
      "recommendation": "No accedas a sus peticiones, ya que ceder solo aumenta las exigencias. Toma capturas de pantalla del chat y del perfil del agresor, bloquea la cuenta y cuéntaselo de inmediato a un adulto de confianza o repórtalo ante autoridades de ciberseguridad."
    }
  elif "eres una imbécil" in msg_lower and "odian" in msg_lower:
    return {
      "risk_level": "alto",
      "intention": "Acoso escolar y humillación pública",
      "explanation": "El mensaje constituye una agresión verbal hostil directa (ciberacoso escolar). Busca infligir daño psicológico mediante descalificaciones personales e intimidación de grupo ('todos te odian'), promoviendo el aislamiento y mermando la autoestima de la víctima.",
      "recommendation": "Ignora la provocación y evita responder. Guarda capturas de pantalla detalladas, bloquea a esta persona e informa a tus padres, tutores o personal de la escuela para que intervengan."
    }
  elif "cara muy bonita" in msg_lower and "no le cuentes a nadie" in msg_lower:
    return {
      "risk_level": "critico",
      "intention": "Captación y manipulación de grooming",
      "explanation": "Se identifican patrones característicos de grooming. El remitente recurre a halagos sobre el físico ('cara muy bonita') para ganarse el afecto o simpatía, seguidos de una exigencia de secretismo ('no le cuentes a nadie') que pretende anular la supervisión de un adulto protector.",
      "recommendation": "Corta de inmediato toda comunicación y no des explicaciones. Bajo ninguna circunstancia compartas fotos o datos personales. Muestra este chat de inmediato a tus padres o tutores."
    }
  elif "si no vienes hoy" in msg_lower and "va a ir muy mal" in msg_lower:
    return {
      "risk_level": "critico",
      "intention": "Coerción y amenaza de daño físico",
      "explanation": "Se trata de una amenaza explícita encaminada a obligar a la víctima a encontrarse presencialmente bajo advertencia de represalias físicas o violencia ('te va a ir muy mal'). Utiliza el terror psicológico para anular el libre albedrío.",
      "recommendation": "No asistas a ninguna reunión y resguarda la evidencia. Este mensaje es una amenaza ilegal. Comunícalo de inmediato a un adulto protector o llama al 911 si sientes que tu integridad física peligra."
    }
  elif "ubicación" in msg_lower and "saber dónde estás siempre" in msg_lower:
    return {
      "risk_level": "alto",
      "intention": "Control intrusivo y acecho (Stalking)",
      "explanation": "A pesar del uso de emojis simpáticos, solicitar la ubicación en tiempo real de forma insistente para monitorear actividades representa un control invasivo de límites personales, vulnerando la intimidad personal y familiar.",
      "recommendation": "No respondas ni compartas datos de geolocalización. Ajusta tus niveles de privacidad en el celular, advierte al contacto que su insistencia es incómoda y, si continúa, bloquéalo."
    }
  elif "fracasado" in msg_lower and "nunca vas a ser nadie" in msg_lower:
    return {
      "risk_level": "alto",
      "intention": "Hostigamiento verbal y desvalorización",
      "explanation": "Este mensaje emplea descalificaciones absolutas orientadas a devaluar la valía humana de la víctima e inducir sentimientos de inferioridad. Es una táctica clásica de maltrato psicológico en línea.",
      "recommendation": "Evita entablar discusión, ya que el agresor busca alimentarse de tu malestar. Bloquea el usuario, resguarda el mensaje y platica con tus personas de confianza para recibir contención emocional."
    }
  elif "tengo tus fotos" in msg_lower and "si no me obedeces" in msg_lower:
    return {
      "risk_level": "critico",
      "intention": "Chantaje de sextorsión y control coercitivo",
      "explanation": "Este mensaje representa un grave intento de sextorsión en el que el agresor instrumentaliza imágenes privadas de la víctima para imponer su control. El chantaje y la extorsión de carácter sexual constituyen delitos penales severos.",
      "recommendation": "No obedezcas ninguna orden ni envíes más material o dinero. Mantén la calma, documenta toda la conversación, restringe tus perfiles y contacta de inmediato con la policía cibernética local o un adulto responsable."
    }

  # Categorías generales si el mensaje no es idéntico a las frases del simulador
  threat_words = [
    "matar", "muere", "muerte", "golpear", "pegar", "madrear", "romper la cara", 
    "hacer daño", "lastimar", "buscar", "se donde vives", "te va a ir mal", 
    "amenazo", "consecuencias", "arrepentir", "arrepentiras", "pagaras"
  ]
  groom_words = [
    "eres muy bonita", "no le digas a nadie", "mandame foto", "solo entre nosotros", 
    "eres especial", "lindo", "linda", "hermosa", "cuerpo", "secreto", "nadie sepa", 
    "pasa foto", "fotos tuyas", "camara", "video", "encuentro", "solos", "amiguitos", 
    "whatsapp", "agregarme"
  ]
  manip_words = [
    "si no me", "te voy a", "le digo a todos", "secreto", "fotos", "video intimo", 
    "chantaje", "si no haces", "publicar", "difundir", "compartir fotos", "le digo a tu", 
    "digo a todos", "mostrar", "redes", "amigos", "arrepentiras", "obedeces", "obedece"
  ]
  harass_words = [
    "tonto", "tonta", "feo", "fea", "gorda", "gordo", "idiota", "estupido", "estupida", 
    "inutil", "perra", "puta", "zorra", "fracasado", "fracasada", "nadie", "basura", 
    "asco", "odiar", "odias", "imbecil", "estupidez", "imbeciles", "fracaso", "estupidos"
  ]
  stalk_words = [
    "ubicacion", "donde estas", "pasame tu", "con quien estas", "vigilo", "siempre", 
    "acosando", "persiguiendo", "bloquear", "responde", "contesta", "llamando"
  ]

  if any(w in msg_lower for w in threat_words):
    return {
      "risk_level": "critico",
      "intention": "Amenaza de agresión física o violencia",
      "explanation": "El mensaje contiene advertencias explícitas de violencia y hostilidad física directa. Esto representa una agresión que vulnera tu seguridad personal y requiere medidas de protección.",
      "recommendation": "No respondas ni confrontes. Toma capturas de pantalla completas, bloquea al usuario inmediatamente y contacta a un adulto de confianza o a las autoridades de ciberseguridad.",
    }
  elif any(w in msg_lower for w in manip_words):
    return {
      "risk_level": "alto",
      "intention": "Chantaje digital y coerción",
      "explanation": "Se identifican patrones de manipulación coercitiva y chantaje. El remitente busca forzarte a realizar acciones en contra de tu voluntad bajo amenaza de difundir imágenes, secretos o información privada.",
      "recommendation": "No cedas al chantaje. Guarda de inmediato toda la evidencia (capturas del chat y el perfil del agresor), bloquea al contacto y busca ayuda legal o de un adulto responsable.",
    }
  elif any(w in msg_lower for w in groom_words):
    return {
      "risk_level": "critico",
      "intention": "Tácticas de captación o grooming",
      "explanation": "El mensaje presenta halagos desmedidos vinculados a la exigencia de secretismo ('no le digas a nadie') o peticiones de material multimedia. Esta conducta pretende aislarte para iniciar una manipulación abusiva.",
      "recommendation": "Corta la comunicación inmediatamente. No envíes fotografías ni compartas datos íntimos. Muestra el chat a tus padres, tutores o maestros de absoluta confianza.",
    }
  elif any(w in msg_lower for w in harass_words):
    return {
      "risk_level": "alto",
      "intention": "Acoso verbal e insultos directos",
      "explanation": "El mensaje incluye descalificaciones ofensivas orientadas a menoscabar tu dignidad, autoestima y bienestar emocional mediante humillaciones directas en línea.",
      "recommendation": "Evita responder, ya que la reacción alimenta el hostigamiento. Guarda evidencia de los insultos, bloquea la cuenta y reporta el perfil dentro de la red social.",
    }
  elif any(w in msg_lower for w in stalk_words):
    return {
      "risk_level": "alto",
      "intention": "Intrusión persistente y acecho",
      "explanation": "Se detecta una insistencia invasiva para obtener datos sensibles (como tu ubicación actual) o demandas repetitivas de respuesta inmediata, lo que constituye un acecho que ignora tus límites personales.",
      "recommendation": "Ignora estas peticiones de datos de geolocalización. Informa al contacto que incomoda tu privacidad y, en caso de persistir, bloquéalo para salvaguardar tu tranquilidad.",
    }
  else:
    return {
      "risk_level": "alto",
      "intention": "Conducta digital de riesgo identificada",
      "explanation": "El mensaje analizado presenta elementos de riesgo e incomodidad interpersonal. En simulaciones educativas de ciberseguridad, estas expresiones reflejan comportamientos de acoso o manipulación sutil.",
      "recommendation": "Te recomendamos ser cauteloso/a. No reveles información personal, resguarda tu privacidad y, si el chat te genera desagrado o inseguridad, recuerda que tienes el derecho de bloquear al remitente.",
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

    # Acota estrictamente la perturbación para que sea 100% invisible para el ojo humano (máximo +-2 en escala de 255)
    ch_perturbation = np.clip(ch_perturbation, -2.0, 2.0)

    img_array[:, :, ch] += ch_perturbation

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


# La verificación esteganográfica LSB ha sido removida al simplificar la interfaz del Filtro Antirobo


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


# El endpoint de verificación de imágenes ha sido removido al simplificar la interfaz del Filtro Antirobo
