import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocuments } from '@/hooks/useDocuments';
import { getViewSignedUrl, getDownloadSignedUrl } from '@/lib/storage';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import DocumentPreview from '@/components/preview/DocumentPreview';
import toast from 'react-hot-toast';

export default function SharedView() {
  const { token } = useParams();
  const { getDocumentByShareToken } = useDocuments();

  const [document, setDocument] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchShared() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getDocumentByShareToken(token);
        setDocument(data.document);
        setExpiresAt(data.expires_at);

        if (data.document?.file_path) {
          try {
            const url = await getViewSignedUrl(data.document.file_path, 3600);
            setSignedUrl(url);
          } catch (storageErr) {
            console.warn('Storage URL generation error:', storageErr);
          }
        }
      } catch (err) {
        console.error('Error retrieving shared document:', err);
        setError(err.message || 'This share link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }

    fetchShared();
  }, [token, getDocumentByShareToken]);

  const handleDownload = async () => {
    if (!document?.file_path) return;
    try {
      toast.loading('Preparing download...', { id: 'shared-download' });
      const dlUrl = await getDownloadSignedUrl(document.file_path, document.title, document.file_name, 300);
      toast.dismiss('shared-download');

      const a = window.document.createElement('a');
      a.href = dlUrl;
      a.download = document.file_name || document.title || 'document';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      toast.dismiss('shared-download');
      toast.error('Download failed. The link may have expired.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-24">
        <Loading size="lg" text="Verifying share token and loading document..." />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">Link Expired or Invalid</h1>
          <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
            {error || 'This shared document link has expired or was revoked by the vault owner.'}
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Go to MyVault Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const isImage = document.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name || '');
  const isPdf = document.file_type === 'application/pdf' || /\.pdf$/i.test(document.file_name || '');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Notice */}
        <div className="mb-6 bg-primary-50/70 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                Shared Document via MyVault
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {expiresAt ? `Valid until ${format(new Date(expiresAt), 'MMM dd, yyyy • hh:mm a')}` : 'Private share link'}
              </p>
            </div>
          </div>
          <Link to="/signup" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
            Create your own vault <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Document Card */}
        <div className="card overflow-hidden">
          {/* Document Header */}
          <div className="p-6 sm:p-8 border-b border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {document.category?.name && (
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 mb-3">
                    {document.category.name}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
                  {document.title}
                </h1>
                {document.description && (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                    {document.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleDownload}
                className="btn-primary shrink-0 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>

            {/* Document Metadata Badges */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border)]">
              {document.issue_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>Issued: {format(new Date(document.issue_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {document.file_size > 0 && (
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-primary-500" />
                  <span>Size: {formatFileSize(document.file_size)}</span>
                </div>
              )}
              {document.file_name && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <span className="truncate max-w-[200px]">{document.file_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Preview Area */}
          <div className="p-4 sm:p-6 bg-[var(--color-surface)]">
            <DocumentPreview
              fileUrl={signedUrl}
              fileName={document.file_name}
              fileType={document.file_type}
              title={document.title}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
