import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Volume2, VolumeX, Send, MessageCircle } from 'lucide-react';
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
  
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAssistant();
    
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
      window.speechSynthesis.cancel();
    };
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    console.log('🔊 Hablando:', text.substring(0, 50) + '...');
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    console.log('📢 Voces disponibles:', voices.map(v => `${v.name} (${v.lang})`));
    
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
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        const newVoices = window.speechSynthesis.getVoices();
        const bestVoice = newVoices.find(voice => 
          voice.lang.includes('es') && 
          (voice.name.includes('Premium') || voice.name.includes('Enhanced') || voice.name.includes('Google'))
        );
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log('✅ Voz actualizada a:', bestVoice.name);
        }
      });
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
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
            Tu asistente virtual inteligente con IA y respuestas de voz
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
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Chat por Texto</h3>
              <p className="text-gray-400 text-sm">Escribe tus mensajes desde cualquier dispositivo</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Respuestas de Voz</h3>
              <p className="text-gray-400 text-sm">El asistente te habla en voz alta automáticamente</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">IA Inteligente</h3>
              <p className="text-gray-400 text-sm">Powered by Google Gemini Flash</p>
            </div>
          </div>
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
                  isSpeaking || isProcessing ? 'animate-pulse' : ''
                }`}>
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                {(isSpeaking || isProcessing) && (
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
                    isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                  }`}></div>
                  <p className="text-xs md:text-sm text-gray-400">
                    {isProcessing ? 'Procesando...' :
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
                Las respuestas se reproducirán automáticamente con voz
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

        {/* Text Input */}
        <form onSubmit={handleTextSubmit} className="bg-gray-900 rounded-2xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 md:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-gray-800 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base"
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
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
            💬 Escribe tu mensaje y el asistente responderá con voz
            {!isMuted && <span className="text-green-500">(🔊 Sonido activado)</span>}
          </p>
        </form>
      </div>
    </div>
  );
}
