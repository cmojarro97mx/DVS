import React, { useState, useEffect, useRef } from 'react';
import { filesService, FileItem, FileFolder } from '../src/services/filesService';
import { Banner } from '../components/Banner';
import { FolderOpenIcon } from '../components/icons/FolderOpenIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';

export default function FilesManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeFileManager = async () => {
      try {
        await loadFiles();
        await loadFolders();
      } catch (error: any) {
        console.error('Error initializing file manager:', error);
        if (error.response?.status === 401) {
          setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
      }
    };
    
    initializeFileManager();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await filesService.getAllFiles();
      console.log('Files loaded successfully:', data.length);
      setFiles(data);
    } catch (error: any) {
      console.error('Error loading files:', error);
      const errorMsg = error.response?.status === 401 
        ? 'No autorizado. Por favor inicia sesión.'
        : error.response?.status === 500
        ? 'Error del servidor. Verifica la configuración de Backblaze.'
        : error.response?.data?.message || error.message || 'Error al cargar archivos';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await filesService.getAllFolders();
      console.log('Folders loaded successfully:', data.length);
      setFolders(data);
    } catch (error: any) {
      console.error('Error loading folders:', error);
      const errorMsg = error.response?.status === 401 
        ? 'No autorizado. Por favor inicia sesión.'
        : error.response?.data?.message || error.message || 'Error al cargar carpetas';
      setError(errorMsg);
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
    setError('');
    try {
      for (const file of fileList) {
        await filesService.uploadFile(file, selectedFolder);
      }
      await loadFiles();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al subir archivos. Verifica tu conexión con Backblaze.';
      setError(errorMsg);
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
    try {
      await filesService.deleteFile(id);
      await loadFiles();
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Error al eliminar el archivo.');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setError('');
    try {
      await filesService.createFolder(newFolderName, selectedFolder);
      setNewFolderName('');
      setShowNewFolderModal(false);
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Error al crear la carpeta.');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await filesService.deleteFolder(id);
      await loadFolders();
      await loadFiles();
      if (selectedFolder === id) {
        setSelectedFolder(undefined);
      }
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Error al eliminar la carpeta.');
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
    <div className="animate-fade-in space-y-6">
      <Banner
        title="File Manager"
        description="Almacenamiento seguro en la nube con Backblaze B2"
        icon={FolderOpenIcon}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedFolder 
                ? folders.find(f => f.id === selectedFolder)?.name || 'Carpeta' 
                : 'Todos los archivos'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FolderPlusIcon className="w-5 h-5" /> Nueva Carpeta
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isUploading}
              >
                <UploadCloudIcon className="w-5 h-5" />
                {isUploading ? 'Subiendo...' : 'Subir Archivos'}
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

        <div className="flex h-[600px]">
          <div className="w-64 border-r p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Carpetas</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(undefined)}
                className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                  !selectedFolder ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <FolderIcon className="w-4 h-4" /> Todos los archivos
              </button>
              {folders.map(folder => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                      selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <FolderIcon className="w-4 h-4" /> {folder.name}
                  </button>
                  <button
                    onClick={() => setItemToDelete({ type: 'folder', id: folder.id, name: folder.name })}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`h-full p-6 ${
                isDragging ? 'bg-blue-50 border-4 border-dashed border-blue-400' : ''
              }`}
            >
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                  </div>
                </div>
              ) : isDragging ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <UploadCloudIcon className="w-16 h-16 text-blue-400 mx-auto" />
                    <p className="text-xl font-semibold text-blue-600 mt-4">
                      Suelta los archivos aquí
                    </p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 p-10 border-2 border-dashed border-gray-300 rounded-xl">
                    <UploadCloudIcon className="w-16 h-16 text-gray-300 mx-auto" />
                    <p className="text-lg mt-4">No hay archivos</p>
                    <p className="text-sm mt-2">Arrastra archivos aquí o haz clic en "Subir Archivos"</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map(file => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow group bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                        <button
                          onClick={() => setItemToDelete({ type: 'file', id: file.id, name: file.name })}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
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

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete?.type === 'file') {
            handleDeleteFile(itemToDelete.id);
          } else if (itemToDelete?.type === 'folder') {
            handleDeleteFolder(itemToDelete.id);
          }
        }}
        title={`Eliminar ${itemToDelete?.type === 'file' ? 'archivo' : 'carpeta'}`}
      >
        ¿Estás seguro de que deseas eliminar "{itemToDelete?.name}"?
        {itemToDelete?.type === 'folder' && ' Todos los archivos en esta carpeta también serán eliminados.'}
        {' '}Esta acción no se puede deshacer.
      </ConfirmationModal>
    </div>
  );
}
