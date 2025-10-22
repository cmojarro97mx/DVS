import { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import {
  Folder,
  File,
  FileText,
  Image,
  Video,
  FileArchive,
  Download,
  Search,
  Filter,
  Grid3x3,
  List,
  Calendar,
  HardDrive,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
  source: 'files' | 'operations' | 'emails';
  folder: {
    name: string;
  } | null;
  operationReference: string | null;
  emailReference?: string | null;
}

interface Stats {
  totalSize: number;
  totalCount: number;
  filesCount: number;
  documentsCount: number;
  emailFilesCount: number;
  typeStats: Record<string, number>;
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'files' | 'operations' | 'emails'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[FileManager] Loading files and stats...');
      const [filesResponse, statsResponse] = await Promise.all([
        api.get('/files/manager/all'),
        api.get('/files/manager/stats'),
      ]);
      console.log('[FileManager] Files received:', filesResponse.data.length);
      console.log('[FileManager] First file sample:', filesResponse.data[0]);
      console.log('[FileManager] Stats received:', statsResponse.data);
      setFiles(filesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('[FileManager] Error loading files:', error);
      console.error('[FileManager] Error details:', error.message, error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredFiles = (files || []).filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || file.source === filterSource;
    const matchesType = filterType === 'all' || file.mimeType.includes(filterType);
    return matchesSearch && matchesSource && matchesType;
  });

  const getFileTypeCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando archivos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Folder className="w-6 h-6" />
          Gestor de Archivos
        </h1>
        <p className="text-gray-600 mt-2">
          Vista unificada de todos los archivos almacenados en Backblaze
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Archivos</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalCount}</p>
              </div>
              <File className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Espacio Utilizado</p>
                <p className="text-2xl font-bold text-gray-800">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archivos Generales</p>
                <p className="text-2xl font-bold text-gray-800">{stats.filesCount}</p>
              </div>
              <Folder className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos de Operaciones</p>
                <p className="text-2xl font-bold text-gray-800">{stats.documentsCount}</p>
              </div>
              <FileText className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archivos de Emails</p>
                <p className="text-2xl font-bold text-gray-800">{stats.emailFilesCount}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los orígenes</option>
              <option value="files">Archivos Generales</option>
              <option value="operations">Documentos de Operaciones</option>
              <option value="emails">Archivos de Emails</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="image">Imágenes</option>
              <option value="pdf">PDFs</option>
              <option value="video">Videos</option>
              <option value="document">Documentos</option>
              <option value="spreadsheet">Hojas de cálculo</option>
              <option value="archive">Archivos comprimidos</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron archivos</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div className="flex flex-col items-center">
                    {file.mimeType.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded mb-2">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-800 truncate w-full text-center" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    {file.source === 'operations' && file.operationReference && (
                      <span className="mt-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        Op: {file.operationReference}
                      </span>
                    )}
                    {file.source === 'emails' && file.emailReference && (
                      <span className="mt-1 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                        📧 {file.emailReference}
                      </span>
                    )}
                    {file.folder && (
                      <span className="mt-1 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                        {file.folder.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{file.name}</p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.createdAt)}</span>
                        {file.source === 'operations' && file.operationReference && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">Op: {file.operationReference}</span>
                          </>
                        )}
                        {file.source === 'emails' && file.emailReference && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600">📧 {file.emailReference}</span>
                          </>
                        )}
                        {file.folder && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">{file.folder.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      file.source === 'files' 
                        ? 'bg-green-100 text-green-700' 
                        : file.source === 'operations'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {file.source === 'files' ? 'Archivo General' : file.source === 'operations' ? 'Operación' : 'Email'}
                    </span>
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Este módulo es solo de visualización. Los archivos se abren en una nueva pestaña y no se pueden modificar o eliminar desde aquí. Para gestionar archivos, utiliza los módulos correspondientes (Archivos, Operaciones, etc.).
        </p>
      </div>
    </div>
  );
}
