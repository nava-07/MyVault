import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  FileText,
  Image as ImageIcon,
  File,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { useCategories } from '@/hooks/useCategories';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import DocumentPreview from '@/components/preview/DocumentPreview';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Not specified';
  try {
    return format(new Date(dateStr), 'MMMM dd, yyyy');
  } catch (e) {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy • hh:mm a');
  } catch (e) {
    return dateStr;
  }
};

export default function FileView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    getDocument,
    updateDocument,
    replaceDocumentFile,
    deleteDocument,
    getViewUrl,
    getDownloadUrl,
  } = useDocuments();
  const { categories } = useCategories();

  const [doc, setDoc] = useState(null);
  const [viewUrl, setViewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Zoom control for images
  const [zoomLevel, setZoomLevel] = useState(1);

  // Edit metadata modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    issue_date: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Replace file modal
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replacementFile, setReplacementFile] = useState(null);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [isReplacing, setIsReplacing] = useState(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch document and presigned inline view URL
  const loadDocument = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setNotFound(false);
      const data = await getDocument(id);

      if (!data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setDoc(data);
      setEditForm({
        title: data.title || '',
        description: data.description || '',
        category_id: data.category_id || '',
        issue_date: data.issue_date || '',
      });

      // Request short-lived signed view URL from Supabase Storage
      if (data.file_path) {
        try {
          const url = await getViewUrl(data.file_path);
          setViewUrl(url);
        } catch (storageErr) {
          console.warn('Could not generate view URL:', storageErr);
        }
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id, getDocument, getViewUrl]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Handle Download (attachment disposition)
  const handleDownload = async () => {
    if (!doc?.file_path) return;
    try {
      toast.loading(`Preparing download: ${doc.file_name}...`, { id: 'file-download' });
      const downloadUrl = await getDownloadUrl(doc.file_path, doc.title, doc.file_name);
      toast.dismiss('file-download');

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name || doc.title;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      toast.dismiss('file-download');
      toast.error('Download failed. Please try again.');
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Document title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateDocument(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        category_id: editForm.category_id || null,
        issue_date: editForm.issue_date || null,
      });
      if (updated) {
        setDoc((prev) => ({ ...prev, ...updated }));
        setIsEditOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Replace File
  const handleReplaceFile = async (e) => {
    e.preventDefault();
    if (!replacementFile) {
      toast.error('Please choose a replacement file');
      return;
    }

    setIsReplacing(true);
    setReplaceProgress(0);
    try {
      const updated = await replaceDocumentFile(
        id,
        replacementFile,
        doc.file_path,
        (progress) => setReplaceProgress(progress)
      );

      if (updated) {
        setDoc(updated);
        setIsReplaceOpen(false);
        setReplacementFile(null);
        // Refresh view URL
        const newUrl = await getViewUrl(updated.file_path);
        setViewUrl(newUrl);
        toast.success('File replaced successfully in vault');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplacing(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDocument(id, doc.file_path);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-20">
        <Loading size="lg" text="Retrieving file from vault..." />
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-20 px-4">
        <div className="card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Document Not Found</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            This document does not exist or you do not have permission to view it.
          </p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isImage =
    doc.file_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.file_name || '');
  const isPdf =
    doc.file_type?.includes('pdf') || /\.pdf$/i.test(doc.file_name || '');
  const isDocx =
    doc.file_type?.includes('word') ||
    doc.file_type?.includes('officedocument') ||
    /\.(docx|doc)$/i.test(doc.file_name || '');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="btn-ghost p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] truncate max-w-lg">
                  {doc.title}
                </h1>
                {doc.category?.name && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                    {doc.category.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {doc.file_name} • {formatBytes(doc.file_size)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary py-2 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReplaceOpen(true)}
              className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace File</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="btn-danger py-2 px-3 text-xs inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Preview Area (3 Columns) */}
          <div className="lg:col-span-3">
            <DocumentPreview
              fileUrl={viewUrl}
              fileName={doc.file_name}
              fileType={doc.file_type}
              title={doc.title}
              onDownload={handleDownload}
            />
          </div>

          {/* Metadata Sidebar (1 Column) */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="card p-5 space-y-4">
              <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                File Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)] block mb-0.5">Category</span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {doc.category?.name || 'Uncategorized'}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--color-text-muted)] block mb-0.5">Date of Issue</span>
                  <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    {formatDate(doc.issue_date)}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--color-text-muted)] block mb-0.5">File Size</span>
                  <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-primary-500" />
                    {formatBytes(doc.file_size)}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--color-text-muted)] block mb-0.5">Uploaded On</span>
                  <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    {formatDateTime(doc.created_at)}
                  </span>
                </div>

                {doc.description && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block mb-0.5">Description</span>
                    <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Security Card */}
            <div className="card p-5 space-y-3 bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Storage Security</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Stored in private Supabase Storage bucket 'myvault-files' with Row Level Security.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
                Path: {doc.file_path}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Document Details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              className="input-field"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date of Issue / Achievement</label>
            <input
              type="date"
              value={editForm.issue_date || ''}
              onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn-primary"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Replace File Modal */}
      <Modal
        isOpen={isReplaceOpen}
        onClose={() => setIsReplaceOpen(false)}
        title="Replace File"
      >
        <form onSubmit={handleReplaceFile} className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Select a new file to replace the existing one. The new file will be uploaded to Supabase Storage, and the previous file will be permanently removed.
          </p>

          <div>
            <label className="label">Select New File (PDF, JPG, PNG, WEBP, DOCX)</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
              onChange={(e) => setReplacementFile(e.target.files?.[0] || null)}
              className="input-field py-2"
            />
          </div>

          {replacementFile && (
            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text)]">
              <span className="font-semibold">{replacementFile.name}</span> • {formatBytes(replacementFile.size)}
            </div>
          )}

          {isReplacing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
                <span>Uploading replacement to vault...</span>
                <span>{replaceProgress}%</span>
              </div>
              <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-200" style={{ width: `${replaceProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsReplaceOpen(false)}
              disabled={isReplacing}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReplacing || !replacementFile}
              className="btn-primary"
            >
              {isReplacing ? 'Uploading...' : 'Replace File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong className="text-[var(--color-text)]">"{doc.title}"</strong>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            This will permanently remove the record from your database and delete the file from your vault storage.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
