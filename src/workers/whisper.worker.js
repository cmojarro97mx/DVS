import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.cacheDir = 'models';

let transcriber = null;
let isLoading = false;

self.addEventListener('message', async (event) => {
  const { type, audio } = event.data;

  if (type === 'load' && !isLoading && !transcriber) {
    isLoading = true;
    try {
      console.log('[Worker] Iniciando carga del modelo Whisper...');
      self.postMessage({ type: 'loading', message: 'Cargando modelo Whisper...' });
      
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          quantized: true,
          progress_callback: (progress) => {
            console.log('[Worker] Progress callback:', progress);
            if (progress.status === 'progress' && progress.total) {
              const percentage = Math.round((progress.loaded / progress.total) * 100);
              self.postMessage({ 
                type: 'progress', 
                progress: percentage,
                message: `Descargando modelo... ${percentage}%`
              });
            } else if (progress.status === 'done') {
              console.log('[Worker] Archivo descargado:', progress.file);
              self.postMessage({ 
                type: 'progress', 
                progress: 100,
                message: 'Descarga completa, inicializando...'
              });
            } else if (progress.status === 'ready') {
              console.log('[Worker] Modelo listo');
            }
          }
        }
      );
      
      console.log('[Worker] ✅ Whisper modelo cargado correctamente');
      isLoading = false;
      self.postMessage({ type: 'ready', message: 'Modelo cargado y listo' });
    } catch (error) {
      console.error('[Worker] Error al cargar:', error);
      isLoading = false;
      self.postMessage({ type: 'error', message: error.message });
    }
  }

  if (type === 'transcribe') {
    if (!transcriber) {
      console.error('[Worker] Transcriber no está listo');
      self.postMessage({ type: 'error', message: 'El modelo aún no está cargado' });
      return;
    }
    
    try {
      console.log('[Worker] Iniciando transcripción...');
      self.postMessage({ type: 'transcribing', message: 'Transcribiendo...' });
      
      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'spanish',
        task: 'transcribe'
      });
      
      console.log('[Worker] Transcripción completada:', result.text);
      self.postMessage({ 
        type: 'result', 
        text: result.text.trim()
      });
    } catch (error) {
      console.error('[Worker] Error al transcribir:', error);
      self.postMessage({ type: 'error', message: error.message });
    }
  }
});
