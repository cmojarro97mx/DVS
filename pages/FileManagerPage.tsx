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
  Grid3x3,
  List,
  HardDrive,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  url: string;
  storageKey: string;
  size: number;
  mimeType: string;
  createdAt: string;
  source: 'files' | 'operations' | 'emails';
  folder: {
    id: string;
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['files', 'operations', 'emails']));

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesResponse, statsResponse] = await Promise.all([
        api.get('/files/manager/all'),
        api.get('/files/manager/stats'),
      ]);
      
      const files = Array.isArray(filesResponse) ? filesResponse : (filesResponse?.data || []);
      const stats = statsResponse?.data || statsResponse || {};
      
      setFiles(files);
      setStats(stats);
    } catch (error) {
      console.error('[FileManager] Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsResponse = await api.get('/files/manager/stats');
      const stats = statsResponse?.data || statsResponse || {};
      setStats(stats);
    } catch (error) {
      console.error('[FileManager] Error loading stats:', error);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="w-4 h-4 text-yellow-500" />;
    if (mimeType.includes('html')) return <Mail className="w-4 h-4 text-orange-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getThumbnail = (file: FileItem) => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <img 
          src={file.url} 
          alt={file.name}
          className="w-full h-16 object-cover rounded-t"
          loading="lazy"
        />
      );
    }
    
    return (
      <div className="w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t flex items-center justify-center">
        {getFileIcon(file.mimeType)}
      </div>
    );
  };

  const filteredFiles = (files || []).filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || file.source === filterSource;
    const matchesType = filterType === 'all' || file.mimeType.includes(filterType);
    return matchesSearch && matchesSource && matchesType;
  });

  // Group files by source
  const filesBySource = {
    files: filteredFiles.filter(f => f.source === 'files'),
    operations: filteredFiles.filter(f => f.source === 'operations'),
    emails: filteredFiles.filter(f => f.source === 'emails'),
  };

  // Group general files by folder
  const filesByFolder = filesBySource.files.reduce((acc, file) => {
    const folderKey = file.folder?.id || 'no-folder';
    const folderName = file.folder?.name || 'Sin Carpeta';
    if (!acc[folderKey]) {
      acc[folderKey] = { name: folderName, files: [] };
    }
    acc[folderKey].files.push(file);
    return acc;
  }, {} as Record<string, { name: string; files: FileItem[] }>);

  // Group operation documents by operation
  const filesByOperation = filesBySource.operations.reduce((acc, file) => {
    const opKey = file.operationReference || 'no-operation';
    if (!acc[opKey]) {
      acc[opKey] = [];
    }
    acc[opKey].push(file);
    return acc;
  }, {} as Record<string, FileItem[]>);

  const renderFileCard = (file: FileItem) => (
    <div
      key={file.id}
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
        {getThumbnail(file)}
        <div className="p-2">
          <div className="flex items-start gap-1 mb-1">
            {getFileIcon(file.mimeType)}
            <p className="text-xs font-medium text-gray-800 truncate flex-1" title={file.name}>
              {file.name}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.createdAt)}</span>
          </div>
        </div>
      </a>
    </div>
  );

  const renderFileList = (file: FileItem) => (
    <a
      key={file.id}
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded group"
    >
      <div className="flex-shrink-0">
        {getFileIcon(file.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="hidden sm:inline">{formatFileSize(file.size)}</span>
        <span className="hidden md:inline">{formatDate(file.createdAt)}</span>
        <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <div className="text-gray-500">Cargando archivos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Gestor de Archivos
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Vista unificada de {stats?.totalCount || 0} archivos organizados
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-800">{stats.totalCount}</p>
              </div>
              <File className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Espacio</p>
                <p className="text-lg font-bold text-gray-800">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Archivos</p>
                <p className="text-lg font-bold text-gray-800">{stats.filesCount}</p>
              </div>
              <Folder className="w-6 h-6 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Operaciones</p>
                <p className="text-lg font-bold text-gray-800">{stats.documentsCount}</p>
              </div>
              <Briefcase className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Emails</p>
                <p className="text-lg font-bold text-gray-800">{stats.emailFilesCount}</p>
              </div>
              <Mail className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-3 border border-gray-100">
        <div className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los orígenes</option>
              <option value="files">Archivos Generales</option>
              <option value="operations">Documentos de Operaciones</option>
              <option value="emails">Archivos de Emails</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="image">Imágenes</option>
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="video">Videos</option>
              <option value="zip">Archivos</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron archivos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* General Files Section */}
            {filesBySource.files.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('files')}
                  className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-800">Archivos Generales</span>
                    <span className="text-sm text-gray-500">({filesBySource.files.length})</span>
                  </div>
                  {expandedSections.has('files') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {expandedSections.has('files') && (
                  <div className="p-4 space-y-4">
                    {Object.entries(filesByFolder).map(([folderId, folder]) => (
                      <div key={folderId}>
                        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-yellow-500" />
                          {folder.name}
                        </h3>
                        <div className={viewMode === 'grid' 
                          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2'
                          : 'space-y-1'
                        }>
                          {folder.files.map(file => viewMode === 'grid' ? renderFileCard(file) : renderFileList(file))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operations Section */}
            {filesBySource.operations.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('operations')}
                  className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-800">Documentos de Operaciones</span>
                    <span className="text-sm text-gray-500">({filesBySource.operations.length})</span>
                  </div>
                  {expandedSections.has('operations') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {expandedSections.has('operations') && (
                  <div className="p-4 space-y-4">
                    {Object.entries(filesByOperation).map(([opRef, files]) => (
                      <div key={opRef}>
                        <h3 className="font-medium text-gray-700 mb-2">{opRef}</h3>
                        <div className={viewMode === 'grid' 
                          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2'
                          : 'space-y-1'
                        }>
                          {files.map(file => viewMode === 'grid' ? renderFileCard(file) : renderFileList(file))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emails Section */}
            {filesBySource.emails.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('emails')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-800">Archivos de Emails</span>
                    <span className="text-sm text-gray-500">({filesBySource.emails.length})</span>
                  </div>
                  {expandedSections.has('emails') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {expandedSections.has('emails') && (
                  <div className="p-4">
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2'
                      : 'space-y-1'
                    }>
                      {filesBySource.emails.map(file => viewMode === 'grid' ? renderFileCard(file) : renderFileList(file))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
