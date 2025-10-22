import React, { useState, useEffect } from 'react';
import { X, Calendar, Mail, AlertCircle, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    discoverDateRange();
  }, []);

  const discoverDateRange = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/email-sync/accounts/${accountId}/discovery`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to discover email date range');
      }

      const data = await response.json();
      setDiscoveryData(data);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      setSelectedDate(sixMonthsAgo.toISOString().split('T')[0]);
    } catch (err: any) {
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

    if (discoveryData?.oldestEmailDate) {
      const oldestDate = new Date(discoveryData.oldestEmailDate);
      if (date < oldestDate) {
        date = oldestDate;
      }
    }

    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getEstimatedMessages = (): number => {
    if (!discoveryData || !selectedDate || !discoveryData.oldestEmailDate || !discoveryData.newestEmailDate) {
      return discoveryData?.estimatedTotalMessages || 0;
    }

    const oldest = new Date(discoveryData.oldestEmailDate).getTime();
    const newest = new Date(discoveryData.newestEmailDate).getTime();
    const selected = new Date(selectedDate).getTime();

    if (selected <= oldest) {
      return discoveryData.estimatedTotalMessages;
    }

    if (selected >= newest) {
      return 0;
    }

    const totalRange = newest - oldest;
    const selectedRange = newest - selected;
    const percentage = selectedRange / totalRange;

    return Math.round(discoveryData.estimatedTotalMessages * percentage);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Desconocido';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
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

      const response = await fetch(`/api/email-sync/accounts/${accountId}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Analizando tu cuenta de correo...</p>
            <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
          </div>
        </div>
      </div>
    );
  }

  const estimatedMessages = getEstimatedMessages();
  const estimatedSizeGB = (estimatedMessages * 0.05).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurar Sincronización de Correos</h2>
            <p className="text-sm text-gray-600 mt-1">{accountEmail}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {discoveryData && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Información de tu cuenta</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Correo más antiguo:</p>
                      <p className="font-medium text-blue-900">
                        {formatDate(discoveryData.oldestEmailDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Correo más reciente:</p>
                      <p className="font-medium text-blue-900">
                        {formatDate(discoveryData.newestEmailDate)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-blue-700">Total de mensajes en Gmail:</p>
                      <p className="font-medium text-blue-900">
                        {formatNumber(discoveryData.estimatedTotalMessages)} correos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                ¿Desde cuándo quieres sincronizar tus correos?
              </label>
              
              <div className="space-y-3 mb-4">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="3months"
                    checked={presetOption === '3months'}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Últimos 3 meses</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="6months"
                    checked={presetOption === '6months'}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Últimos 6 meses (Recomendado)</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="1year"
                    checked={presetOption === '1year'}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Último año</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="2years"
                    checked={presetOption === '2years'}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Últimos 2 años</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="all"
                    checked={presetOption === 'all'}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Todos los correos (puede tomar mucho tiempo)</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="preset"
                    value="custom"
                    checked={presetOption === 'custom'}
                    onChange={(e) => setPresetOption(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">Fecha personalizada</span>
                </label>
              </div>

              {presetOption === 'custom' && (
                <div className="mt-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={discoveryData.oldestEmailDate?.split('T')[0] || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Estimación de sincronización</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Mensajes a sincronizar:</p>
                  <p className="font-medium text-green-900 text-lg">
                    {formatNumber(estimatedMessages)} correos
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Espacio estimado:</p>
                  <p className="font-medium text-green-900 text-lg">
                    ~{estimatedSizeGB} GB
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Los correos se sincronizarán automáticamente cada 10 minutos en segundo plano
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
          </>
        )}
      </div>
    </div>
  );
};

export default EmailSyncWizard;
