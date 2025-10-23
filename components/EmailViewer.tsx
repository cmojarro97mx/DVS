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
  const [loadingFresh, setLoadingFresh] = useState(false);
  const [freshEmail, setFreshEmail] = useState<any>(null);

  useEffect(() => {
    const loadEmailHtml = async () => {
      if (!email || !isOpen) return;
      
      setLoading(true);
      setFreshEmail(null);
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

  const loadFreshEmail = async () => {
    if (!email.accountId || !email.gmailMessageId) {
      alert('No se puede cargar el diseño original. Información de cuenta faltante.');
      return;
    }

    setLoadingFresh(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/email-sync/fresh-email/${email.accountId}/${email.gmailMessageId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      
      if (data.success && data.email) {
        setFreshEmail(data.email);
        if (data.email.htmlBody) {
          setEmailHtml(data.email.htmlBody);
        } else if (data.email.textBody) {
          setEmailHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${data.email.textBody}</pre>`);
        }
      } else {
        throw new Error(data.message || 'Error al cargar el correo');
      }
    } catch (error) {
      console.error('Error loading fresh email:', error);
      alert('Error al cargar el diseño original del correo. Por favor, intenta nuevamente.');
    } finally {
      setLoadingFresh(false);
    }
  };

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
      let downloadUrl = attachment.url;
      
      // If URL is not available or might be expired, try to get a fresh one
      if (!downloadUrl || downloadUrl.includes('X-Amz-Expires')) {
        console.log('Regenerating signed URL for attachment...');
        try {
          const response = await fetch(`/api/email-sync/attachment-url/${encodeURIComponent(attachment.b2Key)}`);
          const data = await response.json();
          downloadUrl = data.url;
        } catch (err) {
          console.error('Failed to regenerate URL:', err);
        }
      }

      if (downloadUrl) {
        // Fetch the file and force download
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.filename || 'archivo';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Error al descargar el archivo. Por favor, intenta nuevamente.');
    }
  };

  const handlePreviewAttachment = async (attachment: any) => {
    try {
      let previewUrl = attachment.url;
      
      // If URL is not available or might be expired, try to get a fresh one
      if (!previewUrl || previewUrl.includes('X-Amz-Expires')) {
        console.log('Regenerating signed URL for preview...');
        try {
          const response = await fetch(`/api/email-sync/attachment-url/${encodeURIComponent(attachment.b2Key)}`);
          const data = await response.json();
          previewUrl = data.url;
        } catch (err) {
          console.error('Failed to regenerate URL:', err);
        }
      }

      if (previewUrl) {
        window.open(previewUrl, '_blank');
      }
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
            {!freshEmail && email.accountId && email.gmailMessageId && (
              <button
                onClick={loadFreshEmail}
                disabled={loadingFresh}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                type="button"
                title="Cargar diseño original desde Gmail"
              >
                {loadingFresh ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Diseño Original</span>
                  </>
                )}
              </button>
            )}
            {freshEmail && (
              <span className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-md flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Diseño Original
              </span>
            )}
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
                    minHeight: freshEmail ? '300px' : '200px',
                    maxHeight: freshEmail ? '600px' : '400px',
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
                        const maxHeight = freshEmail ? 600 : 400;
                        const minHeight = freshEmail ? 300 : 200;
                        iframe.style.height = Math.min(Math.max(height + 20, minHeight), maxHeight) + 'px';
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
        {((email.hasAttachments && email.attachmentsData && Array.isArray(email.attachmentsData) && email.attachmentsData.length > 0) || (freshEmail?.attachments && freshEmail.attachments.length > 0)) && (
          <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/50 flex-shrink-0">
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <PaperClipIcon className="w-3 h-3 text-gray-500" />
              Adjuntos ({(freshEmail?.attachments?.length || email.attachmentsData?.length || 0)})
            </h4>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {(freshEmail?.attachments || email.attachmentsData || []).map((att: any, index: number) => {
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                    att.filename?.split('.').pop()?.toLowerCase() || ''
                  );
                  
                  const isFreshEmailAttachment = !att.key;

                  return (
                    <div
                      key={index}
                      className="group relative flex-shrink-0 w-20 bg-white border border-gray-200 rounded-md overflow-hidden hover:border-blue-400 hover:shadow transition-all"
                    >
                      {/* Preview Area */}
                      <div 
                        className="relative h-16 bg-gray-100 flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (!isFreshEmailAttachment) {
                            handlePreviewAttachment(att);
                          }
                        }}
                      >
                        {isImage && att.url ? (
                          <img 
                            src={att.url} 
                            alt={att.filename}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1">
                            {getFileIcon(att.filename)}
                            <span className="text-[8px] text-gray-500 mt-0.5 uppercase font-medium">
                              {att.filename?.split('.').pop() || 'file'}
                            </span>
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        {!isFreshEmailAttachment ? (
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
                        ) : (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="p-2 bg-white/95 rounded-md">
                              <p className="text-[8px] text-gray-600 text-center">Disponible en Gmail</p>
                            </div>
                          </div>
                        )}
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
