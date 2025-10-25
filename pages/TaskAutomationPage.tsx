import React, { useState, useEffect } from 'react';
import { Banner } from '../components/Banner';
import { CpuChipIcon } from '../components/icons/CpuChipIcon';
import { taskAutomationService, TaskAutomationConfig } from '../src/services/taskAutomationService';

export const TaskAutomationPage: React.FC = () => {
  const [config, setConfig] = useState<TaskAutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await taskAutomationService.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading task automation config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const updated = await taskAutomationService.toggle();
      setConfig(updated);
    } catch (error) {
      console.error('Error toggling task automation:', error);
    }
  };

  const handleProcessNow = async () => {
    try {
      setProcessing(true);
      await taskAutomationService.processNow();
      await loadConfig();
      alert('Procesamiento iniciado. Las tareas se crearán en los próximos minutos.');
    } catch (error) {
      console.error('Error processing now:', error);
      alert('Error al iniciar el procesamiento');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Banner
          title="Task Automatizados"
          description="Configura la automatización inteligente de tareas mediante análisis de emails"
          icon={CpuChipIcon}
        />
        <div className="mt-8 text-center text-slate-500">
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Banner
        title="Task Automatizados"
        description="Configura la automatización inteligente de tareas mediante análisis de emails"
        icon={CpuChipIcon}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Estado de Automatización</h3>
            <p className="text-sm text-slate-500 mt-1">
              {config?.enabled
                ? 'El sistema está analizando emails cada 5 minutos y creando tareas automáticamente'
                : 'La automatización está desactivada. Actívala para comenzar a crear tareas inteligentes'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config?.enabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config?.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Tareas Creadas</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {config?.tasksCreated || 0}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Tareas Actualizadas</div>
            <div className="text-2xl font-bold text-green-700 mt-1">
              {config?.tasksUpdated || 0}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Última Ejecución</div>
            <div className="text-sm font-medium text-purple-700 mt-1">
              {config?.lastRunAt
                ? new Date(config.lastRunAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Nunca'}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleProcessNow}
            disabled={!config?.enabled || processing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              config?.enabled && !processing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {processing ? 'Procesando...' : 'Procesar Ahora'}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Ejecuta el análisis de emails inmediatamente sin esperar al próximo ciclo automático
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h4 className="text-lg font-bold text-slate-800 mb-3">¿Cómo funciona?</h4>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">
              1
            </div>
            <div>
              <strong>Análisis Inteligente:</strong> El sistema analiza los emails vinculados a operaciones activas de los últimos 7 días usando IA.
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">
              2
            </div>
            <div>
              <strong>Lectura de Adjuntos:</strong> Procesa documentos PDF e imágenes para extraer información relevante.
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">
              3
            </div>
            <div>
              <strong>Creación Inteligente:</strong> Crea solo tareas necesarias y relevantes, evitando duplicados y tareas genéricas.
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">
              4
            </div>
            <div>
              <strong>Actualización Automática:</strong> Detecta cuando un email indica que una tarea se completó y actualiza su estado automáticamente.
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">
              5
            </div>
            <div>
              <strong>Indicadores Visuales:</strong> Todas las tareas creadas o modificadas por automatización muestran un icono distintivo.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <strong>Nota importante:</strong> El sistema requiere que tengas emails vinculados a operaciones. 
            Asegúrate de configurar las reglas de vinculación primero en "Reglas de Vinculación".
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAutomationPage;
