import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VirtualAssistantService } from './virtual-assistant.service';
import { AssistantToolsService } from './assistant-tools.service';
import { GoogleGenAI } from '@google/genai';

interface ConversationHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/virtual-assistant',
})
export class VirtualAssistantGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private genAI: GoogleGenAI;
  private conversationHistories = new Map<string, ConversationHistory[]>();
  private assistantContexts = new Map<string, any>();

  constructor(
    private assistantService: VirtualAssistantService,
    private toolsService: AssistantToolsService,
  ) {
    console.log('🤖 Inicializando VirtualAssistantGateway...');
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
    console.log('✅ Gemini AI inicializado con API key:', process.env.GEMINI_API_KEY ? 'Configurada' : 'NO CONFIGURADA');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente desconectado: ${client.id}`);
    this.conversationHistories.delete(client.id);
    this.assistantContexts.delete(client.id);
  }

  @SubscribeMessage('initialize')
  async handleInitialize(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`🚀 Inicializando asistente para token: ${data.token}`);
      
      const assistant = await this.assistantService.getAssistantByToken(
        data.token,
      );
      console.log(`✅ Asistente encontrado: ${assistant.name}`);
      
      const context = await this.assistantService.getOrganizationContext(
        assistant.organizationId,
      );
      console.log(`✅ Contexto cargado: ${context.operations.length} operaciones, ${context.clients.length} clientes`);

      this.assistantContexts.set(client.id, {
        assistant,
        context,
        organizationId: assistant.organizationId,
        userId: assistant.userId,
      });

      this.conversationHistories.set(client.id, []);

      const welcomeMessage = `Hola! Soy ${assistant.name}, tu asistente virtual. ¿En qué puedo ayudarte hoy?`;
      
      console.log(`💬 Enviando mensaje de bienvenida: ${welcomeMessage}`);
      
      client.emit('initialized', {
        assistantName: assistant.name,
        message: welcomeMessage,
      });
    } catch (error) {
      console.error('❌ Error al inicializar:', error);
      client.emit('error', {
        message: error.message || 'Error al inicializar el asistente',
      });
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`📨 Mensaje recibido de ${client.id}: "${data.message}"`);
      
      const context = this.assistantContexts.get(client.id);
      if (!context) {
        console.error('❌ Asistente no inicializado para:', client.id);
        client.emit('error', { message: 'Asistente no inicializado. Por favor recarga la página.' });
        return;
      }

      const history = this.conversationHistories.get(client.id) || [];

      history.push({
        role: 'user',
        parts: [{ text: data.message }],
      });

      const systemPrompt = this.buildSystemPrompt(context);
      console.log(`🧠 Llamando a Gemini Flash...`);

      try {
        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
            ...history,
          ],
          config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
          },
        });

        console.log('✅ Respuesta de Gemini recibida');
        console.log('📄 Respuesta completa:', JSON.stringify(response, null, 2));

        const assistantResponse = response.text || 'Lo siento, no pude generar una respuesta.';
        console.log(`💬 Respuesta del asistente: "${assistantResponse.substring(0, 100)}..."`);

        history.push({
          role: 'model',
          parts: [{ text: assistantResponse }],
        });

        this.conversationHistories.set(client.id, history);

        console.log(`📤 Enviando respuesta al cliente ${client.id}`);
        client.emit('response', {
          message: assistantResponse,
          timestamp: new Date(),
        });

        const toolCall = await this.detectToolCall(data.message, assistantResponse, context);
        if (toolCall) {
          console.log(`🔧 Tool call detectado:`, toolCall);
          const toolResult = await this.executeToolCall(toolCall, context);
          client.emit('toolResult', toolResult);
        }
      } catch (geminiError) {
        console.error('❌ Error de Gemini API:', geminiError);
        console.error('❌ Stack trace:', geminiError.stack);
        throw geminiError;
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      console.error('❌ Detalles del error:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      client.emit('error', {
        message: 'Error al procesar tu mensaje. Por favor intenta nuevamente.',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('clearHistory')
  async handleClearHistory(@ConnectedSocket() client: Socket) {
    console.log(`🗑️ Limpiando historial para ${client.id}`);
    this.conversationHistories.set(client.id, []);
    client.emit('historyCleared', { message: 'Historial limpiado' });
  }

  private buildSystemPrompt(context: any): string {
    const { assistant, context: orgContext, organizationId } = context;

    return `Eres ${assistant.name}, un asistente virtual inteligente para la plataforma Nexxio de gestión logística y CRM.

Tu rol es ayudar al usuario con:
- Consultar información sobre operaciones, clientes, empleados, eventos y tareas
- Crear nuevas operaciones, clientes, eventos y tareas cuando te lo soliciten
- Responder preguntas sobre el estado de la organización
- Proporcionar resúmenes y análisis de datos

Información del contexto actual:
- Operaciones activas: ${orgContext.operations.length}
- Clientes: ${orgContext.clients.length}
- Empleados: ${orgContext.employees.length}
- Eventos próximos: ${orgContext.events.length}
- Tareas pendientes: ${orgContext.tasks.filter((t) => t.status !== 'Done').length}

Operaciones recientes:
${orgContext.operations.slice(0, 5).map((op) => `- ${op.projectName} (${op.status})`).join('\n')}

Clientes principales:
${orgContext.clients.slice(0, 5).map((c) => `- ${c.name} (${c.email || 'Sin email'})`).join('\n')}

Eventos próximos:
${orgContext.events.slice(0, 3).map((e) => `- ${e.title} (${new Date(e.startDate).toLocaleDateString()})`).join('\n')}

IMPORTANTE:
- Responde en español de manera clara y profesional
- Si te piden crear algo, confirma los detalles antes de hacerlo
- Si no tienes información suficiente, pregunta por los detalles necesarios
- Sé conciso pero completo en tus respuestas
- Usa un tono amigable y profesional`;
  }

  private async detectToolCall(
    userMessage: string,
    assistantResponse: string,
    context: any,
  ): Promise<any> {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('crear operación') || lowerMessage.includes('nueva operación')) {
      return { tool: 'createOperation', needsConfirmation: true };
    }

    if (lowerMessage.includes('crear cliente') || lowerMessage.includes('nuevo cliente')) {
      return { tool: 'createClient', needsConfirmation: true };
    }

    if (lowerMessage.includes('crear evento') || lowerMessage.includes('nuevo evento')) {
      return { tool: 'createEvent', needsConfirmation: true };
    }

    if (lowerMessage.includes('crear tarea') || lowerMessage.includes('nueva tarea')) {
      return { tool: 'createTask', needsConfirmation: true };
    }

    return null;
  }

  private async executeToolCall(toolCall: any, context: any): Promise<any> {
    const { tool } = toolCall;
    const { organizationId, userId } = context;

    switch (tool) {
      case 'createOperation':
        return { tool, message: 'Dime el nombre de la operación y los detalles' };
      case 'createClient':
        return { tool, message: 'Dime el nombre del cliente y su información de contacto' };
      case 'createEvent':
        return { tool, message: 'Dime el título del evento, fecha y hora' };
      case 'createTask':
        return { tool, message: 'Dime el título de la tarea y la fecha límite' };
      default:
        return null;
    }
  }
}
