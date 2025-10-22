import React, { useState, useEffect } from 'react';
import { X, Calendar, Mail, AlertCircle, Loader2, Clock, Database } from 'lucide-react';

interface EmailSyncWizardProps {
  accountId: string;
  accountEmail: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface DiscoveryData {
  oldestEmailDate: string | null;
  newestEmailDate: string | null;
  estimatedTotalMessages: number;
  cached: boolean;
}

interface PresetOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const EmailSyncWizard: React.FC<EmailSyncWizardProps> = ({
  accountId,
  accountEmail,
  onComplete,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [presetOption, setPresetOption] = useState<string>('6months');

  const presetOptions: PresetOption[] = [
    { id: 'currentMonth', label: 'Mes actual', description: 'Solo este mes', icon: '📬' },
    { id: '3months', label: '3 meses', description: 'Últimos 90 días', icon: '📅' },
    { id: '6months', label: '6 meses', description: 'Recomendado', icon: '⭐' },
    { id: '1year', label: '1 año', description: 'Últimos 365 días', icon: '📆' },
    { id: '2years', label: '2 años', description: 'Últimos 2 años', icon: '🗓️' },
    { id: 'all', label: 'Todo', description: 'Historial completo', icon: '♾️' },
    { id: 'custom', label: 'Personalizado', description: 'Elige fecha', icon: '🎯' },
  ];

  useEffect(() => {
    discoverDateRange();
  }, []);

  const discoverDateRange = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Wizard] Starting discovery for accountId:', accountId);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/email-sync/accounts/${accountId}/discovery`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Wizard] Response status:', response.status, response.statusText);
      console.log('[Wizard] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Wizard] Error response:', errorText);
        throw new Error(`Failed to discover email date range: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Wizard] Discovery data received:', data);
      
      if (!data.oldestEmailDate) {
        console.error('[Wizard] Missing oldestEmailDate in response');
        throw new Error('Invalid discovery response: missing date information');
      }
      
      setDiscoveryData(data);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      setSelectedDate(sixMonthsAgo.toISOString().split('T')[0]);
      console.log('[Wizard] Discovery completed successfully');
    } catch (err: any) {
      console.error('[Wizard] Discovery error:', err);
      setError(err.message || 'Error al descubrir el rango de fechas');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setPresetOption(preset);
    const today = new Date();
    let date = new Date();

    switch (preset) {
      case 'currentMonth':
        date = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case '3months':
        date.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        date.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        date.setFullYear(today.getFullYear() - 1);
        break;
      case '2years':
        date.setFullYear(today.getFullYear() - 2);
        break;
      case 'all':
        if (discoveryData?.oldestEmailDate) {
          date = new Date(discoveryData.oldestEmailDate);
        } else {
          date.setFullYear(today.getFullYear() - 10);
        }
        break;
      case 'custom':
        return;
    }

    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getEstimatedMessages = (): number => {
    if (!discoveryData || !selectedDate) return 0;

    const totalMessages = discoveryData.estimatedTotalMessages;
    const oldestDate = new Date(discoveryData.oldestEmailDate || new Date());
    const newestDate = new Date(discoveryData.newestEmailDate || new Date());
    const selectedDateObj = new Date(selectedDate);

    const totalDays = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    const selectedDays = Math.max(1, (newestDate.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24));

    const messagesPerDay = totalMessages / totalDays;
    return Math.round(messagesPerDay * selectedDays);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Desconocido';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/email-sync/accounts/${accountId}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncFromDate: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save sync settings');
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Analizando cuenta...</p>
            <p className="text-xs text-gray-500 mt-1">Esto puede tomar unos segundos</p>
          </div>
        </div>
      </div>
    );
  }

  const estimatedMessages = getEstimatedMessages();
  const estimatedSizeGB = (estimatedMessages * 0.05).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">Sincronización de Correos</h2>
            <p className="text-xs text-gray-500 truncate mt-0.5">{accountEmail}</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {discoveryData && (
            <>
              {/* Info compacta */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-blue-700">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    <span>{formatNumber(discoveryData.estimatedTotalMessages)} correos totales</span>
                  </div>
                  <div className="text-blue-600">
                    {formatDate(discoveryData.oldestEmailDate)} - Hoy
                  </div>
                </div>
              </div>

              {/* Selector de rango */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona el período a sincronizar
                </label>
                
                {/* Tarjetas deslizables */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex gap-2 min-w-max">
                    {presetOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handlePresetChange(option.id)}
                        className={`
                          flex-shrink-0 w-28 p-3 rounded-lg border-2 transition-all
                          ${presetOption === option.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date picker personalizado */}
                {presetOption === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={discoveryData.oldestEmailDate?.split('T')[0] || undefined}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Estimación compacta */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-green-900">Estimación</h3>
                  <Database className="w-4 h-4 text-green-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700">Mensajes</p>
                    <p className="text-lg font-bold text-green-900">
                      {formatNumber(estimatedMessages)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Espacio aprox.</p>
                    <p className="text-lg font-bold text-green-900">
                      ~{estimatedSizeGB} GB
                    </p>
                  </div>
                </div>
                <div className="flex items-center mt-2 pt-2 border-t border-green-200">
                  <Clock className="w-3 h-3 text-green-600 mr-1.5" />
                  <p className="text-xs text-green-700">
                    Sincronización automática cada 10 min
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedDate}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Iniciar Sincronización'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSyncWizard;
