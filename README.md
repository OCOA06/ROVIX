# ROVIX - Plataforma Integral de Prevención de Ciberacoso y Seguridad Digital

ROVIX es una solución tecnológica avanzada diseñada para concientizar, prevenir y proteger a los usuarios frente a situaciones de ciberacoso (bullying, grooming, amenazas y chantaje emocional) en entornos digitales. El proyecto consta de dos ecosistemas integrados y complementarios: una Plataforma Web Interactiva (con backend inteligente de análisis e inmunización de imágenes) y una Extensión de Navegador Activa de funcionamiento local para protección en tiempo real durante la navegación.

---

## Estructura del Repositorio

El proyecto se encuentra organizado bajo el siguiente esquema de directorios:

```text
ROVIX/
├── plataforma_ciberacoso/        # Plataforma Web Completa
│   ├── backend/                  # Servidor de análisis e inmunización (FastAPI)
│   │   ├── main.py               # Lógica del servidor, análisis IA y algoritmos esteganográficos
│   │   └── requirements.txt      # Dependencias de Python
│   └── frontend/                 # Aplicación de usuario interactiva (Vite + React)
│       ├── src/
│       │   ├── components/       # Componentes del simulador, filtro de fotos y guías
│       │   └── config.js         # Configuración centralizada de la API
│       ├── package.json          # Dependencias de NodeJS
│       └── tailwind.config.js    # Estilos visuales
└── rovix_extension_navegador/    # Extensión de Chrome Manifest v3 (ROVIX Guard v2.0)
    ├── background.js             # Motor de análisis semántico local y asertivo
    ├── content.js                # Inyección del escudo protector y panel interactivo en páginas web
    ├── popup.html / popup.js     # Interfaz de control rápido de la extensión
    └── manifest.json             # Configuración del navegador (Privacidad y permisos locales)
```

---

## Características Principales

### 1. Plataforma Web de Prevención (plataforma_ciberacoso)
* **Simulador de Chat e Intenciones con Inteligencia Artificial**: Un entorno de mensajería seguro donde el usuario puede interactuar con ROVIX (un chatbot experto en seguridad digital) o hacer clic en mensajes simulados potencialmente dañinos para obtener un análisis técnico detallado sobre la intención del remitente (acoso, grooming, amenaza directa o chantaje).
* **Filtro de Inmunización de Imágenes (Filtro Antirobo contra IA Scraping)**:
  - **Invisibilidad Absoluta (Adversarial Perturbation)**: Aplica perturbaciones matemáticas de alta frecuencia y ruido por bloques acotados estrictamente a un rango de **±2 unidades de brillo (de 255)** en los canales de color. La protección matemática confunde por completo a los modelos de inteligencia artificial generativa (Stable Diffusion, Midjourney) inhabilitando la clonación o alteración de rostros, pero es **totalmente invisible e imperceptible al ojo humano**, garantizando que la foto conserve una fidelidad visual perfecta libre de grano o sal y pimienta.
  - **Hilvanado Esteganográfico (LSB)**: Inserta una marca de agua digital invisible en los bits menos significativos (LSB) de los colores de la imagen para firmar la procedencia de seguridad.
  - **Flujo UX de Doble Acción Dinámica**: Permite cambiar o quitar imágenes cargadas con un solo clic (`Quitar foto` con icono de papelera) y reiniciar de manera ágil el panel tras una protección exitosa (`Proteger otra foto` / `Borrar foto`) para evitar confusiones de uso.
* **Guías Educativas de Prevención**: Acceso interactivo y descarga de recursos en PDF oficiales sobre igualdad de género (alineados al ODS 5 de la ONU) y guías paso a paso de acción inmediata sobre qué hacer ante casos de acoso y hostigamiento digital en México.
* **Borde Circular Protector en Logotipo**: Enmarcado del logo oficial de ROVIX con una delgada línea circular blanca (`border-2 border-white`) para evitar la pérdida de contraste sobre los fondos de color rojo.

### 2. Extensión de Navegador (rovix_extension_navegador - ROVIX Guard v2.0)
* **Escudo Activo en Navegación**: Monitorea campos de texto (input, textarea y editores enriquecidos) en cualquier sitio web que visite el usuario.
* **Privacidad Absoluta (Offline-First)**: El motor semántico se ejecuta en su totalidad de manera local dentro del Service Worker utilizando reglas regex de alto rendimiento.
* **Sin Dependencia de API Keys**: No requiere conexión a internet, no envía datos a servidores externos y no requiere llaves de Gemini, garantizando que el texto ingresado nunca salga del equipo local.
* **Alternativas Asertivas**: Si el usuario redacta un mensaje con lenguaje hostil o inapropiado, la extensión despliega un panel flotante que resalta las frases problemáticas, explica el riesgo implicado y ofrece una alternativa de comunicación asertiva que puede aplicarse con un solo clic.

---

## Requisitos e Instalación

### Requisitos Previos
* **Node.js** (versión 18.0 o superior)
* **Python** (versión 3.10 o superior)
* Navegador web basado en Chromium (Google Chrome, Microsoft Edge, Brave)

---

### 1. Configuración del Backend (Servidor de Inteligencia)

1. Abra una terminal y diríjase al directorio del backend:
   ```bash
   cd plataforma_ciberacoso/backend
   ```
2. Cree un entorno virtual de Python:
   ```bash
   python -m venv venv
   ```
3. Active el entorno virtual:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
4. Instale las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
5. Inicie el servidor de producción/desarrollo:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *El servidor backend estará disponible en la dirección local: `http://localhost:8000`*

---

### 2. Configuración del Frontend (Interfaz de Usuario)

1. En una nueva terminal, acceda al directorio del frontend:
   ```bash
   cd plataforma_ciberacoso/frontend
   ```
2. Instale los paquetes de NodeJS correspondientes:
   ```bash
   npm install
   ```
3. Inicie el servidor local en modo desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación web estará disponible en la dirección local: `http://localhost:5173`*

---

### 3. Configuración e Instalación de la Extensión (ROVIX Guard)

1. Abra su navegador web (Chrome, Edge o similar).
2. Acceda a la sección de administración de extensiones en: `chrome://extensions/`
3. Active el **"Modo de desarrollador"** (ubicado en el extremo superior derecho).
4. Haga clic en el botón **"Cargar descomprimida"** (ubicado en el extremo superior izquierdo).
5. Seleccione el directorio **`rovix_extension_navegador`** que se encuentra en la raíz de este proyecto.
6. La extensión quedará activa y lista para su funcionamiento en tiempo real.

---

## Tecnologías Utilizadas

### Frontend (Plataforma Web)
* **React** + **Vite**: Desarrollo ágil de la interfaz reactiva.
* **Tailwind CSS**: Estilizado moderno y responsivo.
* **Lucide Icons**: Set de iconos vectoriales consistentes.
* **Axios**: Comunicación fluida con el backend.

### Backend (Inteligencia de Datos)
* **FastAPI**: Framework web Python asíncrono de alto rendimiento.
* **NumPy**: Procesamiento matricial de imágenes de alta velocidad para la perturbación adversarial.
* **Pillow (PIL)**: Manipulación de formatos de imagen y codificación esteganográfica invisible.
* **g4f (GPT4Free)**: Integración híbrida para consultas inteligentes con IA en el chatbot.

### Extensión de Navegador
* **Chrome Extension API (Manifest v3)**: API moderna de extensiones que incluye Service Workers en background para eficiencia energética.
* **JavaScript Nativo (ES6)**: Enrutado dinámico de eventos de teclado e inyección no intrusiva de componentes flotantes.

---

## Detalles Técnicos de las Innovaciones

### Inmunización Adversarial Invisible de Imágenes
El algoritmo `add_adversarial_perturbation` de ROVIX añade ruido estructurado utilizando ondas senoidales y cosenoidales cruzadas sobre los canales RGB de la imagen. La perturbación matemática base se calcula usando:

$$\text{Ruido} = A \cdot \sin(x \cdot k_1 + y \cdot k_2) + B \cdot \cos(x \cdot k_3 - y \cdot k_4)$$

Para asegurar una **invisibilidad absoluta** que conserve la estética exacta de la foto frente al usuario, el backend trunca rígidamente la inyección total de ruido en cada píxel mediante acotamiento de norma L-infinito a un umbral máximo de $\pm2$:

$$\text{Ruido\_Acotado} = \text{clip}(\text{Ruido}, -2.0, 2.0)$$

Esta acotación física inyecta vectores defensivos de alta frecuencia en los bits de menor significancia, suficientes para desviar los tensores latentes de las IAs de visión y difusión (como Stable Diffusion, Midjourney o Gemini Vision) e inducirles fallos de reconocimiento o distorsiones masivas al modificar la foto, mientras se conserva una legibilidad visual 100% indistinguible al ojo humano.
