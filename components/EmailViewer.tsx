import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentPdfIcon } from './icons/DocumentPdfIcon';

interface EmailViewerProps {
  email: any;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({ email, isOpen, onClose }) => {
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEmailHtml = async () => {
      if (!email || !isOpen) return;
      
      setLoading(true);
      try {
        if (email.htmlBodyUrl && email.htmlBodyUrl.startsWith('http')) {
          const response = await fetch(email.htmlBodyUrl);
          const html = await response.text();
          setEmailHtml(html);
        } else if (email.htmlBodyUrl) {
          setEmailHtml(email.htmlBodyUrl);
        } else if (email.body) {
          setEmailHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${email.body}</pre>`);
        } else if (email.snippet) {
          setEmailHtml(`<p>${email.snippet}</p>`);
        }
      } catch (error) {
        console.error('Error loading email HTML:', error);
        setEmailHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${email.body || email.snippet || 'No se pudo cargar el contenido del email'}</pre>`);
      } finally {
        setLoading(false);
      }
    };

    loadEmailHtml();
  }, [email, isOpen]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <PhotoIcon className="w-4 h-4 text-blue-500" />;
    } else if (ext === 'pdf') {
      return <DocumentPdfIcon className="w-4 h-4 text-red-500" />;
    }
    return <DocumentTextIcon className="w-4 h-4 text-gray-500" />;
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const b2Key = attachment.b2Key || attachment.key;
      
      if (!b2Key) {
        alert('No se puede descargar este archivo. Clave de almacenamiento no disponible.');
        return;
      }

      console.log('Descargando archivo con b2Key:', b2Key);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/email-sync/attachment-url/${encodeURIComponent(b2Key)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      // Fetch the file and force download
      const fileResponse = await fetch(data.url);
      if (!fileResponse.ok) throw new Error('Failed to fetch file');
      
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename || 'archivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Error al descargar el archivo. Por favor, intenta nuevamente.');
    }
  };

  const handlePreviewAttachment = async (attachment: any) => {
    try {
      const b2Key = attachment.b2Key || attachment.key;
      
      if (!b2Key) {
        alert('No se puede visualizar este archivo. Clave de almacenamiento no disponible.');
        return;
      }

      console.log('Visualizando archivo con b2Key:', b2Key);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/email-sync/attachment-url/${encodeURIComponent(b2Key)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error previewing attachment:', error);
      alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Tamaño desconocido';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen || !email) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {email.subject || '(Sin asunto)'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              type="button"
            >
              <XIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Email Info */}
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(email.fromName || email.from).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {email.fromName || email.from}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  &lt;{email.from}&gt;
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[35px]">Para:</span>
                  <span className="text-gray-700 line-clamp-1">
                    {Array.isArray(email.to) 
                      ? email.to.map((t: any) => t.email || t).join(', ') 
                      : email.to}
                  </span>
                </div>
                {email.cc && Array.isArray(email.cc) && email.cc.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[35px]">CC:</span>
                    <span className="text-gray-700 line-clamp-1">
                      {email.cc.map((c: any) => c.email || c).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[35px]">Fecha:</span>
                  <span className="text-gray-700">
                    {new Date(email.date).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-blue-600 mb-2"></div>
                <p className="text-gray-600 text-sm">Cargando contenido...</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-white">
                <iframe
                  srcDoc={emailHtml}
                  className="w-full border-0"
                  style={{ 
                    height: 'auto',
                    minHeight: '200px',
                    maxHeight: '400px',
                    border: 'none',
                  }}
                  sandbox="allow-same-origin allow-popups"
                  title="Email content"
                  onLoad={(e) => {
                    const iframe = e.currentTarget;
                    try {
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (iframeDoc) {
                        const height = Math.max(
                          iframeDoc.body.scrollHeight,
                          iframeDoc.documentElement.scrollHeight
                        );
                        iframe.style.height = Math.min(Math.max(height + 20, 200), 400) + 'px';
                      }
                    } catch (e) {
                      console.error('Error adjusting iframe height:', e);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        {(email.hasAttachments && email.attachmentsData && Array.isArray(email.attachmentsData) && email.attachmentsData.length > 0) && (
          <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/50 flex-shrink-0">
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <PaperClipIcon className="w-3 h-3 text-gray-500" />
              Adjuntos ({email.attachmentsData.length})
            </h4>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {email.attachmentsData.map((att: any, index: number) => {
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                    att.filename?.split('.').pop()?.toLowerCase() || ''
                  );

                  return (
                    <div
                      key={index}
                      className="group relative flex-shrink-0 w-20 bg-white border border-gray-200 rounded-md overflow-hidden hover:border-blue-400 hover:shadow transition-all"
                    >
                      {/* Preview Area */}
                      <div 
                        className="relative h-16 bg-gray-100 flex items-center justify-center cursor-pointer"
                        onClick={() => handlePreviewAttachment(att)}
                      >
                        {isImage ? (
                          <div className="flex flex-col items-center justify-center p-1">
                            {getFileIcon(att.filename)}
                            <span className="text-[8px] text-gray-500 mt-0.5 uppercase font-medium">
                              {att.filename?.split('.').pop() || 'img'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1">
                            {getFileIcon(att.filename)}
                            <span className="text-[8px] text-gray-500 mt-0.5 uppercase font-medium">
                              {att.filename?.split('.').pop() || 'file'}
                            </span>
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewAttachment(att);
                              }}
                              className="p-1 bg-white/95 hover:bg-white rounded-full transition-colors"
                              title="Ver"
                              type="button"
                            >
                              <EyeIcon className="w-3 h-3 text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAttachment(att);
                              }}
                              className="p-1 bg-white/95 hover:bg-white rounded-full transition-colors"
                              title="Descargar"
                              type="button"
                            >
                              <DownloadIcon className="w-3 h-3 text-green-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="px-1.5 py-1 border-t border-gray-100">
                        <p className="text-[9px] font-medium text-gray-900 truncate" title={att.filename}>
                          {att.filename}
                        </p>
                        <p className="text-[8px] text-gray-500">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
