import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Power, Copy, Check, ExternalLink } from 'lucide-react';
import api from '../../services/api';

interface VirtualAssistant {
  id: string;
  token: string;
  name: string;
  enabled: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
}

export default function VirtualAssistantConfigPage() {
  const [assistants, setAssistants] = useState<VirtualAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const data = await api.get<VirtualAssistant[]>('/virtual-assistant');
      setAssistants(data);
    } catch (error) {
      console.error('Error loading assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssistant = async () => {
    try {
      await api.post('/virtual-assistant', {
        name: newAssistantName || 'Asistente Virtual',
      });
      setShowCreateModal(false);
      setNewAssistantName('');
      fetchAssistants();
    } catch (error) {
      console.error('Error creating assistant:', error);
    }
  };

  const toggleAssistant = async (id: string) => {
    try {
      await api.post(`/virtual-assistant/${id}/toggle`);
      fetchAssistants();
    } catch (error) {
      console.error('Error toggling assistant:', error);
    }
  };

  const deleteAssistant = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este asistente?')) {
      return;
    }
    try {
      await api.delete(`/virtual-assistant/${id}`);
      fetchAssistants();
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/assistant/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const openAssistant = (token: string) => {
    window.open(`/assistant/${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Asistente Virtual
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona tus asistentes virtuales con voz
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Plus className="w-5 h-5" />
            Crear Asistente
          </button>
        </div>

        {assistants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes asistentes virtuales
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer asistente virtual para comenzar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Crear Primer Asistente
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        assistant.enabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <svg
                        className="w-7 h-7"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assistant.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Creado el{' '}
                        {new Date(assistant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAssistant(assistant.id)}
                      className={`p-2 rounded-lg ${
                        assistant.enabled
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={
                        assistant.enabled ? 'Desactivar' : 'Activar'
                      }
                    >
                      <Power className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteAssistant(assistant.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      Veces utilizado
                    </p>
                    <p className="text-xl font-semibold text-gray-900">
                      {assistant.usageCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      Último uso
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {assistant.lastUsedAt
                        ? new Date(
                            assistant.lastUsedAt,
                          ).toLocaleDateString()
                        : 'Nunca'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                    <p
                      className={`text-sm font-semibold ${
                        assistant.enabled
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {assistant.enabled ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/assistant/${assistant.token}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(assistant.token)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    {copiedToken === assistant.token ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openAssistant(assistant.token)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Crear Nuevo Asistente
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Asistente
              </label>
              <input
                type="text"
                value={newAssistantName}
                onChange={(e) => setNewAssistantName(e.target.value)}
                placeholder="Asistente Virtual"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createAssistant}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
