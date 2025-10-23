import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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
  const [isStarted, setIsStarted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    initializeAssistant();
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
        console.log('Connected to virtual assistant');
      });

      socket.on('initialized', (data) => {
        const welcomeMessage = {
          role: 'assistant' as const,
          content: data.message,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        if (isStarted && !isMuted) {
          speak(data.message);
        }
      });

      socket.on('response', (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(data.timestamp),
          },
        ]);
        if (!isMuted) {
          speak(data.message);
        }
      });

      socket.on('error', (data) => {
        setError(data.message);
      });

      initializeSpeechRecognition();
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el asistente');
      setLoading(false);
    }
  };

  const startConversation = () => {
    setIsStarted(true);
    
    if (socketRef.current) {
      socketRef.current.emit('initialize', { token });
    }
    
    if (recognitionRef.current && !isListening) {
      setTimeout(() => {
        recognitionRef.current.start();
      }, 500);
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
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
        sendMessage(transcript);
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isStarted && !isMuted) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition already started');
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
      console.error('Error accessing microphone:', err);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const sendMessage = (message: string) => {
    if (!socketRef.current || !message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ]);

    socketRef.current.emit('message', { message: message.trim() });
  };

  const speak = (text: string) => {
    if (isMuted || isSpeaking) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-2xl px-6">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Reconocimiento de Voz</h3>
              <p className="text-gray-400 text-sm">Habla naturalmente y el asistente te escuchará</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center ${
                  isListening || isSpeaking ? 'animate-pulse' : ''
                }`}>
                  <Mic className="w-6 h-6 text-white" />
                </div>
                {(isListening || isSpeaking) && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-orange-500 opacity-50 animate-ping"></div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {assistant?.name || 'Asistente Virtual'}
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isListening ? 'bg-green-500 animate-pulse' : 
                    isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  <p className="text-sm text-gray-400">
                    {isListening ? 'Escuchando...' : isSpeaking ? 'Hablando...' : 'En espera'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all ${
                  isMuted
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-red-600/20 text-red-500'
                }`}
                title={isMuted ? 'Activar voz' : 'Silenciar voz'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* Audio Visualization */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div 
                className="w-64 h-64 rounded-full bg-gradient-to-br from-red-600/20 to-orange-500/20 flex items-center justify-center transition-all duration-300"
                style={{
                  transform: `scale(${1 + audioLevel * 0.3})`,
                  boxShadow: `0 0 ${50 + audioLevel * 100}px rgba(239, 68, 68, ${0.3 + audioLevel * 0.3})`
                }}
              >
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-red-600/40 to-orange-500/40 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-2xl">
                    {isListening ? (
                      <Mic className="w-16 h-16 text-white animate-pulse" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-16 h-16 text-white animate-pulse" />
                    ) : (
                      <Mic className="w-16 h-16 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="mb-6 bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Escuchando...</p>
              <p className="text-white">{transcript}</p>
            </div>
          )}

          {/* Last Message */}
          {messages.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {messages[messages.length - 1].role === 'assistant' ? 'AI' : 'Tú'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold">
                      {messages[messages.length - 1].role === 'assistant' ? assistant?.name : 'Tú'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(messages[messages.length - 1].timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {messages[messages.length - 1].content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={toggleListening}
              className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                isListening
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-xl hover:shadow-red-500/50'
              }`}
            >
              {isListening ? (
                <span className="flex items-center gap-2">
                  <MicOff className="w-5 h-5" />
                  Pausar
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Activar Micrófono
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
