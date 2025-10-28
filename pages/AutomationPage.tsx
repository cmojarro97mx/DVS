import React, { useState, useEffect } from 'react';
import { View } from './DashboardPage';
import { automationsService, Automation } from '../src/services/automationsService';
import { MailIcon } from '../components/icons/MailIcon';
import { CpuChipIcon } from '../components/icons/CpuChipIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XIcon } from '../components/icons/XIcon';
import { CreateRuleLinkingModal, RuleFormData } from '../components/CreateRuleLinkingModal';
import { EditRuleLinkingModal } from '../components/EditRuleLinkingModal';
import DocumentAutomationConfig from '../src/components/DocumentAutomationConfig';

interface AutomationPageProps {
  setActiveView: (view: View) => void;
}

const AutomationPage: React.FC<AutomationPageProps> = ({ setActiveView }) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

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

  const handleCreateAutomation = async (data: RuleFormData) => {
    await automationsService.create(data);
    await loadAutomations();
  };

  const handleUpdateAutomation = async (id: string, data: RuleFormData) => {
    await automationsService.update(id, data);
    await loadAutomations();
  };

  const handleToggleAutomation = async (id: string) => {
    try {
      await automationsService.toggleEnabled(id);
      await loadAutomations();
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
      await loadAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
      alert('Error al eliminar la automatización');
    }
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nueva Automatización
            </button>
          </div>
        </div>

        <div className="mb-8">
          <DocumentAutomationConfig organizationId={localStorage.getItem('organizationId') || ''} />
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
              onClick={() => setShowCreateModal(true)}
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

      <CreateRuleLinkingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateAutomation}
      />

      <EditRuleLinkingModal
        isOpen={!!editingAutomation}
        onClose={() => setEditingAutomation(null)}
        onSave={handleUpdateAutomation}
        automation={editingAutomation}
      />
    </div>
  );
};

export default AutomationPage;
