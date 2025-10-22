import React, { useState, useEffect, useRef } from 'react';
import { filesService, FileItem, FileFolder } from '../../services/filesService';

export default function FilesManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
    loadFolders();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await filesService.getAllFiles();
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await filesService.getAllFolders();
      setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = async (fileList: File[]) => {
    setIsUploading(true);
    try {
      for (const file of fileList) {
        await filesService.uploadFile(file, selectedFolder);
      }
      await loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al subir archivos. Por favor intente nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDeleteFile = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este archivo?')) {
      try {
        await filesService.deleteFile(id);
        await loadFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Error al eliminar el archivo.');
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await filesService.createFolder(newFolderName, selectedFolder);
      setNewFolderName('');
      setShowNewFolderModal(false);
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error al crear la carpeta.');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta carpeta y todos sus archivos?')) {
      try {
        await filesService.deleteFolder(id);
        await loadFolders();
        await loadFiles();
        if (selectedFolder === id) {
          setSelectedFolder(undefined);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Error al eliminar la carpeta.');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  const filteredFiles = selectedFolder
    ? files.filter(f => f.folderId === selectedFolder)
    : files.filter(f => !f.folderId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Archivos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Almacenamiento seguro en la nube con Backblaze B2
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              📁 Nueva Carpeta
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? '⏳ Subiendo...' : '📤 Subir Archivos'}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6 h-full">
          <div className="w-64 bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Carpetas</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(undefined)}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  !selectedFolder ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                📂 Todos los archivos
              </button>
              {folders.map(folder => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    📁 {folder.name}
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`h-full p-6 ${
                isDragging ? 'bg-blue-50 border-4 border-dashed border-blue-400' : ''
              }`}
            >
              {isDragging ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📤</div>
                    <p className="text-xl font-semibold text-blue-600">
                      Suelta los archivos aquí
                    </p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📂</div>
                    <p className="text-lg">No hay archivos</p>
                    <p className="text-sm mt-2">Arrastra archivos aquí o haz clic en "Subir Archivos"</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map(file => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 truncate mb-1" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      >
                        Abrir ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Nueva Carpeta</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de la carpeta"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
