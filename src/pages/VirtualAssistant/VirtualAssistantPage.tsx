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
  const [isStarted, setIsStarted] = useState(false);
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
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Reconocimiento de voz iniciado');
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Transcripción:', transcript);
        setTextInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        setIsRecording(false);
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No se detectó voz');
        } else if (event.error === 'not-allowed') {
          alert('Por favor permite el acceso al micrófono para usar esta función');
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Reconocimiento de voz finalizado');
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      console.log('✅ SpeechRecognition inicializado');
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
        
        if (isStarted && !isMuted) {
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
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cargar asistente:', err);
      setError(err.response?.data?.message || 'Error al cargar el asistente');
      setLoading(false);
    }
  };

  const startConversation = () => {
    setIsStarted(true);
    
    if (socketRef.current && socketRef.current.connected) {
      console.log('💬 Iniciando conversación con token:', token);
      setIsProcessing(true);
      socketRef.current.emit('initialize', { token });
      
      setTimeout(() => {
        if (isProcessing) {
          console.warn('⚠️ Tiempo de espera agotado, mostrando interfaz');
          setIsProcessing(false);
        }
      }, 5000);
    } else {
      console.error('❌ Socket no conectado');
      setError('No se pudo conectar con el servidor. Por favor recarga la página.');
      setIsProcessing(false);
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md text-center border border-gray-800">
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

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mb-6 shadow-2xl">
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-600 to-orange-500 opacity-50 animate-ping"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {assistant?.name || 'Asistente Virtual'}
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Tu asistente virtual inteligente con IA, voz y transcripción
          </p>
          
          <button
            onClick={startConversation}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Iniciar Conversación
            </span>
          </button>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Grabación de Audio</h3>
              <p className="text-gray-400 text-sm">Habla y transcribe automáticamente con Whisper AI</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Respuestas de Voz</h3>
              <p className="text-gray-400 text-sm">El asistente te habla con voces naturales</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">100% Open Source</h3>
              <p className="text-gray-400 text-sm">Sin costos de APIs, completamente gratis</p>
            </div>
          </div>

          {whisperStatus === 'loading' && (
            <div className="mt-6 bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
              <p className="text-blue-400 text-sm flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                {whisperMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center ${
                  isSpeaking || isProcessing || isTranscribing ? 'animate-pulse' : ''
                }`}>
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                {(isSpeaking || isProcessing || isTranscribing) && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-orange-500 opacity-50 animate-ping"></div>
                )}
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">
                  {assistant?.name || 'Asistente Virtual'}
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isProcessing ? 'bg-yellow-500 animate-pulse' :
                    isTranscribing ? 'bg-purple-500 animate-pulse' :
                    isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                  }`}></div>
                  <p className="text-xs md:text-sm text-gray-400">
                    {isProcessing ? 'Procesando...' :
                     isTranscribing ? 'Transcribiendo audio...' :
                     isSpeaking ? 'Hablando...' : 'En línea'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-2 md:p-3 rounded-xl transition-all ${
                  isMuted
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-red-600/20 text-red-500'
                }`}
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            </div>
          </div>
          {!isMuted && (
            <div className="mt-2 bg-green-900/20 border border-green-600/50 rounded-lg px-3 py-2">
              <p className="text-green-500 text-xs flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Respuestas de voz activadas
              </p>
            </div>
          )}
          {whisperMessage && (
            <div className="mt-2 bg-purple-900/20 border border-purple-600/50 rounded-lg px-3 py-2">
              <p className="text-purple-400 text-xs flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                {whisperMessage}
              </p>
            </div>
          )}
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
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-red-600 to-orange-500'
                  : 'bg-gray-700'
              }`}>
                <span className="text-white font-semibold text-xs md:text-sm">
                  {message.role === 'assistant' ? 'AI' : 'Tú'}
                </span>
              </div>
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : ''
              }`}>
                <div className={`inline-block p-3 md:p-4 rounded-2xl ${
                  message.role === 'assistant'
                    ? 'bg-gray-900 border border-gray-800'
                    : 'bg-gradient-to-r from-red-600 to-orange-500'
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
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs md:text-sm">AI</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-3 md:p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleTextSubmit} className="bg-gray-900 rounded-2xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={!recognitionRef.current}
              className={`p-2 md:p-3 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : recognitionRef.current
                  ? 'bg-purple-600/20 text-purple-500 hover:bg-purple-600/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
              title={
                !recognitionRef.current ? 'Reconocimiento de voz no disponible' :
                isRecording ? 'Detener grabación' : 'Grabar audio'
              }
            >
              {isRecording ? (
                <Square className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isRecording ? 'Escuchando...' : 'Escribe o graba tu mensaje...'
              }
              className="flex-1 bg-gray-800 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base disabled:opacity-50"
              disabled={isProcessing}
              autoFocus
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-2 md:p-3 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1 flex-wrap">
            <Mic className="w-3 h-3" />
            Graba audio o escribe texto
            {!isMuted && <span className="text-green-500">(🔊 Voz activada)</span>}
          </p>
        </form>
      </div>
    </div>
  );
}
