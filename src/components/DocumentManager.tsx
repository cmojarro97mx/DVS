import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  Trash2,
  Download,
  RefreshCw,
  Tag,
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';

interface Document {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  parentId?: string;
  classifiedAs?: string;
  classificationScore?: number;
  autoClassified: boolean;
  createdAt: string;
  children?: Document[];
}

interface DocumentManagerProps {
  operationId: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ operationId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/operation/${operationId}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const createFolder = async () => {
    const name = prompt('Nombre de la carpeta:');
    if (!name) return;

    try {
      await axios.post('/api/documents/folders', {
        operationId,
        name,
        parentId: selectedFolder,
      });
      await loadDocuments();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error al crear la carpeta');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('operationId', operationId);
        if (selectedFolder) {
          formData.append('folderId', selectedFolder);
        }

        await axios.post('/api/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    try {
      await axios.delete(`/api/documents/${id}?operationId=${operationId}`);
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const downloadDocument = async (id: string, name: string) => {
    try {
      const response = await axios.get(
        `/api/documents/${id}/download?operationId=${operationId}`,
      );
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  const renameDocument = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      await axios.patch(`/api/documents/${id}/rename`, {
        operationId,
        newName: editingName,
      });
      setEditingId(null);
      await loadDocuments();
    } catch (error) {
      console.error('Error renaming document:', error);
      alert('Error al renombrar');
    }
  };

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const classifyAllDocuments = async () => {
    if (!confirm('¿Clasificar automáticamente todos los documentos no clasificados?'))
      return;

    try {
      setLoading(true);
      await axios.post(`/api/documents/operation/${operationId}/batch-classify`);
      await loadDocuments();
      alert('Clasificación completada');
    } catch (error) {
      console.error('Error classifying documents:', error);
      alert('Error en la clasificación');
    } finally {
      setLoading(false);
    }
  };

  const renderDocument = (doc: Document, level = 0) => {
    const isEditing = editingId === doc.id;
    const isExpanded = expandedFolders.has(doc.id);

    return (
      <div key={doc.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
            selectedFolder === doc.id ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => doc.type === 'folder' && setSelectedFolder(doc.id)}
        >
          {doc.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(doc.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {doc.type === 'folder' ? (
            <Folder className="w-5 h-5 text-yellow-600" />
          ) : (
            <File className="w-5 h-5 text-gray-600" />
          )}

          {isEditing ? (
            <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
                autoFocus
              />
              <button
                onClick={() => renameDocument(doc.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-sm">{doc.name}</span>

              {doc.autoClassified && doc.classifiedAs && (
                <span
                  className={`px-2 py-1 text-xs rounded ${getClassificationColor(
                    doc.classifiedAs,
                  )}`}
                  title={`Confianza: ${((doc.classificationScore || 0) * 100).toFixed(0)}%`}
                >
                  {doc.classifiedAs}
                </span>
              )}

              {doc.type === 'file' && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => downloadDocument(doc.id, doc.name)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(doc.id);
                      setEditingName(doc.name);
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Renombrar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.name)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {doc.type === 'folder' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDocument(doc.id, doc.name);
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar carpeta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {doc.type === 'folder' && isExpanded && doc.children && (
          <div>{doc.children.map((child) => renderDocument(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const getClassificationColor = (classification: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
      invoice: 'bg-blue-100 text-blue-800',
      image: 'bg-purple-100 text-purple-800',
      xml: 'bg-orange-100 text-orange-800',
      contract: 'bg-indigo-100 text-indigo-800',
      customs: 'bg-teal-100 text-teal-800',
      shipping: 'bg-cyan-100 text-cyan-800',
      spam: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-600',
    };
    return colors[classification] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold">Documentos</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={classifyAllDocuments}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Clasificar Todo
          </button>
          <button
            onClick={createFolder}
            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Nueva Carpeta
          </button>
          <label className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Subiendo...' : 'Subir Archivos'}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className={`min-h-[300px] max-h-[600px] overflow-y-auto ${
          dragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
        }`}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) {
            handleFileUpload(e.dataTransfer.files);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            Cargando...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Upload className="w-12 h-12 mb-2" />
            <p>No hay documentos. Arrastra archivos aquí o usa el botón de subir.</p>
          </div>
        ) : (
          documents.map((doc) => renderDocument(doc))
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
