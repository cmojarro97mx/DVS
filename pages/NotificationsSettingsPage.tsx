import { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import { Bell, Save } from 'lucide-react';

interface NotificationSettings {
  pushEnabled: boolean;
  operationsEnabled: boolean;
  tasksEnabled: boolean;
  paymentsEnabled: boolean;
  invoicesEnabled: boolean;
  expensesEnabled: boolean;
  calendarEnabled: boolean;
  emailsEnabled: boolean;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    operationsEnabled: true,
    tasksEnabled: true,
    paymentsEnabled: true,
    invoicesEnabled: true,
    expensesEnabled: true,
    calendarEnabled: true,
    emailsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/notifications/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setMessage('Error al cargar la configuración. Usando valores predeterminados.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/notifications/settings', settings);
      setMessage('Configuración guardada correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Configuración de Notificaciones
        </h1>
        <p className="text-gray-600 mt-2">
          Controla qué notificaciones push deseas recibir en tu navegador
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Notificaciones Push</h3>
                <p className="text-sm text-gray-600">
                  Habilitar o deshabilitar todas las notificaciones push
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushEnabled}
                  onChange={() => handleToggle('pushEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {settings.pushEnabled && (
            <>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Tipos de notificaciones</h4>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Operaciones</p>
                    <p className="text-sm text-gray-600">
                      Nuevas operaciones asignadas y actualizaciones
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.operationsEnabled}
                      onChange={() => handleToggle('operationsEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Tareas</p>
                    <p className="text-sm text-gray-600">
                      Tareas asignadas y completadas
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.tasksEnabled}
                      onChange={() => handleToggle('tasksEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Facturas</p>
                    <p className="text-sm text-gray-600">
                      Nuevas facturas creadas
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.invoicesEnabled}
                      onChange={() => handleToggle('invoicesEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Pagos</p>
                    <p className="text-sm text-gray-600">
                      Nuevos pagos registrados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentsEnabled}
                      onChange={() => handleToggle('paymentsEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Gastos</p>
                    <p className="text-sm text-gray-600">
                      Nuevos gastos registrados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.expensesEnabled}
                      onChange={() => handleToggle('expensesEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Calendario</p>
                    <p className="text-sm text-gray-600">
                      Nuevos eventos en tu calendario
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.calendarEnabled}
                      onChange={() => handleToggle('calendarEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Emails</p>
                    <p className="text-sm text-gray-600">
                      Emails importantes no leídos o destacados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailsEnabled}
                      onChange={() => handleToggle('emailsEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          {message && (
            <p className={`mt-3 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Sobre las notificaciones push</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Las notificaciones se muestran en tu navegador incluso cuando la pestaña está cerrada</li>
          <li>• Tu navegador debe permitir notificaciones de este sitio</li>
          <li>• Solo recibirás notificaciones sobre eventos que te afecten directamente</li>
        </ul>
      </div>
    </div>
  );
}
