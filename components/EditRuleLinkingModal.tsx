import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { Automation } from '../src/services/automationsService';

interface EditRuleLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: RuleFormData) => Promise<void>;
  automation: Automation | null;
}

export interface RuleFormData {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  conditions: {
    subjectPatterns: string[];
    searchIn: string[];
    useClientEmail: boolean;
    useBookingTracking: boolean;
    useMBL: boolean;
    useHBL: boolean;
    useOperationId: boolean;
  };
}

export const EditRuleLinkingModal: React.FC<EditRuleLinkingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  automation,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    type: 'email_to_operation',
    enabled: true,
    conditions: {
      subjectPatterns: [''],
      searchIn: ['subject', 'body'],
      useClientEmail: true,
      useBookingTracking: true,
      useMBL: true,
      useHBL: true,
      useOperationId: true,
    },
  });

  useEffect(() => {
    if (automation) {
      const conditions = automation.conditions as any || {};
      setFormData({
        name: automation.name,
        description: automation.description || '',
        type: automation.type,
        enabled: automation.enabled,
        conditions: {
          subjectPatterns: conditions.subjectPatterns || [''],
          searchIn: conditions.searchIn || ['subject', 'body'],
          useClientEmail: conditions.useClientEmail !== false,
          useBookingTracking: conditions.useBookingTracking !== false,
          useMBL: conditions.useMBL !== false,
          useHBL: conditions.useHBL !== false,
          useOperationId: conditions.useOperationId !== false,
        },
      });
    }
  }, [automation]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !automation) {
      alert('Por favor ingresa un nombre para la regla');
      return;
    }

    try {
      setLoading(true);
      await onSave(automation.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating rule:', error);
      alert('Error al actualizar la regla. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const updatePatterns = (index: number, value: string) => {
    const newPatterns = [...formData.conditions.subjectPatterns];
    newPatterns[index] = value;
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        subjectPatterns: newPatterns,
      },
    });
  };

  const removePattern = (index: number) => {
    const newPatterns = formData.conditions.subjectPatterns.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        subjectPatterns: newPatterns.length > 0 ? newPatterns : [''],
      },
    });
  };

  const addPattern = () => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        subjectPatterns: [...formData.conditions.subjectPatterns, ''],
      },
    });
  };

  const toggleSearchIn = (field: string) => {
    const current = formData.conditions.searchIn;
    const newSearchIn = current.includes(field)
      ? current.filter(s => s !== field)
      : [...current, field];
    
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        searchIn: newSearchIn,
      },
    });
  };

  if (!isOpen || !automation) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Editar Regla de Vinculación</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la regla *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Vincular emails de clientes a operaciones"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe qué hace esta regla"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Criterios de Vinculación</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patrones a buscar en correos
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Ejemplos: "OP-019", "MOPC-", "{'{'}projectName{'}'}", "{'{'}operationId{'}'}"
              </p>

              <div className="mb-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center">
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] mr-2">VARIABLES</span>
                  Variables dinámicas disponibles:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <code className="text-indigo-700 font-mono font-semibold">{'{'}projectName{'}'}</code>
                    <p className="text-gray-600 mt-0.5">Nombre de la operación</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <code className="text-indigo-700 font-mono font-semibold">{'{'}operationId{'}'}</code>
                    <p className="text-gray-600 mt-0.5">ID de la operación</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <code className="text-indigo-700 font-mono font-semibold">{'{'}bookingTracking{'}'}</code>
                    <p className="text-gray-600 mt-0.5">Número de Booking</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <code className="text-indigo-700 font-mono font-semibold">{'{'}mbl_awb{'}'}</code>
                    <p className="text-gray-600 mt-0.5">MBL / AWB</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-100">
                    <code className="text-indigo-700 font-mono font-semibold">{'{'}hbl_awb{'}'}</code>
                    <p className="text-gray-600 mt-0.5">HBL / HAWB</p>
                  </div>
                </div>
                <p className="text-xs text-indigo-800 mt-2 italic">
                  Los patrones pueden ser texto fijo o variables dinámicas.
                </p>
              </div>

              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Buscar patrones en:</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.conditions.searchIn.includes('subject')}
                      onChange={() => toggleSearchIn('subject')}
                      className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                    />
                    Asunto del email
                  </label>
                  <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.conditions.searchIn.includes('body')}
                      onChange={() => toggleSearchIn('body')}
                      className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                    />
                    Contenido del email
                  </label>
                  <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.conditions.searchIn.includes('attachments')}
                      onChange={() => toggleSearchIn('attachments')}
                      className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                    />
                    Archivos adjuntos (PDFs, imágenes con OCR)
                  </label>
                </div>
              </div>

              {formData.conditions.subjectPatterns.map((pattern, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => updatePatterns(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: OP-019, MOPC-, {projectName}"
                  />
                  {formData.conditions.subjectPatterns.length > 1 && (
                    <button
                      onClick={() => removePattern(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      type="button"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPattern}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                type="button"
              >
                + Agregar patrón
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Métodos de detección</p>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-useClientEmail"
                  checked={formData.conditions.useClientEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        useClientEmail: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-useClientEmail" className="ml-2 text-sm text-gray-700">
                  Email del cliente
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-useBookingTracking"
                  checked={formData.conditions.useBookingTracking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        useBookingTracking: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-useBookingTracking" className="ml-2 text-sm text-gray-700">
                  Número de Booking/Tracking
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-useMBL"
                  checked={formData.conditions.useMBL}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        useMBL: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-useMBL" className="ml-2 text-sm text-gray-700">
                  Número MBL/AWB
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-useHBL"
                  checked={formData.conditions.useHBL}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        useHBL: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-useHBL" className="ml-2 text-sm text-gray-700">
                  Número HBL
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center pt-4 border-t border-gray-200">
            <input
              type="checkbox"
              id="edit-enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="edit-enabled" className="ml-2 text-sm text-gray-700">
              Regla activa
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={!formData.name.trim() || loading}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
