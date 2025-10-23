import React, { useState, useEffect } from 'react';
import { View } from './DashboardPage';
import { automationsService, Automation } from '../src/services/automationsService';
import { MailIcon } from '../components/icons/MailIcon';
import { CpuChipIcon } from '../components/icons/CpuChipIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XIcon } from '../components/icons/XIcon';

interface AutomationPageProps {
  setActiveView: (view: View) => void;
}

const AutomationPage: React.FC<AutomationPageProps> = ({ setActiveView }) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
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
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await automationsService.getAll();
      setAutomations(data);
    } catch (error) {
      console.error('Error loading automations:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar las automatizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutomation = async () => {
    try {
      if (editingAutomation) {
        await automationsService.update(editingAutomation.id, formData);
      } else {
        await automationsService.create(formData);
      }
      setShowCreateModal(false);
      setEditingAutomation(null);
      setFormData({
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
      loadAutomations();
    } catch (error) {
      console.error('Error saving automation:', error);
      alert('Error al guardar la automatización');
    }
  };

  const handleToggleAutomation = async (id: string) => {
    try {
      await automationsService.toggleEnabled(id);
      loadAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
      alert('Error al cambiar el estado de la automatización');
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
      return;
    }

    try {
      await automationsService.delete(id);
      loadAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
      alert('Error al eliminar la automatización');
    }
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
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
    setShowCreateModal(true);
  };

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'email_to_operation':
        return <MailIcon className="w-6 h-6" />;
      default:
        return <CpuChipIcon className="w-6 h-6" />;
    }
  };

  const getAutomationTypeLabel = (type: string) => {
    switch (type) {
      case 'email_to_operation':
        return 'Vincular Emails a Operaciones';
      default:
        return type;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automatizaciones</h1>
              <p className="mt-2 text-gray-600">
                Configura reglas automáticas para agilizar tus procesos
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAutomation(null);
                setFormData({
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
                setShowCreateModal(true);
              }}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nueva Automatización
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">¿Cómo funciona la detección de emails?</h3>
          <p className="text-sm text-blue-800 mb-2">
            El sistema vincula emails a operaciones específicas usando múltiples criterios:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
            <li><strong>Patrones en el asunto:</strong> Detecta texto específico como "OP-019" o prefijos personalizados</li>
            <li><strong>Email del cliente:</strong> Busca emails donde el cliente aparece en from/to</li>
            <li><strong>Números de seguimiento:</strong> Detecta Booking, MBL/AWB, HBL en el asunto del email</li>
          </ul>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
            <div className="bg-red-100 rounded-full p-6 inline-block mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar las automatizaciones
            </h3>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={loadAutomations}
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : automations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-slate-100 rounded-full p-6 inline-block mb-4">
              <CpuChipIcon className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay reglas configuradas
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera regla para comenzar a vincular correos con operaciones
            </p>
            <button
              onClick={() => {
                setEditingAutomation(null);
                setFormData({
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
                setShowCreateModal(true);
              }}
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Regla
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${automation.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      {getAutomationIcon(automation.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {automation.name}
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {getAutomationTypeLabel(automation.type)}
                        </span>
                        {automation.enabled ? (
                          <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Activa
                          </span>
                        ) : (
                          <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            <XIcon className="w-3 h-3 mr-1" />
                            Inactiva
                          </span>
                        )}
                      </div>
                      {automation.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {automation.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Creada el {new Date(automation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAutomation(automation.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        automation.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {automation.enabled ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleEditAutomation(automation)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAutomation ? 'Editar Regla' : 'Nueva Regla'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAutomation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la regla
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Regla
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email_to_operation">Vincular Emails a Operaciones</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Criterios de Vinculación</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patrones a buscar en correos
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Ejemplos: "OP-019", "MOPC-", "{projectName}", "{operationId}"
                  </p>

                  {/* Variables disponibles */}
                  <div className="mb-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center">
                      <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] mr-2">VARIABLES</span>
                      Variables dinámicas disponibles:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <code className="text-indigo-700 font-mono font-semibold">{'{projectName}'}</code>
                        <p className="text-gray-600 mt-0.5">Nombre de la operación</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <code className="text-indigo-700 font-mono font-semibold">{'{operationId}'}</code>
                        <p className="text-gray-600 mt-0.5">ID de la operación</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <code className="text-indigo-700 font-mono font-semibold">{'{bookingTracking}'}</code>
                        <p className="text-gray-600 mt-0.5">Número de Booking</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <code className="text-indigo-700 font-mono font-semibold">{'{mbl_awb}'}</code>
                        <p className="text-gray-600 mt-0.5">MBL / AWB</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <code className="text-indigo-700 font-mono font-semibold">{'{hbl_awb}'}</code>
                        <p className="text-gray-600 mt-0.5">HBL / HAWB</p>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-800 mt-2 italic">
                      Los patrones pueden ser texto fijo o variables dinámicas.
                    </p>
                  </div>

                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-2">🔍 Buscar patrones en:</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.conditions.searchIn?.includes('subject')}
                          onChange={(e) => {
                            const current = formData.conditions.searchIn || [];
                            const newSearchIn = e.target.checked
                              ? [...current, 'subject']
                              : current.filter(s => s !== 'subject');
                            setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                searchIn: newSearchIn,
                              },
                            });
                          }}
                          className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                        />
                        📧 Asunto del email
                      </label>
                      <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.conditions.searchIn?.includes('body')}
                          onChange={(e) => {
                            const current = formData.conditions.searchIn || [];
                            const newSearchIn = e.target.checked
                              ? [...current, 'body']
                              : current.filter(s => s !== 'body');
                            setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                searchIn: newSearchIn,
                              },
                            });
                          }}
                          className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                        />
                        📄 Contenido del email
                      </label>
                      <label className="flex items-center text-xs text-blue-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.conditions.searchIn?.includes('attachments')}
                          onChange={(e) => {
                            const current = formData.conditions.searchIn || [];
                            const newSearchIn = e.target.checked
                              ? [...current, 'attachments']
                              : current.filter(s => s !== 'attachments');
                            setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                searchIn: newSearchIn,
                              },
                            });
                          }}
                          className="w-3 h-3 mr-1.5 text-blue-600 border-blue-300 rounded"
                        />
                        📎 Archivos adjuntos (PDFs, imágenes con OCR)
                      </label>
                    </div>
                  </div>
                  {formData.conditions.subjectPatterns.map((pattern, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={pattern}
                        onChange={(e) => {
                          const newPatterns = [...formData.conditions.subjectPatterns];
                          newPatterns[index] = e.target.value;
                          setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              subjectPatterns: newPatterns,
                            },
                          });
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: OP-019, MOPC-, {projectName}"
                      />
                      {formData.conditions.subjectPatterns.length > 1 && (
                        <button
                          onClick={() => {
                            const newPatterns = formData.conditions.subjectPatterns.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                subjectPatterns: newPatterns,
                              },
                            });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          subjectPatterns: [...formData.conditions.subjectPatterns, ''],
                        },
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Agregar patrón
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Métodos de detección</p>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useClientEmail"
                      checked={formData.conditions.useClientEmail}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          useClientEmail: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useClientEmail" className="ml-2 text-sm text-gray-700">
                      Email del cliente
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useBookingTracking"
                      checked={formData.conditions.useBookingTracking}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          useBookingTracking: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useBookingTracking" className="ml-2 text-sm text-gray-700">
                      Número de Booking/Tracking
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useMBL"
                      checked={formData.conditions.useMBL}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          useMBL: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useMBL" className="ml-2 text-sm text-gray-700">
                      Número MBL/AWB
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useHBL"
                      checked={formData.conditions.useHBL}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          useHBL: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useHBL" className="ml-2 text-sm text-gray-700">
                      Número HBL
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                  Activar inmediatamente
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAutomation(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAutomation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!formData.name}
              >
                {editingAutomation ? 'Guardar Cambios' : 'Crear Regla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationPage;