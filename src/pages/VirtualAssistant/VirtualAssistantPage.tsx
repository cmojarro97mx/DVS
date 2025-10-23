import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeAssistant();
    checkVoiceSupport();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [token]);

  const checkVoiceSupport = () => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(supported);
    if (!supported) {
      console.log('Reconocimiento de voz no soportado en este navegador');
    }
  };

  const initializeAssistant = async () => {
    try {
      const data = await api.get<any>(`/virtual-assistant/token/${token}`);
      setAssistant(data);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const socket = io(`${apiUrl}/virtual-assistant`, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Conectado al asistente virtual');
      });

      socket.on('initialized', (data) => {
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
        console.error('❌ Error:', data.message);
        setError(data.message);
        setIsProcessing(false);
      });

      if (voiceSupported) {
        initializeSpeechRecognition();
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cargar asistente:', err);
      setError(err.response?.data?.message || 'Error al cargar el asistente');
      setLoading(false);
    }
  };

  const startConversation = () => {
    setIsStarted(true);
    
    if (socketRef.current) {
      console.log('🎤 Iniciando conversación...');
      setIsProcessing(true);
      socketRef.current.emit('initialize', { token });
    }
  };

  const initializeSpeechRecognition = () => {
    if (!voiceSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      console.log('🎤 Micrófono activado');
      setIsListening(true);
      startAudioVisualization();
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setTranscript(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        console.log('💬 Mensaje final:', transcript);
        sendMessage(transcript);
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Error de reconocimiento:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('🎤 Reconocimiento detenido');
      if (isStarted && !isMuted && voiceSupported) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Reconocimiento ya está activo');
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  };

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current || !voiceSupported) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('El reconocimiento ya está activo');
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

    console.log('🔊 Hablando:', text.substring(0, 50) + '...');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
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
                <Mic className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-600 to-orange-500 opacity-50 animate-ping"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {assistant?.name || 'Asistente Virtual'}
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Tu asistente virtual inteligente con IA
          </p>
          
          <button
            onClick={startConversation}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3">
              <Mic className="w-6 h-6" />
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
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">IA Inteligente</h3>
              <p className="text-gray-400 text-sm">Powered by Google Gemini Flash</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Tiempo Real</h3>
              <p className="text-gray-400 text-sm">Respuestas instantáneas y conversaciones fluidas</p>
            </div>
          </div>

          {!voiceSupported && (
            <div className="mt-6 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                ℹ️ Reconocimiento de voz no disponible en este navegador. Usa el chat por texto.
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
                  isListening || isSpeaking || isProcessing ? 'animate-pulse' : ''
                }`}>
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                {(isListening || isSpeaking || isProcessing) && (
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
                    isListening ? 'bg-green-500 animate-pulse' : 
                    isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  <p className="text-xs md:text-sm text-gray-400">
                    {isProcessing ? 'Procesando...' :
                     isListening ? 'Escuchando...' : 
                     isSpeaking ? 'Hablando...' : 'En espera'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {voiceSupported && (
                <button
                  onClick={toggleListening}
                  className={`p-2 md:p-3 rounded-xl transition-all ${
                    isListening
                      ? 'bg-green-600/20 text-green-500'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                  title={isListening ? 'Desactivar voz' : 'Activar voz'}
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <MicOff className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              )}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full">
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
        </div>

        {/* Current Transcript (Voice) */}
        {transcript && (
          <div className="mb-4 bg-gray-900 rounded-xl p-3 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Escuchando...</p>
            <p className="text-white text-sm">{transcript}</p>
          </div>
        )}

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
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-2 md:p-3 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {voiceSupported 
              ? '💡 Tip: Usa el micrófono arriba o escribe tu mensaje' 
              : '💡 Tip: Escribe tu mensaje y presiona enviar'}
          </p>
        </form>
      </div>
    </div>
  );
}
