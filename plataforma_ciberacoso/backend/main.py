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


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class AnalyzeRequest(BaseModel):
    message: str


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

REJECT_PHRASES = [
    "log in", "sign in", "please login", "create an account",
    "iniciar sesion", "access denied", "rate limit",
    "i'm sorry, but i can't", "as an ai language model",
]


@app.post("/api/chat")
async def chat_api(req: ChatRequest):
    messages_list = [{"role": "system", "content": SYSTEM_PROMPT}]

    if req.history:
        for entry in req.history[-12:]:
            messages_list.append({"role": entry.role, "content": entry.content})

    messages_list.append({"role": "user", "content": req.message})

    client = Client()

    for provider in PROVIDERS_TO_TRY:
        for model in MODELS_TO_TRY:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages_list,
                    provider=provider,
                    timeout=25,
                )
                text = response.choices[0].message.content
                if text and len(text.strip()) > 15:
                    text_lower = text.lower()
                    if not any(phrase in text_lower for phrase in REJECT_PHRASES):
                        return {"response": text.strip()}
            except Exception:
                continue

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_list,
            timeout=30,
        )
        text = response.choices[0].message.content
        if text and len(text.strip()) > 10:
            return {"response": text.strip()}
    except Exception:
        pass

    user_msg = req.message.lower()
    if any(w in user_msg for w in ["acoso", "acosan", "molesta", "bullying", "insulta"]):
        return {
            "response": (
                "Entiendo tu situacion y lamento que estes pasando por esto. "
                "Aqui van pasos concretos:\n\n"
                "1. **Guarda evidencia**: Toma capturas de pantalla de todo.\n"
                "2. **Bloquea al agresor**: No respondas a provocaciones.\n"
                "3. **Reporta**: Usa la funcion de reporte de la plataforma.\n"
                "4. **Habla con alguien**: Cuentale a un adulto de confianza, maestro o familiar.\n"
                "5. **Busca ayuda profesional**: Si sientes ansiedad o miedo, busca apoyo psicologico.\n\n"
                "No estas solo/a. El acoso NO es tu culpa."
            )
        }
    elif any(w in user_msg for w in ["foto", "imagen", "fotos", "proteger", "privacidad"]):
        return {
            "response": (
                "Para proteger tus fotos e imagenes en linea:\n\n"
                "1. **Usa nuestro filtro antirobo**: Ve a la seccion de Filtro de Fotos y aplica la proteccion.\n"
                "2. **Configura tu privacidad**: Pon tus redes sociales en modo privado.\n"
                "3. **No compartas fotos intimas**: Nunca envies fotos comprometedoras a nadie.\n"
                "4. **Marca de agua**: Considera agregar marcas de agua a tus fotos importantes.\n"
                "5. **Revisa permisos**: Revisa que apps tienen acceso a tu galeria.\n\n"
                "Puedo ayudarte con algo mas especifico?"
            )
        }
    elif any(w in user_msg for w in ["hola", "hi", "hey", "buenos", "buenas", "que tal"]):
        return {
            "response": (
                "Hola! Soy ROVIX, tu asistente de seguridad digital. "
                "Estoy aqui para ayudarte con cualquier tema de ciberseguridad o ciberacoso. "
                "Puedes preguntarme sobre:\n\n"
                "- Como proteger tus redes sociales\n"
                "- Que hacer si te acosan en linea\n"
                "- Como proteger tus fotos\n"
                "- Consejos de privacidad digital\n\n"
                "En que puedo ayudarte?"
            )
        }
    elif any(w in user_msg for w in ["bloquear", "bloqueo", "reportar", "reporte"]):
        return {
            "response": (
                "Para bloquear y reportar a alguien:\n\n"
                "**Instagram**: Ve al perfil > tres puntos > Bloquear/Reportar\n"
                "**Facebook**: Ve al perfil > tres puntos > Bloquear/Reportar\n"
                "**WhatsApp**: Abre el chat > tres puntos > Mas > Bloquear\n"
                "**TikTok**: Ve al perfil > tres puntos > Bloquear/Reportar\n\n"
                "Siempre guarda capturas ANTES de bloquear para tener evidencia. "
                "Necesitas ayuda con alguna plataforma especifica?"
            )
        }
    elif any(w in user_msg for w in ["amenaza", "amenazas", "miedo", "peligro"]):
        return {
            "response": (
                "Si alguien te amenaza, esto es SERIO. Sigue estos pasos:\n\n"
                "1. **NO respondas** a la amenaza.\n"
                "2. **Guarda TODO**: Capturas de pantalla con fecha y hora.\n"
                "3. **Cuentale a un adulto** de confianza inmediatamente.\n"
                "4. **Reporta en la plataforma** donde ocurrio.\n"
                "5. **Si es una amenaza real de violencia**, llama a las autoridades (911).\n\n"
                "Las amenazas en linea son un delito. No tienes que enfrentar esto solo/a."
            )
        }
    else:
        return {
            "response": (
                "Gracias por tu mensaje. Como asistente de seguridad digital, puedo ayudarte con:\n\n"
                "- **Ciberacoso**: Que hacer si te molestan en linea\n"
                "- **Privacidad**: Como proteger tus cuentas y datos\n"
                "- **Fotos**: Como evitar que usen tus imagenes sin permiso\n"
                "- **Amenazas**: Pasos a seguir si te amenazan\n"
                "- **Redes sociales**: Como configurar tu seguridad\n\n"
                "Cuentame mas sobre tu situacion y te dare consejos personalizados."
            )
        }


@app.post("/api/analyze")
async def analyze_message(req: AnalyzeRequest):
    analyze_messages = [
        {"role": "system", "content": ANALYZE_PROMPT},
        {"role": "user", "content": f'Analiza este mensaje: "{req.message}"'},
    ]

    client = Client()

    for provider in PROVIDERS_TO_TRY:
        for model in MODELS_TO_TRY:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=analyze_messages,
                    provider=provider,
                    timeout=25,
                )
                text = response.choices[0].message.content
                if text and len(text.strip()) > 20:
                    text = text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                    try:
                        result = json.loads(text)
                        if "risk_level" in result and "explanation" in result:
                            return result
                    except json.JSONDecodeError:
                        pass
            except Exception:
                continue

    msg_lower = req.message.lower()
    threat_words = ["matar", "muere", "muerte", "golpear", "pegar"]
    harass_words = ["tonto", "feo", "gorda", "idiota", "estupido", "inutil", "perra", "puta", "zorra"]
    manip_words = ["si no me", "te voy a", "le digo a todos", "secreto", "fotos", "video intimo"]
    groom_words = ["eres muy bonita", "no le digas a nadie", "mandame foto", "solo entre nosotros", "eres especial"]

    if any(w in msg_lower for w in threat_words):
        return {
            "risk_level": "critico",
            "intention": "Amenaza directa de violencia",
            "explanation": "El mensaje contiene amenazas explicitas de violencia fisica. Esto es extremadamente peligroso y constituye un delito.",
            "recommendation": "Guarda este mensaje como evidencia, no respondas, contacta a un adulto de confianza inmediatamente y reporta a las autoridades (911).",
        }
    elif any(w in msg_lower for w in groom_words):
        return {
            "risk_level": "critico",
            "intention": "Posible grooming o manipulacion",
            "explanation": "El mensaje muestra patrones tipicos de grooming: halagos excesivos, secretismo y solicitud de contenido privado. Esta es una tecnica de manipulacion peligrosa.",
            "recommendation": "No compartas ninguna informacion personal o fotos. Bloquea a esta persona. Cuentale a un adulto de confianza lo que esta pasando.",
        }
    elif any(w in msg_lower for w in manip_words):
        return {
            "risk_level": "alto",
            "intention": "Chantaje o manipulacion emocional",
            "explanation": "El mensaje contiene elementos de chantaje o manipulacion. La persona intenta presionarte usando amenazas indirectas o tu informacion privada.",
            "recommendation": "No cedas ante el chantaje. Guarda capturas de pantalla. Habla con un adulto de confianza y considera reportar a las autoridades.",
        }
    elif any(w in msg_lower for w in harass_words):
        return {
            "risk_level": "alto",
            "intention": "Insultos y acoso verbal",
            "explanation": "El mensaje contiene insultos directos que constituyen ciberacoso. Nadie tiene derecho a tratarte asi.",
            "recommendation": "No respondas al insulto. Bloquea a la persona, reporta en la plataforma y guarda la evidencia.",
        }
    else:
        return {
            "risk_level": "bajo",
            "intention": "Mensaje sin riesgo aparente",
            "explanation": "No se detectaron patrones evidentes de amenaza, acoso o manipulacion en este mensaje. Sin embargo, el contexto completo de la conversacion puede revelar mas.",
            "recommendation": "Si aun asi te sientes incomodo/a con este mensaje, confia en tu instinto y habla con alguien de confianza.",
        }


PROTECTION_MARKER = b"ROVIX_PROTECTED_v2"


def add_adversarial_perturbation(image: Image.Image, strength: float = 25.0) -> Image.Image:
    img_array = np.array(image, dtype=np.float64)
    h, w, c = img_array.shape

    x = np.arange(w, dtype=np.float64)
    y = np.arange(h, dtype=np.float64)
    xx, yy = np.meshgrid(x, y)

    high_freq_1 = np.sin(xx * 2.7 + yy * 3.1) * strength * 0.15
    high_freq_2 = np.cos(xx * 4.3 - yy * 2.8) * strength * 0.12
    high_freq_3 = np.sin((xx * 5.5 + yy * 4.2) * 0.7) * strength * 0.10
    high_freq_4 = np.cos((xx - yy) * 3.9) * strength * 0.08

    cross_hatch = (
        np.sin(xx * 6.0) * np.cos(yy * 6.0) * strength * 0.10
        + np.sin((xx + yy) * 4.5) * np.cos((xx - yy) * 3.5) * strength * 0.08
    )

    grid_x = (np.mod(xx, 8) < 4).astype(np.float64) * 2 - 1
    grid_y = (np.mod(yy, 8) < 4).astype(np.float64) * 2 - 1
    checker = grid_x * grid_y * strength * 0.06

    seed = int(np.sum(img_array[:8, :8, :].ravel()) * 7) % (2**31)
    rng = np.random.RandomState(seed)
    random_noise = rng.uniform(-strength * 0.20, strength * 0.20, (h, w))

    block_size = 4
    block_noise = rng.uniform(-strength * 0.15, strength * 0.15,
                              (h // block_size + 1, w // block_size + 1))
    block_expanded = np.repeat(np.repeat(block_noise, block_size, axis=0), block_size, axis=1)[:h, :w]

    base_perturbation = (
        high_freq_1 + high_freq_2 + high_freq_3 + high_freq_4
        + cross_hatch + checker + random_noise + block_expanded
    )

    for ch in range(c):
        channel = img_array[:, :, ch]
        gradient_x = np.zeros_like(channel)
        gradient_y = np.zeros_like(channel)
        gradient_x[:, 1:] = channel[:, 1:] - channel[:, :-1]
        gradient_y[1:, :] = channel[1:, :] - channel[:-1, :]

        edge_mask = np.sqrt(gradient_x**2 + gradient_y**2)
        edge_mask = edge_mask / (np.max(edge_mask) + 1e-8)

        ch_perturbation = base_perturbation * (1.0 + edge_mask * 0.5)

        phase_shift = rng.uniform(0, 2 * np.pi)
        ch_perturbation += np.sin(xx * 3.2 + phase_shift) * np.cos(yy * 2.8 + phase_shift) * strength * 0.05

        img_array[:, :, ch] += ch_perturbation

    pixel_mask = rng.random((h, w)) < 0.03
    for ch in range(c):
        flip = rng.choice([-strength * 0.8, strength * 0.8], size=(h, w))
        img_array[:, :, ch] += pixel_mask * flip

    return Image.fromarray(np.clip(img_array, 0, 255).astype(np.uint8))


def embed_protection_lsb(image: Image.Image) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    marker_bits = []
    for byte in PROTECTION_MARKER:
        for i in range(7, -1, -1):
            marker_bits.append((byte >> i) & 1)

    total_pixels = width * height
    repeat_count = min(total_pixels // (len(marker_bits) * 3), 50)

    full_bits = marker_bits * max(repeat_count, 1)

    bit_index = 0
    for y_pos in range(height):
        for x_pos in range(width):
            if bit_index >= len(full_bits):
                return image
            r, g, b = pixels[x_pos, y_pos]
            r = (r & 0xFE) | full_bits[bit_index]
            bit_index += 1
            if bit_index < len(full_bits):
                g = (g & 0xFE) | full_bits[bit_index]
                bit_index += 1
            if bit_index < len(full_bits):
                b = (b & 0xFE) | full_bits[bit_index]
                bit_index += 1
            pixels[x_pos, y_pos] = (r, g, b)
    return image


def check_protection_lsb(image: Image.Image) -> bool:
    pixels = image.load()
    width, height = image.size
    total_bits = len(PROTECTION_MARKER) * 8
    extracted_bits = []

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

    extracted_bytes = bytearray()
    for i in range(0, total_bits, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | extracted_bits[i + j]
        extracted_bytes.append(byte)

    return bytes(extracted_bytes) == PROTECTION_MARKER


@app.post("/api/filter")
async def apply_filter(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        image = add_adversarial_perturbation(image, strength=25.0)
        image = embed_protection_lsb(image)

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


@app.post("/api/verify")
async def verify_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
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
