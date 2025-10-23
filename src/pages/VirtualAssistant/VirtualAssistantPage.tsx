import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Power, Trash2 } from 'lucide-react';
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
  
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAssistant();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const socket = io(`${apiUrl}/virtual-assistant`, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to virtual assistant');
        socket.emit('initialize', { token });
      });

      socket.on('initialized', (data) => {
        setMessages([
          {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          },
        ]);
        if (!isMuted) {
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
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearHistory = () => {
    if (confirm('¿Estás seguro de que deseas limpiar el historial?')) {
      socketRef.current?.emit('clearHistory');
      setMessages([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-red-600 mb-4">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {assistant?.name || 'Asistente Virtual'}
                </h1>
                <p className="text-sm text-gray-500">
                  Habla o escribe para comenzar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg ${
                  isMuted
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-red-100 text-red-600'
                }`}
                title={isMuted ? 'Activar voz' : 'Silenciar voz'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={clearHistory}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Limpiar historial"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-900 shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-red-200'
                      : 'text-gray-400'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-2xl rounded-2xl px-6 py-4 bg-red-200 text-red-900">
                <p className="whitespace-pre-wrap italic">{transcript}</p>
                <p className="text-xs mt-2 text-red-700">
                  Escuchando...
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Control */}
      <div className="bg-white shadow-lg border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform ${
                isListening
                  ? 'bg-red-600 text-white shadow-xl scale-110 animate-pulse'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {isListening ? (
                <Mic className="w-10 h-10" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </button>
          </div>
          <p className="text-center mt-4 text-sm text-gray-600">
            {isListening
              ? 'Escuchando... Habla ahora'
              : 'Presiona el micrófono para hablar'}
          </p>
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              <p className="text-xs text-red-600 ml-2">Hablando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
