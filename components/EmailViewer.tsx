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
      return <PhotoIcon className="w-5 h-5 text-blue-500" />;
    } else if (ext === 'pdf') {
      return <DocumentPdfIcon className="w-5 h-5 text-red-500" />;
    }
    return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      if (attachment.url) {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.filename || 'archivo';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Error al descargar el archivo');
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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {email.subject || '(Sin asunto)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            type="button"
          >
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Email Info */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(email.fromName || email.from).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-gray-900 text-sm">
                  {email.fromName || email.from}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  &lt;{email.from}&gt;
                </p>
              </div>
              <div className="mt-1.5 text-xs space-y-0.5">
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-10 flex-shrink-0">Para:</span>
                  <span className="text-gray-700">
                    {Array.isArray(email.to) 
                      ? email.to.map((t: any) => t.email || t).join(', ') 
                      : email.to}
                  </span>
                </div>
                {email.cc && Array.isArray(email.cc) && email.cc.length > 0 && (
                  <div className="flex items-start">
                    <span className="text-gray-500 font-medium w-10 flex-shrink-0">CC:</span>
                    <span className="text-gray-700">
                      {email.cc.map((c: any) => c.email || c).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-10 flex-shrink-0">Fecha:</span>
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
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mb-3"></div>
                <p className="text-gray-600 text-sm">Cargando contenido...</p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="bg-white rounded-lg">
                <iframe
                  srcDoc={emailHtml}
                  className="w-full min-h-[300px] border-0"
                  style={{ 
                    height: '300px',
                    border: 'none',
                  }}
                  sandbox="allow-same-origin"
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
                        iframe.style.height = Math.min(Math.max(height + 20, 300), 500) + 'px';
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
        {email.hasAttachments && email.attachmentsData && Array.isArray(email.attachmentsData) && email.attachmentsData.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/50">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <PaperClipIcon className="w-4 h-4 text-gray-500" />
              Adjuntos ({email.attachmentsData.length})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {email.attachmentsData.map((att: any, index: number) => {
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                  att.filename?.split('.').pop()?.toLowerCase() || ''
                );

                return (
                  <div
                    key={index}
                    className="group relative flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(att.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate" title={att.filename}>
                        {att.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(att.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImage && att.url && (
                        <button
                          onClick={() => window.open(att.url, '_blank')}
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver imagen"
                          type="button"
                        >
                          <EyeIcon className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadAttachment(att)}
                        className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                        title="Descargar"
                        type="button"
                      >
                        <DownloadIcon className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
