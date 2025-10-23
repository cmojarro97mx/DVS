import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Volume2, VolumeX, Send, MessageCircle, Mic, Square } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VirtualAssistantPage() {
  const { token } = useParams<{ token: string }>();
  const [assistant, setAssistant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initializeAssistant();
    initializeSpeechRecognition();
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🎤 Voces cargadas:', voices.length);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('⚠️ SpeechRecognition no soportado en este navegador');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Reconocimiento de voz iniciado - ESPERANDO VOZ...');
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        console.log('🎙️ Evento de resultado detectado, resultados:', event.results.length);
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('✅ Transcripción FINAL:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('⏳ Transcripción TEMPORAL:', transcript);
          }
        }
        
        if (finalTranscript) {
          setTextInput(finalTranscript);
          console.log('📝 Texto establecido:', finalTranscript);
        } else if (interimTranscript) {
          setTextInput(interimTranscript);
          console.log('📝 Texto temporal:', interimTranscript);
        }
      };

      recognition.onaudiostart = () => {
        console.log('🔊 Audio detectado - MICRÓFONO CAPTURANDO');
      };

      recognition.onsoundstart = () => {
        console.log('🎵 Sonido detectado');
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ VOZ DETECTADA - PROCESANDO...');
      };

      recognition.onspeechend = () => {
        console.log('🔇 Voz finalizada');
      };

      recognition.onaudioend = () => {
        console.log('🔇 Audio finalizado');
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        console.error('❌ Detalles del error:', event);
        setIsRecording(false);
        
        if (event.error === 'no-speech') {
          alert('No se detectó voz. Intenta hablar más cerca del micrófono.');
        } else if (event.error === 'not-allowed') {
          alert('Por favor permite el acceso al micrófono en tu navegador');
        } else if (event.error === 'network') {
          alert('Error de red. Verifica tu conexión.');
        } else {
          alert(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Reconocimiento de voz finalizado');
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      console.log('✅ SpeechRecognition inicializado con continuous=true');
    } catch (error) {
      console.error('❌ Error al inicializar SpeechRecognition:', error);
    }
  };

  const initializeAssistant = async () => {
    try {
      const data = await api.get<any>(`/virtual-assistant/token/${token}`);
      setAssistant(data);
      
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      const wsUrl = `${protocol}//${hostname}:3001`;
      
      console.log('🌐 Conectando WebSocket a:', wsUrl);
      
      const socket = io(`${wsUrl}/virtual-assistant`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ WebSocket conectado correctamente');
      });

      socket.on('initialized', (data) => {
        console.log('📨 Asistente inicializado:', data.message);
        const welcomeMessage = {
          role: 'assistant' as const,
          content: data.message,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsProcessing(false);
        
        if (!isMuted) {
          speak(data.message);
        }
      });

      socket.on('response', (data) => {
        console.log('📨 Respuesta recibida:', data.message);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(data.timestamp),
          },
        ]);
        setIsProcessing(false);
        
        if (!isMuted) {
          speak(data.message);
        }
      });

      socket.on('error', (data) => {
        console.error('❌ Error del asistente:', data.message);
        setError(data.message);
        setIsProcessing(false);
      });

      socket.on('disconnect', () => {
        console.log('⚠️ WebSocket desconectado');
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Error de conexión WebSocket:', err.message);
        setError('Error de conexión. Por favor recarga la página.');
        setIsProcessing(false);
      });

      // Auto-iniciar conversación cuando se conecta el socket
      socket.on('connect', () => {
        if (socket.connected) {
          console.log('💬 Iniciando conversación automáticamente con token:', token);
          setIsProcessing(true);
          socket.emit('initialize', { token });
        }
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cargar asistente:', err);
      setError(err.response?.data?.message || 'Error al cargar el asistente');
      setLoading(false);
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      console.error('❌ SpeechRecognition no está disponible');
      alert('El reconocimiento de voz no está disponible en este navegador');
      return;
    }

    if (isRecording) {
      console.log('⏹️ Deteniendo reconocimiento de voz');
      recognitionRef.current.stop();
    } else {
      console.log('🎤 Iniciando reconocimiento de voz');
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('❌ Error al iniciar reconocimiento:', error);
        setIsRecording(false);
      }
    }
  };

  const sendMessage = (message: string) => {
    if (!socketRef.current || !message.trim()) return;

    console.log('📤 Enviando mensaje:', message.trim());

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      },
    ]);

    setIsProcessing(true);
    socketRef.current.emit('message', { message: message.trim() });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput);
      setTextInput('');
    }
  };

  const speak = (text: string) => {
    if (isMuted || isSpeaking) return;

    console.log('🔊 Intentando hablar:', text.substring(0, 50) + '...');
    console.log('🔇 isMuted:', isMuted, 'isSpeaking:', isSpeaking);
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    console.log('📢 Total de voces disponibles:', voices.length);
    if (voices.length > 0) {
      console.log('📢 Primeras 5 voces:', voices.slice(0, 5).map(v => `${v.name} (${v.lang})`));
    }
    
    const spanishVoice = voices.find(voice => 
      (voice.lang.includes('es-ES') || voice.lang.includes('es-MX') || voice.lang.includes('es-US')) &&
      (voice.name.includes('Premium') || 
       voice.name.includes('Enhanced') || 
       voice.name.includes('Neural') ||
       voice.name.includes('Google') ||
       voice.name.includes('Microsoft') ||
       voice.name.includes('Natural') ||
       voice.name.includes('Monica') ||
       voice.name.includes('Paulina') ||
       voice.name.includes('Diego'))
    ) || voices.find(voice => 
      voice.lang.includes('es')
    );

    if (spanishVoice) {
      utterance.voice = spanishVoice;
      console.log('✅ Usando voz:', spanishVoice.name);
    }

    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log('🔊 Voz iniciada');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('🔇 Voz finalizada');
      setIsSpeaking(false);
    };
    
    utterance.onerror = (e) => {
      console.error('Error en síntesis de voz:', e);
      setIsSpeaking(false);
    };

    if (voices.length === 0) {
      console.warn('⚠️ No hay voces disponibles todavía, esperando...');
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        const newVoices = window.speechSynthesis.getVoices();
        console.log('🔄 Voces cargadas:', newVoices.length);
        const bestVoice = newVoices.find(voice => 
          voice.lang.includes('es') && 
          (voice.name.includes('Premium') || voice.name.includes('Enhanced') || voice.name.includes('Google'))
        );
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log('✅ Voz actualizada a:', bestVoice.name);
        }
        setTimeout(() => {
          console.log('🎤 Hablando con nueva voz...');
          window.speechSynthesis.speak(utterance);
        }, 100);
      }, { once: true });
    } else {
      setTimeout(() => {
        console.log('🎤 Iniciando síntesis de voz...');
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-gray-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center border border-gray-800">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gray-800 flex items-center justify-center ${
                  isSpeaking || isProcessing ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
                </div>
              </div>
              <div>
                <h1 className="text-base md:text-lg font-medium text-white">
                  {assistant?.name || 'Asistente Virtual'}
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isProcessing ? 'bg-blue-500' :
                    isSpeaking ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <p className="text-xs text-gray-500">
                    {isProcessing ? 'Procesando...' :
                     isSpeaking ? 'Hablando...' : 'En línea'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted
                    ? 'bg-gray-800 text-gray-500 hover:bg-gray-750'
                    : 'bg-gray-800 text-blue-500 hover:bg-gray-750'
                }`}
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full overflow-hidden">
        {/* Messages */}
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-gray-800'
                  : 'bg-gray-700'
              }`}>
                <span className="text-gray-300 font-medium text-xs">
                  {message.role === 'assistant' ? 'AI' : 'Tú'}
                </span>
              </div>
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : ''
              }`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-gray-900 border border-gray-800'
                    : 'bg-blue-600'
                }`}>
                  <p className="text-white text-sm md:text-base leading-relaxed">
                    {message.content}
                  </p>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-300 font-medium text-xs">AI</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleTextSubmit} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="flex items-center gap-2">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={!recognitionRef.current}
              className={`p-2 rounded-lg transition-colors relative ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : recognitionRef.current
                  ? 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-750'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
              title={
                !recognitionRef.current ? 'Reconocimiento de voz no disponible' :
                isRecording ? 'Detener grabación (Click)' : 'Grabar audio (Click)'
              }
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isRecording ? '🎤 Escuchando... (habla ahora)' : 'Escribe o presiona el micrófono...'
              }
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder-gray-500 disabled:opacity-50"
              disabled={isProcessing}
              autoFocus
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isRecording ? (
            <div className="mt-2 bg-red-900/20 border border-red-600/50 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Micrófono activo - Habla ahora
              </p>
            </div>
          ) : (
            <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Presiona el micrófono para hablar
              {!isMuted && <span className="text-blue-500 ml-1">• Voz activada</span>}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
