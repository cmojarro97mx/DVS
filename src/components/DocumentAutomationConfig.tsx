import React, { useState, useEffect } from 'react';
import { Save, Settings, Zap, FolderTree } from 'lucide-react';
import axios from 'axios';

interface AutomationConfig {
  id: string;
  enabled: boolean;
  autoExtractFromEmails: boolean;
  autoClassify: boolean;
  autoOrganize: boolean;
  excludeSpam: boolean;
  minConfidenceScore: number;
  targetFolderRules?: Record<string, string>;
}

interface DocumentAutomationConfigProps {
  organizationId: string;
}

const DocumentAutomationConfig: React.FC<DocumentAutomationConfigProps> = ({
  organizationId,
}) => {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultFolderRules = {
    payment: 'Pagos',
    expense: 'Gastos',
    invoice: 'Facturas',
    contract: 'Contratos',
    customs: 'Aduanas',
    shipping: 'Embarques',
    xml: 'XML / CFDI',
    image: 'Imágenes',
  };

  useEffect(() => {
    loadConfig();
  }, [organizationId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/documents/automation/config/${organizationId}`,
      );
      setConfig({
        ...response.data,
        targetFolderRules: response.data.targetFolderRules || defaultFolderRules,
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await axios.post(`/api/documents/automation/config/${organizationId}`, config);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-40 text-gray-500">
          Cargando configuración...
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-40 text-gray-500">
          Error al cargar la configuración
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="font-semibold">Automatización de Documentos</h3>
            <p className="text-sm text-gray-600">
              Configuración de procesamiento automático de documentos
            </p>
          </div>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <label htmlFor="enabled" className="flex-1 cursor-pointer">
            <div className="font-semibold text-blue-900">
              Activar automatización de documentos
            </div>
            <div className="text-sm text-blue-700">
              Habilitar todas las funciones de automatización configuradas abajo
            </div>
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoExtract"
              checked={config.autoExtractFromEmails}
              onChange={(e) =>
                setConfig({ ...config, autoExtractFromEmails: e.target.checked })
              }
              disabled={!config.enabled}
              className="mt-1 w-5 h-5 text-blue-600 rounded disabled:opacity-50"
            />
            <label htmlFor="autoExtract" className="flex-1 cursor-pointer">
              <div className="font-medium">Extraer archivos de correos automáticamente</div>
              <div className="text-sm text-gray-600">
                Extrae automáticamente archivos adjuntos de correos vinculados a operaciones
              </div>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoClassify"
              checked={config.autoClassify}
              onChange={(e) => setConfig({ ...config, autoClassify: e.target.checked })}
              disabled={!config.enabled}
              className="mt-1 w-5 h-5 text-blue-600 rounded disabled:opacity-50"
            />
            <label htmlFor="autoClassify" className="flex-1 cursor-pointer">
              <div className="font-medium">Clasificar documentos con IA</div>
              <div className="text-sm text-gray-600">
                Usa inteligencia artificial para clasificar automáticamente los documentos
                (pagos, gastos, facturas, etc.)
              </div>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoOrganize"
              checked={config.autoOrganize}
              onChange={(e) => setConfig({ ...config, autoOrganize: e.target.checked })}
              disabled={!config.enabled || !config.autoClassify}
              className="mt-1 w-5 h-5 text-blue-600 rounded disabled:opacity-50"
            />
            <label htmlFor="autoOrganize" className="flex-1 cursor-pointer">
              <div className="font-medium">Organizar en carpetas automáticamente</div>
              <div className="text-sm text-gray-600">
                Mueve documentos a carpetas según su clasificación (requiere clasificación
                automática)
              </div>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="excludeSpam"
              checked={config.excludeSpam}
              onChange={(e) => setConfig({ ...config, excludeSpam: e.target.checked })}
              disabled={!config.enabled || !config.autoClassify}
              className="mt-1 w-5 h-5 text-blue-600 rounded disabled:opacity-50"
            />
            <label htmlFor="excludeSpam" className="flex-1 cursor-pointer">
              <div className="font-medium">Excluir spam automáticamente</div>
              <div className="text-sm text-gray-600">
                Elimina automáticamente documentos clasificados como spam o contenido
                promocional
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">
              Confianza mínima para clasificación ({(config.minConfidenceScore * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.minConfidenceScore}
              onChange={(e) =>
                setConfig({ ...config, minConfidenceScore: parseFloat(e.target.value) })
              }
              disabled={!config.enabled || !config.autoClassify}
              className="w-full disabled:opacity-50"
            />
            <p className="text-sm text-gray-600">
              Solo clasificar documentos cuando la IA tenga al menos este nivel de
              confianza
            </p>
          </div>
        </div>

        {config.autoOrganize && config.autoClassify && config.enabled && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold">Reglas de organización por carpetas</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.targetFolderRules || {}).map(([category, folder]) => (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize w-24">{category}:</span>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targetFolderRules: {
                          ...config.targetFolderRules,
                          [category]: e.target.value,
                        },
                      })
                    }
                    className="flex-1 px-3 py-1.5 border rounded text-sm"
                    placeholder="Nombre de carpeta"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Los documentos se moverán automáticamente a estas carpetas según su
              clasificación
            </p>
          </div>
        )}

        <div className="border-t pt-6 bg-yellow-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <div className="flex items-start gap-2">
            <Settings className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">
                Nota sobre límites de API
              </p>
              <p className="text-yellow-800">
                La clasificación con IA usa Google Gemini. La versión gratuita tiene un
                límite de 50 solicitudes por día. Para volúmenes mayores, considera
                actualizar tu plan de API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAutomationConfig;
