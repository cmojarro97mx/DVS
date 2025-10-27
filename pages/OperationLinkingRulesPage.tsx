import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Power } from 'lucide-react';
import { operationLinkingRulesService, OperationLinkingRule, CreateOperationLinkingRuleDto } from '../src/services/operationLinkingRulesService';
import { employeesService } from '../src/services/employeesService';

interface Employee {
  id: string;
  userId: string;
  name: string;
}

export default function OperationLinkingRulesPage() {
  const [rules, setRules] = useState<OperationLinkingRule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<OperationLinkingRule | null>(null);
  const [formData, setFormData] = useState<CreateOperationLinkingRuleDto>({
    subjectPattern: '',
    defaultAssigneeIds: [],
    companyDomains: [],
    autoCreate: true,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyDomainInput, setCompanyDomainInput] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [rulesData, employeesData] = await Promise.all([
        operationLinkingRulesService.getRules(),
        employeesService.getAll(),
      ]);
      setRules(rulesData);
      setEmployees(employeesData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      subjectPattern: '',
      defaultAssigneeIds: [],
      companyDomains: [],
      autoCreate: true,
      enabled: true,
    });
    setCompanyDomainInput('');
    setEditingRule(null);
    setShowCreateModal(true);
  };

  const handleEdit = (rule: OperationLinkingRule) => {
    setFormData({
      subjectPattern: rule.subjectPattern,
      defaultAssigneeIds: rule.defaultAssigneeIds,
      companyDomains: rule.companyDomains || [],
      autoCreate: rule.autoCreate,
      enabled: rule.enabled,
    });
    setCompanyDomainInput((rule.companyDomains || []).join(', '));
    setEditingRule(rule);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.subjectPattern.trim()) {
      setError('El patrón de asunto es obligatorio');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingRule) {
        await operationLinkingRulesService.updateRule(editingRule.id, formData);
      } else {
        await operationLinkingRulesService.createRule(formData);
      }
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving rule:', err);
      setError(err.response?.data?.message || 'Error al guardar regla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta regla?')) {
      return;
    }

    try {
      await operationLinkingRulesService.deleteRule(id);
      loadData();
    } catch (err: any) {
      console.error('Error deleting rule:', err);
      setError(err.response?.data?.message || 'Error al eliminar regla');
    }
  };

  const handleToggle = async (rule: OperationLinkingRule) => {
    try {
      await operationLinkingRulesService.updateRule(rule.id, {
        enabled: !rule.enabled,
      });
      loadData();
    } catch (err: any) {
      console.error('Error toggling rule:', err);
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const toggleAssignee = (employeeId: string) => {
    setFormData((prev) => {
      const isSelected = prev.defaultAssigneeIds.includes(employeeId);
      return {
        ...prev,
        defaultAssigneeIds: isSelected
          ? prev.defaultAssigneeIds.filter((id) => id !== employeeId)
          : [...prev.defaultAssigneeIds, employeeId],
      };
    });
  };

  const handleCompanyDomainChange = (value: string) => {
    setCompanyDomainInput(value);
    const domains = value
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
    setFormData({ ...formData, companyDomains: domains });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reglas de Vinculación</h1>
          <p className="text-gray-600 text-sm mt-1">
            Configura patrones para detectar y crear operaciones automáticamente desde emails
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay reglas configuradas</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear primera regla
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{rule.subjectPattern}</h3>
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        rule.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {rule.enabled ? 'Activa' : 'Inactiva'}
                    </button>
                    {rule.autoCreate && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Creación automática
                      </span>
                    )}
                  </div>
                  
                  {rule.defaultAssigneeIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Asignados por defecto:</p>
                      <div className="flex flex-wrap gap-2">
                        {rule.defaultAssigneeIds.map((empId) => {
                          const employee = employees.find((e) => e.id === empId);
                          return employee ? (
                            <span
                              key={empId}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {employee.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRule ? 'Editar Regla' : 'Nueva Regla'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patrón de asunto *
                  </label>
                  <input
                    type="text"
                    value={formData.subjectPattern}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectPattern: e.target.value })
                    }
                    placeholder="Ej: NAVI-, COTIZACION-, PEDIDO-"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los emails con este patrón en el asunto se procesarán automáticamente
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dominios de empresa
                  </label>
                  <input
                    type="text"
                    value={companyDomainInput}
                    onChange={(e) => handleCompanyDomainChange(e.target.value)}
                    placeholder="Ej: @navicargologistics.com, @navicargo.mx"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo se procesarán emails que VENGAN DE estos dominios. Los emails con estos dominios NO se extraerán como clientes (son empleados internos). Separa múltiples dominios con comas.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleados asignados por defecto
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {employees.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay empleados disponibles</p>
                    ) : (
                      <div className="space-y-2">
                        {employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.defaultAssigneeIds.includes(employee.id)}
                              onChange={() => toggleAssignee(employee.id)}
                              className="rounded text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{employee.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoCreate}
                      onChange={(e) =>
                        setFormData({ ...formData, autoCreate: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Crear operaciones automáticamente</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, enabled: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Regla activa</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
