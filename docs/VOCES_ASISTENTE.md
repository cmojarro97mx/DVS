# 🎙️ Guía de Voces del Asistente Virtual

## 📱 Mejoras Implementadas

El asistente virtual ahora incluye:

### ✅ Características Speech-to-Text (Grabación de Audio)
- **🎤 Grabación de audio** - Graba tu voz con el micrófono
- **🤖 Whisper AI** - Transcripción automática con IA de OpenAI (100% open source)
- **🌐 Funciona en el navegador** - Todo el procesamiento es local, sin enviar datos a servidores
- **📱 Compatible con móviles** - Funciona en iOS, Android y desktop
- **⚡ Modelo pequeño** - Whisper Tiny (~39MB) se descarga una sola vez

### ✅ Características Text-to-Speech (Respuestas de Voz)
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

## 🎤 Cómo Usar la Grabación de Audio

1. **Haz clic en el botón del micrófono** (ícono morado al lado del campo de texto)
2. **Permite el acceso al micrófono** cuando el navegador lo solicite
3. **Habla tu mensaje** - verás el botón parpadeando mientras grabas
4. **Haz clic en el botón cuadrado** (⏹️) para detener la grabación
5. **Espera la transcripción** - Whisper procesará tu audio automáticamente
6. **El texto aparecerá en el campo** - Revísalo y envíalo o edítalo antes de enviar

**Nota importante:** La primera vez que uses la grabación, el modelo Whisper se descargará (~39MB). Esto solo sucede una vez y luego queda en caché del navegador.

---

## 🐛 Solución de Problemas

### ❌ "El modelo Whisper tarda mucho en cargar"

**Solución:**
- Es normal la primera vez (descarga ~39MB)
- Verás el progreso en la parte inferior del chat
- Las siguientes veces será instantáneo (usa caché del navegador)
- Si falla la descarga, recarga la página

### ❌ "No puedo grabar audio"

**Solución:**
1. Verifica que hayas permitido acceso al micrófono
2. En Chrome: Configuración > Privacidad y seguridad > Configuración de sitios > Micrófono
3. En Firefox: Ícono de candado en la barra > Permisos > Micrófono
4. En Safari iOS: Ajustes > Safari > Micrófono
5. Asegúrate de que ninguna otra app esté usando el micrófono

### ❌ "La transcripción está en inglés y hablo español"

**Solución:**
- El modelo está configurado para español por defecto
- Si detecta inglés, es porque la grabación no fue clara
- Intenta hablar más fuerte y claro
- Reduce el ruido de fondo
- El modelo Whisper Tiny es básico - considera usar Whisper Base para mejor precisión

### ❌ "La transcripción no es precisa"

**Solución:**
- Whisper Tiny (~39MB) prioriza velocidad sobre precisión
- Para mejor precisión, se puede cambiar a Whisper Base (~74MB) o Small (~244MB)
- Habla claramente y sin ruido de fondo
- Evita hablar muy rápido
- El modelo mejora con frases completas vs palabras sueltas

### ❌ "No escucho nada en móvil" (Text-to-Speech)

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

**Speech-to-Text (Entrada de Audio):**
- ✅ Grabación de audio con MediaRecorder API
- ✅ Whisper Tiny (~39MB) corriendo en Web Worker
- ✅ Transcripción automática a texto
- ✅ Soporte para español e inglés
- ✅ Indicador visual de estado de grabación y transcripción
- ✅ Botón de micrófono integrado en la interfaz
- ✅ 100% Local - no envía datos a servidores externos

**Text-to-Speech (Respuestas de Voz):**
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
- Agregar soporte para Whisper Base/Small (mayor precisión)

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
