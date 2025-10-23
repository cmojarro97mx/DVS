# 🎙️ Guía de Voces del Asistente Virtual

## 📱 Mejoras Implementadas

El asistente virtual ahora utiliza **Web Speech API** optimizada para:

### ✅ Características
- **100% Open Source** - Sin costos de API
- **Selección inteligente de voces** - Prioriza voces premium y neurales
- **Compatible con todos los dispositivos** - Desktop, móvil, tablets
- **Calidad mejorada** - Rate optimizado a 0.95 para mejor naturalidad

### 🔍 Sistema de Selección de Voces

El sistema busca automáticamente las mejores voces en este orden:

1. **Voces Premium/Enhanced** (Google, Microsoft)
2. **Voces Neurales** (Neural TTS)
3. **Voces de alta calidad** (Monica, Paulina, Diego)
4. **Voces estándar en español**

---

## 🎯 Cómo Obtener las Mejores Voces

### 🍎 **iOS / macOS**

**Voces incluidas:**
- Mónica (español de España) - Muy natural
- Paulina (español de México) - Excelente calidad
- Juan (español) - Voz masculina clara

**Agregar más voces:**
1. Ve a **Ajustes** > **Accesibilidad** > **Contenido Hablado**
2. Toca **Voces** > **Español**
3. Descarga voces de **Calidad Premium** (marcadas con ⭐)
4. Las voces premium son mucho más naturales

**Mejores voces iOS:**
- Mónica (Premium) - ⭐⭐⭐⭐⭐
- Paulina (Premium) - ⭐⭐⭐⭐⭐

---

### 🤖 **Android**

**Instalar voces de Google:**
1. Abre **Google Play Store**
2. Busca "**Text-to-Speech**" o "**Voz de Google**"
3. Instala el motor de síntesis de voz de Google
4. Ve a **Ajustes** > **Sistema** > **Idiomas y entrada** > **Salida de texto a voz**
5. Selecciona **Motor de Google** como predeterminado
6. Descarga paquetes de voz en **español de alta calidad**

**Voces recomendadas:**
- Voz de Google (español ES) - Neural
- Voz de Google (español MX) - Neural
- Voz de Google (español US) - Neural

---

### 💻 **Windows**

**Voces Microsoft Neural:**
1. Ve a **Configuración** > **Hora e idioma** > **Voz**
2. Haz clic en **Agregar voces**
3. Descarga voces en español:
   - **Elena (España)** - Neural TTS
   - **Alvaro (España)** - Neural TTS

**Voces de terceros (opcionales):**
- Puedes instalar voces SAPI5 adicionales
- Ivona y CereProc tienen voces de alta calidad

---

### 🐧 **Linux**

**Instalar eSpeak-NG mejorado:**
```bash
sudo apt install espeak-ng espeak-ng-data
```

**Instalar Piper TTS (mejor calidad):**
```bash
# Instalar Piper
pip install piper-tts

# Descargar modelo en español
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/es_ES-sharvie-medium.onnx
```

---

### 🌐 **Chrome / Edge (cualquier sistema)**

**Usar voces de Google:**
1. Chrome en Desktop usa automáticamente voces del sistema
2. Pero también puede acceder a voces en línea de Google
3. Las voces en línea suenan más naturales

**En la consola del navegador (F12):**
```javascript
// Ver todas las voces disponibles
speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.name, voice.lang, voice.localService);
});
```

---

## 🎚️ Ajustes Técnicos Implementados

### Configuración actual del asistente:
```javascript
utterance.rate = 0.95;   // Velocidad ligeramente más lenta (más natural)
utterance.pitch = 1.0;   // Tono normal
utterance.volume = 1.0;  // Volumen máximo
```

**Rate (Velocidad):**
- `0.95` - Ligeramente más lento que normal (MÁS NATURAL) ✅ Actual
- `1.0` - Velocidad normal
- `1.2` - Más rápido

**Pitch (Tono):**
- `0.8` - Voz más grave
- `1.0` - Tono normal ✅ Actual
- `1.2` - Voz más aguda

---

## 🐛 Solución de Problemas

### ❌ "No escucho nada en móvil"

**Solución:**
1. Verifica que el volumen del dispositivo esté alto
2. Desactiva el modo silencioso
3. Asegúrate de que el botón 🔊 en el asistente esté activado (no silenciado)
4. En iOS, verifica que "Contenido Hablado" esté habilitado en Accesibilidad
5. Cierra y vuelve a abrir el navegador

### ❌ "La voz suena robotizada"

**Solución:**
1. Descarga voces **Premium** o **Neural** en tu dispositivo
2. En iOS: Ajustes > Accesibilidad > Voces > Descargar Premium
3. En Android: Instala "Motor de síntesis de voz de Google"
4. En Windows: Descarga voces Neural de Microsoft
5. Verifica en la consola del navegador qué voz está usando:
   ```javascript
   // Presiona F12 y ejecuta:
   speechSynthesis.getVoices().forEach(v => console.log(v.name));
   ```

### ❌ "Se corta a mitad de mensaje largo"

**Solución:**
- Esto es una limitación conocida de Web Speech API
- El sistema ya está optimizado para prevenir esto con `setTimeout`
- Si ocurre, la voz se reiniciará automáticamente

---

## 🚀 Alternativas Futuras (Open Source)

Si en el futuro quieres voces AÚN mejores sin usar APIs de pago:

### Opción 1: Piper TTS (Backend)
```bash
# Instalar en el servidor
pip install piper-tts

# Usar desde Python
from piper import PiperVoice

voice = PiperVoice.load("es_ES-sharvie-medium.onnx")
audio = voice.synthesize("Hola, soy tu asistente")
```

### Opción 2: Kokoro-82M (Mejor calidad)
```python
# Requiere más recursos pero mejor calidad
pip install kokoro

from kokoro import KPipeline
pipeline = KPipeline(lang_code='es')
audio = pipeline("Hola, soy tu asistente", voice='es_female')
```

### Opción 3: Coqui TTS (Voice Cloning)
```python
# Clonación de voz
from TTS.api import TTS

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
tts.tts_to_file(
    text="Hola",
    speaker_wav="mi_voz.wav",  # Usa tu propia voz
    language="es",
    file_path="salida.wav"
)
```

---

## 📊 Comparación de Calidad

| Método | Calidad | Móvil | Offline | Costo |
|--------|---------|-------|---------|-------|
| Web Speech (básico) | ⭐⭐⭐ | ✅ | ✅ | Gratis |
| Web Speech (Premium) | ⭐⭐⭐⭐ | ✅ | ✅ | Gratis |
| Piper TTS | ⭐⭐⭐⭐ | ❌ | ✅ | Gratis |
| Kokoro-82M | ⭐⭐⭐⭐⭐ | ❌ | ✅ | Gratis |
| OpenAI TTS | ⭐⭐⭐⭐⭐ | ✅ | ❌ | $0.015/min |
| ElevenLabs | ⭐⭐⭐⭐⭐ | ✅ | ❌ | $0.30/min |

---

## ✅ Estado Actual

**Implementado:**
- ✅ Selección automática de voces premium
- ✅ Rate optimizado (0.95) para mejor naturalidad
- ✅ Soporte completo móvil (iOS/Android)
- ✅ Fallback a voces estándar si no hay premium
- ✅ Log de voces disponibles en consola
- ✅ 100% Open Source y gratuito

**Próximos pasos (si se necesita):**
- Implementar Piper TTS en backend para voces aún mejores
- Agregar opción de descargar audio (para escuchar offline)
- Implementar Kokoro-82M para máxima calidad

---

## 🎓 Recomendaciones

**Para la mejor experiencia:**

1. **iOS/macOS:** Descarga voces **Premium** de Mónica o Paulina
2. **Android:** Instala motor de voz de **Google** con voces Neural
3. **Windows:** Usa voces **Neural** de Microsoft (Elena, Alvaro)
4. **Linux:** Instala **Piper TTS** para mejor calidad

**Verifica tu voz actual:**
Abre la consola del navegador (F12) cuando uses el asistente y verás:
```
✅ Usando voz: Google español (Enhanced)
```

---

## 💡 Tips Adicionales

- **Mejor tono femenino:** Mónica (iOS), Google ES Female (Android)
- **Mejor tono masculino:** Juan (iOS), Google ES Male (Android)
- **Más expresividad:** Voces Neural/Enhanced tienen mejor entonación
- **Velocidad:** 0.9-0.95 suena más natural que 1.0

---

¿Necesitas ayuda para configurar las voces en tu dispositivo? ¡Pregúntame!
